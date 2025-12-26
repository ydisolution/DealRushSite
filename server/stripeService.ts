import { getUncachableStripeClient } from './stripeClient';
import { storage } from './storage';

export class StripeService {
  async createCustomer(email: string, userId: string, name?: string) {
    const stripe = await getUncachableStripeClient();
    return await stripe.customers.create({
      email,
      name: name || undefined,
      metadata: { userId },
    });
  }

  async getOrCreateCustomer(userId: string, email: string, name?: string) {
    const user = await storage.getUser(userId);
    if (user?.stripeCustomerId) {
      const stripe = await getUncachableStripeClient();
      try {
        return await stripe.customers.retrieve(user.stripeCustomerId);
      } catch (e) {
      }
    }

    const customer = await this.createCustomer(email, userId, name);
    await storage.updateUser(userId, { stripeCustomerId: customer.id });
    return customer;
  }

  async createSetupIntent(customerId: string) {
    const stripe = await getUncachableStripeClient();
    return await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      usage: 'off_session',
    });
  }

  async createPaymentIntent(customerId: string, amount: number, currency: string = 'ils', metadata?: Record<string, string>) {
    const stripe = await getUncachableStripeClient();
    return await stripe.paymentIntents.create({
      customer: customerId,
      amount: Math.round(amount), // Amount is already in agorot (smallest currency unit)
      currency,
      metadata,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
    });
  }

  async chargePaymentMethod(
    customerId: string,
    paymentMethodId: string,
    amount: number,
    currency: string = 'ils',
    metadata?: Record<string, string>
  ) {
    const stripe = await getUncachableStripeClient();
    
    return await stripe.paymentIntents.create({
      customer: customerId,
      amount: Math.round(amount), // Amount is already in agorot (smallest currency unit)
      currency,
      payment_method: paymentMethodId,
      off_session: true,
      confirm: true,
      metadata,
    });
  }

  async getPaymentMethod(paymentMethodId: string) {
    const stripe = await getUncachableStripeClient();
    return await stripe.paymentMethods.retrieve(paymentMethodId);
  }

  async attachPaymentMethod(paymentMethodId: string, customerId: string) {
    const stripe = await getUncachableStripeClient();
    return await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });
  }

  async setDefaultPaymentMethod(customerId: string, paymentMethodId: string) {
    const stripe = await getUncachableStripeClient();
    return await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });
  }

  async listPaymentMethods(customerId: string) {
    const stripe = await getUncachableStripeClient();
    return await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });
  }

  async validateCard(paymentMethodId: string): Promise<{ valid: boolean; error?: string; last4?: string; brand?: string }> {
    try {
      const stripe = await getUncachableStripeClient();
      const pm = await stripe.paymentMethods.retrieve(paymentMethodId);
      
      if (!pm.card) {
        return { valid: false, error: 'Invalid payment method type' };
      }

      const now = new Date();
      const expMonth = pm.card.exp_month;
      const expYear = pm.card.exp_year;
      
      if (expYear < now.getFullYear() || 
          (expYear === now.getFullYear() && expMonth < now.getMonth() + 1)) {
        return { valid: false, error: 'Card has expired' };
      }

      return { 
        valid: true, 
        last4: pm.card.last4,
        brand: pm.card.brand,
      };
    } catch (error: any) {
      return { valid: false, error: error.message || 'Card validation failed' };
    }
  }

  async refundPayment(
    paymentIntentId: string, 
    amount?: number, 
    reason: 'duplicate' | 'fraudulent' | 'requested_by_customer' = 'requested_by_customer',
    metadata?: Record<string, string>
  ) {
    const stripe = await getUncachableStripeClient();
    return await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount) : undefined, // Amount is already in agorot if provided
      reason,
      metadata,
    });
  }

  async chargeWithRetry(
    customerId: string,
    paymentMethodId: string,
    amount: number,
    currency: string = 'ils',
    metadata?: Record<string, string>,
    maxRetries: number = 3
  ) {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`💳 Charge attempt ${attempt}/${maxRetries} for customer ${customerId}`);
        const paymentIntent = await this.chargePaymentMethod(
          customerId,
          paymentMethodId,
          amount,
          currency,
          metadata
        );
        console.log(`✅ Charge successful on attempt ${attempt}`);
        return paymentIntent;
      } catch (error: any) {
        lastError = error;
        console.error(`❌ Charge attempt ${attempt} failed:`, error.message);
        
        // Don't retry for certain errors
        if (error.code === 'card_declined' || 
            error.code === 'insufficient_funds' ||
            error.code === 'incorrect_cvc') {
          throw error;
        }
        
        // Wait before retrying (exponential backoff)
        if (attempt < maxRetries) {
          const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
          console.log(`⏳ Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
    
    throw lastError;
  }
}

export const stripeService = new StripeService();
