import Stripe from 'stripe';

let connectionSettings: any;

async function getCredentials(): Promise<{ publishableKey: string; secretKey: string } | null> {
  // Fallback to environment variables if not on Replit
  const stripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  
  if (stripePublishableKey && stripeSecretKey) {
    console.log('✅ Using Stripe keys from environment variables');
    return {
      publishableKey: stripePublishableKey,
      secretKey: stripeSecretKey,
    };
  }

  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? 'depl ' + process.env.WEB_REPL_RENEWAL
      : null;

  if (!xReplitToken) {
    console.warn('⚠️  Stripe not configured (no Replit token or environment variables)');
    return null;
  }

  const connectorName = 'stripe';
  const isProduction = process.env.REPLIT_DEPLOYMENT === '1';
  const targetEnvironment = isProduction ? 'production' : 'development';

  const url = new URL(`https://${hostname}/api/v2/connection`);
  url.searchParams.set('include_secrets', 'true');
  url.searchParams.set('connector_names', connectorName);
  url.searchParams.set('environment', targetEnvironment);

  const response = await fetch(url.toString(), {
    headers: {
      'Accept': 'application/json',
      'X_REPLIT_TOKEN': xReplitToken
    }
  });

  const data = await response.json();
  
  connectionSettings = data.items?.[0];

  if (!connectionSettings || (!connectionSettings.settings.publishable || !connectionSettings.settings.secret)) {
    throw new Error(`Stripe ${targetEnvironment} connection not found`);
  }

  return {
    publishableKey: connectionSettings.settings.publishable,
    secretKey: connectionSettings.settings.secret,
  };
}

export async function getUncachableStripeClient() {
  try {
    const credentials = await getCredentials();
    if (!credentials) {
      console.warn('⚠️  Stripe not configured, using mock client');
      return null;
    }
    return new Stripe(credentials.secretKey, {
      apiVersion: '2025-08-27.basil',
    });
  } catch (error) {
    console.warn('⚠️  Stripe not configured, using mock client');
    // Return null for development without Stripe
    return null;
  }
}

export async function getStripePublishableKey() {
  try {
    const credentials = await getCredentials();
    if (!credentials) {
      console.warn('⚠️  Stripe publishable key not configured');
      return null;
    }
    return credentials.publishableKey;
  } catch (error) {
    console.warn('⚠️  Stripe publishable key not configured');
    // Return null for development without Stripe
    return null;
  }
}

export async function getStripeSecretKey() {
  const { secretKey } = await getCredentials();
  return secretKey;
}

let stripeSync: any = null;

export async function getStripeSync() {
  if (!stripeSync) {
    const { StripeSync } = await import('stripe-replit-sync');
    const secretKey = await getStripeSecretKey();

    stripeSync = new StripeSync({
      poolConfig: {
        connectionString: process.env.DATABASE_URL!,
        max: 2,
      },
      stripeSecretKey: secretKey,
    });
  }
  return stripeSync;
}
