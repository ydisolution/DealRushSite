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
        p.paymentStatus === 'card_validated' && p.stripePaymentMethodId
      );
      
      const minParticipants = deal.minParticipants || 1;
      
      if (validParticipants.length < minParticipants) {
        await this.cancelDeal(deal, participants, 
          `הדיל לא הגיע למספר המשתתפים המינימלי (${minParticipants}). השתתפו ${validParticipants.length} אנשים בלבד.`
        );
        return;
      }

      await this.chargeParticipants(deal, validParticipants);
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

  private async chargeParticipants(deal: Deal, participants: Participant[]) {
    const currentTierIndex = deal.tiers.findIndex(t => 
      deal.participants >= t.minParticipants && deal.participants <= t.maxParticipants
    );
    
    const currentTier = currentTierIndex >= 0 ? deal.tiers[currentTierIndex] : deal.tiers[0];
    const finalPrice = currentTier?.price || 
      Math.round(deal.originalPrice * (1 - (currentTier?.discount || 0) / 100));

    console.log(`Charging ${participants.length} participants at final price: ₪${finalPrice}`);

    const results: ChargeResult[] = [];

    for (const participant of participants) {
      try {
        const user = participant.userId ? await storage.getUser(participant.userId) : null;
        const customerId = user?.stripeCustomerId;
        
        if (!customerId || !participant.stripePaymentMethodId) {
          results.push({
            participantId: participant.id,
            success: false,
            error: 'Missing Stripe customer or payment method',
          });
          continue;
        }

        const paymentIntent = await stripeService.chargeCustomer(
          customerId,
          participant.stripePaymentMethodId,
          finalPrice,
          `DealRush: ${deal.name}`
        );

        await storage.updateParticipant(participant.id, {
          paymentStatus: 'charged',
          stripePaymentIntentId: paymentIntent.id,
          pricePaid: finalPrice,
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
            finalPrice,
            paymentIntent.id
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
        if (email) {
          sendDealClosedNotification(
            email,
            deal.name,
            finalPrice,
            deal.originalPrice
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
      finalPrice,
      participantCount: successCount,
    });

    console.log(`Deal ${deal.id} closed: ${successCount} charged, ${failCount} failed, status: ${finalStatus}`);
  }

  async notifyTierUnlocked(deal: Deal, newTierIndex: number, oldPrice: number, newPrice: number) {
    const participants = await storage.getParticipantsByDeal(deal.id);
    const tier = deal.tiers[newTierIndex];
    
    if (!tier) return;

    for (const participant of participants) {
      const email = participant.email;
      if (email) {
        sendTierUnlockedNotification(
          email,
          deal.name,
          tier.discount,
          oldPrice,
          newPrice
        ).catch(err => {
          console.error(`Failed to send tier unlock notification to ${email}:`, err);
        });
      }
    }

    notificationService.broadcast({
      type: 'tier_unlocked',
      dealId: deal.id,
      dealName: deal.name,
      tierIndex: newTierIndex,
      discount: tier.discount,
      newPrice,
      participantCount: deal.participants,
    });

    console.log(`Notified ${participants.length} participants about tier unlock: ${tier.discount}% off`);
  }
}

export const dealClosureService = new DealClosureService();
