import { storage } from './storage';
import { stripeService } from './stripeService';
import { 
  sendDealClosedNotification, 
  sendDealCancelledNotification,
  sendPaymentChargedNotification,
  sendTierUnlockedNotification 
} from './email';
import { smsService } from './smsService';
import { whatsappService } from './whatsappService';
import { notificationService } from './websocket';
import type { Deal, Participant } from '@shared/schema';

interface ChargeResult {
  participantId: string;
  success: boolean;
  error?: string;
  paymentIntentId?: string;
}

class DealClosureService {
  private scheduledClosures: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private processingDeals: Set<string> = new Set();

  async start() {
    console.log('Deal closure service started');
    await this.scheduleAllActiveDeals();
  }

  stop() {
    for (const [dealId, timeout] of this.scheduledClosures) {
      clearTimeout(timeout);
      console.log(`Cancelled scheduled closure for deal ${dealId}`);
    }
    this.scheduledClosures.clear();
    console.log('Deal closure service stopped');
  }

  private async scheduleAllActiveDeals() {
    try {
      const activeDeals = await storage.getActiveDeals();
      console.log(`Found ${activeDeals.length} active deals to schedule`);
      
      for (const deal of activeDeals) {
        this.scheduleDealClosure(deal);
      }
    } catch (error) {
      console.error('Error scheduling active deals:', error);
    }
  }

  scheduleDealClosure(deal: Deal) {
    if (this.scheduledClosures.has(deal.id)) {
      clearTimeout(this.scheduledClosures.get(deal.id)!);
      this.scheduledClosures.delete(deal.id);
    }

    if (deal.isActive !== 'true' || deal.status !== 'active') {
      return;
    }

    const endTime = new Date(deal.endTime);
    const now = new Date();
    const msUntilClose = endTime.getTime() - now.getTime();

    if (msUntilClose <= 0) {
      console.log(`Deal ${deal.id} (${deal.name}) has already expired, closing now`);
      this.closeDeal(deal);
      return;
    }

    const timeout = setTimeout(() => {
      console.log(`Timer fired for deal ${deal.id} (${deal.name})`);
      this.scheduledClosures.delete(deal.id);
      this.closeDeal(deal);
    }, msUntilClose);

    this.scheduledClosures.set(deal.id, timeout);
    
    const closeDate = endTime.toLocaleString('he-IL');
    console.log(`Scheduled deal ${deal.id} (${deal.name}) to close at ${closeDate} (in ${Math.round(msUntilClose / 1000)} seconds)`);
  }

  cancelScheduledClosure(dealId: string) {
    if (this.scheduledClosures.has(dealId)) {
      clearTimeout(this.scheduledClosures.get(dealId)!);
      this.scheduledClosures.delete(dealId);
      console.log(`Cancelled scheduled closure for deal ${dealId}`);
    }
  }

  async closeDeal(deal: Deal) {
    if (this.processingDeals.has(deal.id)) {
      console.log(`Deal ${deal.id} is already being processed, skipping`);
      return;
    }
    
    this.processingDeals.add(deal.id);
    
    try {
      const freshDeal = await storage.getDeal(deal.id);
      if (!freshDeal || freshDeal.isActive !== 'true' || freshDeal.status !== 'active') {
        console.log(`Deal ${deal.id} is no longer active, skipping`);
        return;
      }
      
      await storage.updateDeal(deal.id, { status: 'closing' });
      
      console.log(`Processing deal closure: ${deal.name} (${deal.id})`);
    
      const participants = await storage.getParticipantsByDeal(deal.id);
      const validParticipants = participants.filter(p => 
        (p.paymentStatus === 'card_validated' && p.stripePaymentMethodId) ||
        p.paymentStatus === 'pending_payment' ||
        p.paymentStatus === 'pending_paypal'  // Include PayPal pending payments
      );
      
      // Calculate total units - each participant record now represents 1 unit
      const totalUnitsSold = participants.length; // Each record is 1 unit
      const validUnitsSold = validParticipants.length; // Each valid record is 1 unit
      
      console.log(`Deal ${deal.id}: Total participants: ${participants.length}, Valid: ${validParticipants.length}, Total units: ${totalUnitsSold}, Valid units: ${validUnitsSold}`);
      
      const minUnits = deal.minParticipants || 1;
      
      console.log(`Deal ${deal.id} closure check: Total units=${totalUnitsSold}, Valid units=${validUnitsSold}, Min required=${minUnits}`);
      
      // Check if we have enough VALID units (not just total)
      if (validUnitsSold < minUnits) {
        console.log(`Deal ${deal.id} CANCELLED: Not enough valid units. Required: ${minUnits}, Got: ${validUnitsSold}`);
        await this.cancelDeal(deal, participants, 
          `הדיל לא הגיע לכמות היחידות המינימלית (${minUnits}). נמכרו ${validUnitsSold} יחידות תקפות בלבד.`
        );
        return;
      }
      
      console.log(`Deal ${deal.id} PROCEEDING: Valid units ${validUnitsSold} >= minimum ${minUnits}`);

      await this.chargeParticipants(deal, validParticipants, totalUnitsSold);
    } catch (error) {
      console.error(`Error closing deal ${deal.id}:`, error);
      await storage.updateDeal(deal.id, { status: 'active' });
      this.scheduleDealClosure(deal);
    } finally {
      this.processingDeals.delete(deal.id);
    }
  }

  private async cancelDeal(deal: Deal, participants: Participant[], reason: string) {
    console.log(`Cancelling deal ${deal.id}: ${reason}`);

    await storage.updateDeal(deal.id, {
      isActive: 'false',
      status: 'cancelled',
    });

    // Process refunds for charged participants
    const refundResults = await this.processRefunds(deal, participants, reason);
    console.log(`Refund results: ${refundResults.success} succeeded, ${refundResults.failed} failed`);

    for (const participant of participants) {
      const refundStatus = refundResults.details.get(participant.id);
      
      await storage.updateParticipant(participant.id, {
        paymentStatus: refundStatus?.refunded ? 'refunded' : 'cancelled',
      });

      const email = participant.email;
      if (email) {
        const refundMessage = refundStatus?.refunded 
          ? ` החזר כספי של ₪${refundStatus.amount} יזוכה בכרטיס שלך תוך 5-10 ימי עסקים.`
          : '';
        
        sendDealCancelledNotification(
          email, 
          deal.name, 
          reason + refundMessage
        ).catch(err => {
          console.error(`Failed to send cancellation email to ${email}:`, err);
        });
      }
    }

    notificationService.broadcast({
      type: 'deal_cancelled',
      dealId: deal.id,
      dealName: deal.name,
      reason,
    });

    console.log(`Deal ${deal.id} cancelled, notified ${participants.length} participants`);
  }

  private async processRefunds(
    deal: Deal, 
    participants: Participant[], 
    reason: string
  ): Promise<{ success: number; failed: number; details: Map<string, { refunded: boolean; amount?: number; error?: string }> }> {
    const results = new Map<string, { refunded: boolean; amount?: number; error?: string }>();
    let successCount = 0;
    let failedCount = 0;

    for (const participant of participants) {
      // Only refund if payment was charged
      if (participant.paymentStatus !== 'charged' || !participant.stripePaymentIntentId) {
        results.set(participant.id, { refunded: false });
        continue;
      }

      try {
        console.log(`💰 Processing refund for participant ${participant.id}`);
        
        const refundAmountShekels = participant.chargedAmount || participant.pricePaid || 0;
        const refundAmountAgorot = refundAmountShekels * 100; // Convert to agorot for Stripe
        
        const refund = await stripeService.refundPayment(
          participant.stripePaymentIntentId,
          refundAmountAgorot > 0 ? refundAmountAgorot : undefined,
          'requested_by_customer',
          {
            dealId: deal.id,
            dealName: deal.name,
            participantId: participant.id,
            reason: reason,
          }
        );

        results.set(participant.id, { 
          refunded: true, 
          amount: refund.amount / 100 
        });
        successCount++;
        console.log(`✅ Refund successful: ₪${refund.amount / 100}`);
      } catch (error: any) {
        console.error(`❌ Refund failed for participant ${participant.id}:`, error.message);
        results.set(participant.id, { 
          refunded: false, 
          error: error.message 
        });
        failedCount++;
      }
    }

    return { success: successCount, failed: failedCount, details: results };
  }

  private async chargeParticipants(deal: Deal, participants: Participant[], totalUnitsSold: number) {
    const sortedTiers = [...deal.tiers].sort((a, b) => a.minParticipants - b.minParticipants);
    
    // Use VALID participants count (those being charged) for tier calculation
    const validUnitsForTier = participants.length;
    
    let currentTier = sortedTiers[0];
    let currentTierIndex = 0;
    for (let i = sortedTiers.length - 1; i >= 0; i--) {
      if (validUnitsForTier >= sortedTiers[i].minParticipants) {
        currentTier = sortedTiers[i];
        currentTierIndex = i;
        break;
      }
    }
    
    console.log(`Deal ${deal.id} tier calculation: Valid units=${validUnitsForTier}, Selected tier=${currentTierIndex + 1} (requires ${currentTier.minParticipants} units, discount=${currentTier.discount}%)`);
    
    const finalBasePrice = currentTier?.price || 
      Math.round(deal.originalPrice * (1 - (currentTier?.discount || 0) / 100));
    
    const discountPercent = currentTier?.discount || 0;

    console.log(`Deal ${deal.id}: Total units sold: ${totalUnitsSold}, Tier: ${currentTierIndex + 1}, Base price: ₪${finalBasePrice}, Discount: ${discountPercent}%`);

    const results: ChargeResult[] = [];
    const participantPrices: Map<string, number> = new Map();

    for (const participant of participants) {
      try {
        const quantity = participant.quantity || 1;
        const unitPrice = finalBasePrice;
        const totalPriceShekels = unitPrice * quantity;
        const totalPriceAgorot = totalPriceShekels * 100; // Convert to agorot for Stripe
        
        participantPrices.set(participant.id, totalPriceShekels);
        
        const user = participant.userId ? await storage.getUser(participant.userId) : null;
        const customerId = user?.stripeCustomerId;
        
        if (!customerId || !participant.stripePaymentMethodId) {
          if (participant.paymentStatus === 'pending_payment' || participant.paymentStatus === 'pending_paypal') {
            results.push({
              participantId: participant.id,
              success: true,
            });
            await storage.updateParticipant(participant.id, {
              pricePaid: totalPriceShekels,
              paymentStatus: 'charged',  // Mark as charged even without Stripe
              chargedAmount: totalPriceShekels,
            });
          } else {
            results.push({
              participantId: participant.id,
              success: false,
              error: 'Missing Stripe customer or payment method',
            });
          }
          continue;
        }

        const paymentIntent = await stripeService.chargeWithRetry(
          customerId,
          participant.stripePaymentMethodId,
          totalPriceAgorot, // Send agorot to Stripe
          'ils',
          { dealId: deal.id, dealName: deal.name, quantity: String(quantity) },
          3 // max retries
        );

        await storage.updateParticipant(participant.id, {
          paymentStatus: 'charged',
          stripePaymentIntentId: paymentIntent.id,
          pricePaid: totalPriceShekels,
        });

        results.push({
          participantId: participant.id,
          success: true,
          paymentIntentId: paymentIntent.id,
        });

        const email = participant.email;
        if (email) {
          sendPaymentChargedNotification(
            email,
            deal.name,
            totalPriceShekels, // Send in shekels for email display
            participant.cardLast4 || paymentIntent.id
          ).catch(err => {
            console.error(`Failed to send payment notification to ${email}:`, err);
          });
        }

      } catch (error: any) {
        console.error(`Failed to charge participant ${participant.id}:`, error);
        
        await storage.updateParticipant(participant.id, {
          paymentStatus: 'failed',
        });

        results.push({
          participantId: participant.id,
          success: false,
          error: error.message || 'Payment failed',
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    const failedParticipants = results.filter(r => !r.success);

    const finalStatus = failCount > 0 && successCount > 0 
      ? 'partially_failed' 
      : failCount > 0 
        ? 'payment_failed'
        : 'closed';

    await storage.updateDeal(deal.id, {
      isActive: 'false',
      status: finalStatus,
    });

    for (const participant of participants) {
      const result = results.find(r => r.participantId === participant.id);
      if (result?.success) {
        const email = participant.email;
        const participantPrice = participantPrices.get(participant.id) || finalBasePrice;
        if (email) {
          sendDealClosedNotification(
            email,
            deal.name,
            participantPrice,
            deal.originalPrice * (participant.quantity || 1),
            participant.position || 0,
            discountPercent,
            participant.quantity || 1
          )
            .then(() => {
              console.log(`[EMAIL][SUCCESS] Deal closed notification sent to ${email} for deal ${deal.name}`);
            })
            .catch(err => {
              console.error(`[EMAIL][FAIL] Failed to send deal closed notification to ${email} for deal ${deal.name}:`, err);
            });
        }
        // Send SMS notification if phone available
        const phone = participant.phone;
        if (phone && smsService.isEnabled()) {
          smsService.sendDealClosedSMS(phone, deal.name, participantPrice).catch(err => {
            console.error(`Failed to send SMS to ${phone}:`, err);
          });
        }
      }
    }

    if (failCount > 0) {
      console.warn(`Deal ${deal.id} had ${failCount} payment failures:`, 
        failedParticipants.map(p => ({ id: p.participantId, error: p.error }))
      );
    }

    notificationService.broadcast({
      type: 'deal_closed',
      dealId: deal.id,
      dealName: deal.name,
      finalPrice: finalBasePrice,
      originalPrice: deal.originalPrice,
      totalUnitsSold,
      discountPercent,
      participantCount: successCount,
    });

    console.log(`Deal ${deal.id} closed: ${successCount} charged, ${failCount} failed, status: ${finalStatus}`);

    // Create orders for successfully charged participants
    if (successCount > 0) {
      await this.createOrdersForDeal(deal, participants, results);
    }
  }

  private async createOrdersForDeal(deal: Deal, participants: Participant[], chargeResults: ChargeResult[]) {
    console.log(`Creating orders for deal ${deal.id}...`);
    
    const successfulParticipants = participants.filter(p => 
      chargeResults.find(r => r.participantId === p.id && r.success)
    );

    for (const participant of successfulParticipants) {
      try {
        const order = await storage.createOrder({
          participantId: participant.id,
          dealId: deal.id,
          supplierId: deal.supplierId || '',
          customerName: participant.name,
          customerEmail: participant.email || null,
          customerPhone: participant.phone || null,
          shippingAddress: participant.shippingAddress || null,
          shippingCity: participant.shippingCity || null,
          shippingZip: participant.shippingZipCode || null,
          notesFromCustomer: null,
          status: 'pending',
          supplierNotes: null,
          scheduledDeliveryDate: null,
          outForDeliveryDate: null,
          deliveredDate: null,
          trackingNumber: null,
          carrier: null,
          shippingMethod: null,
        });

        // Create initial fulfillment event
        await storage.createFulfillmentEvent({
          orderId: order.id,
          type: 'purchase_received',
          message: `הזמנה נקלטה במערכת - ${participant.quantity || 1} יחידות`,
          createdBySupplierId: deal.supplierId || null,
        });

        // Send WhatsApp notification to customer about new order
        if (participant.phone && whatsappService.isEnabled()) {
          const chargeAmount = participant.pricePaid || 0;
          
          whatsappService.sendOrderConfirmation(
            participant.phone,
            participant.name,
            order.id,
            deal.name,
            participant.quantity || 1,
            chargeAmount / 100, // Convert from agorot to shekels
            participant.position || 0
          ).catch(err => console.error(`Failed to send WhatsApp to ${participant.phone}:`, err));
        }

        console.log(`Created order ${order.id} for participant ${participant.id}`);
      } catch (error) {
        console.error(`Failed to create order for participant ${participant.id}:`, error);
      }
    }

    console.log(`Created ${successfulParticipants.length} orders for deal ${deal.id}`);
  }

  async notifyTierUnlocked(deal: Deal, newTierIndex: number, oldPrice: number, newPrice: number) {
    const participants = await storage.getParticipantsByDeal(deal.id);
    const tier = deal.tiers[newTierIndex];
    
    if (!tier) return;

    const tierNumber = newTierIndex + 1;
    const discountPercent = tier.discount;

    // Group participants by email to send one consolidated email per customer
    const participantsByEmail = new Map<string, { participants: Participant[], totalUnits: number }>();
    
    for (const participant of participants) {
      if (participant.email) {
        const existing = participantsByEmail.get(participant.email);
        if (existing) {
          existing.participants.push(participant);
          existing.totalUnits += (participant.quantity || 1);
        } else {
          participantsByEmail.set(participant.email, {
            participants: [participant],
            totalUnits: participant.quantity || 1
          });
        }
      }
    }

    // Send one email per unique customer email with their total purchase summary
    for (const [email, data] of participantsByEmail.entries()) {
      const totalUnits = data.totalUnits;
      const firstParticipant = data.participants[0];
      
      sendTierUnlockedNotification(
        email,
        deal.name,
        tierNumber,
        oldPrice,
        newPrice,
        discountPercent,
        totalUnits,
        deal.originalPrice
      )
        .then(() => {
          console.log(`[EMAIL][SUCCESS] Tier unlocked notification sent to ${email} for deal ${deal.name}, tier ${tierNumber}`);
        })
        .catch(err => {
          console.error(`[EMAIL][FAIL] Failed to send tier unlock notification to ${email} for deal ${deal.name}, tier ${tierNumber}:`, err);
        });
      
      // Send SMS notification for tier unlock (only once per phone number)
      const phone = firstParticipant.phone;
      if (phone && smsService.isEnabled()) {
        smsService.sendTierUnlockedSMS(phone, deal.name, newPrice, discountPercent).catch(err => {
          console.error(`Failed to send SMS to ${phone}:`, err);
        });
      }
    }

    console.log(`Notified ${participantsByEmail.size} unique customers (${participants.length} total units) about tier unlock: ${tier.discount}% off`);

    notificationService.broadcast({
      type: 'tier_unlocked',
      dealId: deal.id,
      dealName: deal.name,
      tierNumber,
      oldPrice,
      newPrice,
      discountPercent,
    });

    console.log(`Notified ${participants.length} participants about tier unlock: ${tier.discount}% off`);
  }
}

export const dealClosureService = new DealClosureService();
