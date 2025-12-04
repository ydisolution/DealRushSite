import { storage } from './storage';
import { stripeService } from './stripeService';
import { 
  sendDealClosedNotification, 
  sendDealCancelledNotification,
  sendPaymentChargedNotification,
  sendTierUnlockedNotification 
} from './email';
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
        p.paymentStatus === 'pending_payment'
      );
      
      const totalUnitsSold = participants.reduce((sum, p) => sum + (p.quantity || 1), 0);
      const validUnitsSold = validParticipants.reduce((sum, p) => sum + (p.quantity || 1), 0);
      
      console.log(`Deal ${deal.id}: Total participants: ${participants.length}, Valid: ${validParticipants.length}, Total units: ${totalUnitsSold}, Valid units: ${validUnitsSold}`);
      
      const minUnits = deal.minParticipants || 1;
      
      if (validUnitsSold < minUnits) {
        await this.cancelDeal(deal, participants, 
          `הדיל לא הגיע לכמות היחידות המינימלית (${minUnits}). נמכרו ${validUnitsSold} יחידות בלבד.`
        );
        return;
      }

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

    for (const participant of participants) {
      await storage.updateParticipant(participant.id, {
        paymentStatus: 'cancelled',
      });

      const email = participant.email;
      if (email) {
        sendDealCancelledNotification(email, deal.name, reason).catch(err => {
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

  private async chargeParticipants(deal: Deal, participants: Participant[], totalUnitsSold: number) {
    const sortedTiers = [...deal.tiers].sort((a, b) => a.minParticipants - b.minParticipants);
    
    let currentTier = sortedTiers[0];
    let currentTierIndex = 0;
    for (let i = sortedTiers.length - 1; i >= 0; i--) {
      if (totalUnitsSold >= sortedTiers[i].minParticipants) {
        currentTier = sortedTiers[i];
        currentTierIndex = i;
        break;
      }
    }
    
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
        const totalPrice = unitPrice * quantity;
        
        participantPrices.set(participant.id, totalPrice);
        
        const user = participant.userId ? await storage.getUser(participant.userId) : null;
        const customerId = user?.stripeCustomerId;
        
        if (!customerId || !participant.stripePaymentMethodId) {
          if (participant.paymentStatus === 'pending_payment') {
            results.push({
              participantId: participant.id,
              success: true,
            });
            await storage.updateParticipant(participant.id, {
              pricePaid: totalPrice,
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

        const paymentIntent = await stripeService.chargePaymentMethod(
          customerId,
          participant.stripePaymentMethodId,
          totalPrice,
          'ils',
          { dealId: deal.id, dealName: deal.name, quantity: String(quantity) }
        );

        await storage.updateParticipant(participant.id, {
          paymentStatus: 'charged',
          stripePaymentIntentId: paymentIntent.id,
          pricePaid: totalPrice,
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
            totalPrice,
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
          ).catch(err => {
            console.error(`Failed to send deal closed notification to ${email}:`, err);
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
      totalUnitsSold,
      discountPercent,
      participantCount: successCount,
    });

    console.log(`Deal ${deal.id} closed: ${successCount} charged, ${failCount} failed, status: ${finalStatus}`);
  }

  async notifyTierUnlocked(deal: Deal, newTierIndex: number, oldPrice: number, newPrice: number) {
    const participants = await storage.getParticipantsByDeal(deal.id);
    const tier = deal.tiers[newTierIndex];
    
    if (!tier) return;

    const tierNumber = newTierIndex + 1;
    const discountPercent = tier.discount;

    for (const participant of participants) {
      const email = participant.email;
      if (email) {
        sendTierUnlockedNotification(
          email,
          deal.name,
          tierNumber,
          oldPrice,
          newPrice,
          discountPercent
        ).catch(err => {
          console.error(`Failed to send tier unlock notification to ${email}:`, err);
        });
      }
    }

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
