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
  private checkInterval: ReturnType<typeof setInterval> | null = null;
  private readonly CHECK_INTERVAL_MS = 60000;
  private processingDeals: Set<string> = new Set();

  start() {
    if (this.checkInterval) return;
    
    console.log('Deal closure service started');
    this.checkInterval = setInterval(() => this.checkExpiredDeals(), this.CHECK_INTERVAL_MS);
    this.checkExpiredDeals();
  }

  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('Deal closure service stopped');
    }
  }

  async checkExpiredDeals() {
    try {
      const now = new Date();
      const expiredDeals = await storage.getActiveDealsClosingBefore(now);
      
      for (const deal of expiredDeals) {
        if (!this.processingDeals.has(deal.id)) {
          await this.closeDeal(deal);
        }
      }
    } catch (error) {
      console.error('Error checking expired deals:', error);
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

    console.log(`Deal ${deal.id} cancelled successfully`);
  }

  private async chargeParticipants(deal: Deal, participants: Participant[]) {
    console.log(`Charging ${participants.length} participants for deal ${deal.id}`);
    
    const finalPrice = deal.currentPrice;
    const results: ChargeResult[] = [];

    for (const participant of participants) {
      try {
        const user = participant.userId ? await storage.getUser(participant.userId) : null;
        
        if (!user?.stripeCustomerId || !participant.stripePaymentMethodId) {
          results.push({
            participantId: participant.id,
            success: false,
            error: 'Missing Stripe customer or payment method',
          });
          continue;
        }

        const paymentIntent = await stripeService.chargePaymentMethod(
          user.stripeCustomerId,
          participant.stripePaymentMethodId,
          finalPrice,
          'ils',
          {
            dealId: deal.id,
            participantId: participant.id,
            dealName: deal.name,
          }
        );

        await storage.updateParticipant(participant.id, {
          paymentStatus: 'charged',
          stripePaymentIntentId: paymentIntent.id,
          pricePaid: finalPrice,
        });

        const email = participant.email;
        if (email) {
          sendPaymentChargedNotification(
            email,
            deal.name,
            finalPrice,
            participant.cardLast4 || '****'
          ).catch(err => {
            console.error(`Failed to send payment confirmation to ${email}:`, err);
          });
        }

        results.push({
          participantId: participant.id,
          success: true,
          paymentIntentId: paymentIntent.id,
        });
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
    const discountPercent = tier.discount;

    for (const participant of participants) {
      const email = participant.email;
      if (email) {
        sendTierUnlockedNotification(
          email,
          deal.name,
          newTierIndex + 1,
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
      tierNumber: newTierIndex + 1,
      oldPrice,
      newPrice,
      discountPercent,
    });

    console.log(`Tier ${newTierIndex + 1} unlocked for deal ${deal.id}`);
  }
}

export const dealClosureService = new DealClosureService();
