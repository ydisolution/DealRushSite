import { getStripeSync, getUncachableStripeClient } from './stripeClient';

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string, uuid: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'This usually means express.json() parsed the body before reaching this handler. ' +
        'FIX: Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    // Verify webhook signature for security
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (webhookSecret) {
      try {
        const stripe = await getUncachableStripeClient();
        const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
        console.log('✅ Webhook signature verified:', event.type);
        
        // Process verified webhook event
        const sync = await getStripeSync();
        await sync.processWebhook(payload, signature, uuid);
      } catch (err: any) {
        console.error('❌ Webhook signature verification failed:', err.message);
        throw new Error(`Webhook signature verification failed: ${err.message}`);
      }
    } else {
      console.warn('⚠️  STRIPE_WEBHOOK_SECRET not set - webhook verification disabled (NOT RECOMMENDED FOR PRODUCTION)');
      const sync = await getStripeSync();
      await sync.processWebhook(payload, signature, uuid);
    }
  }
}
