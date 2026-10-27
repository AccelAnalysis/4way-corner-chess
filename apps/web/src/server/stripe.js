import Stripe from 'stripe';
import { ApiError } from './http';

let stripeClient = null;

export function getStripeClient() {
  if (stripeClient) return stripeClient;
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new ApiError(503, 'STRIPE_NOT_CONFIGURED', 'Stripe test mode is not configured on this deployment.');
  }

  const requireTestMode = process.env.KANI_STRIPE_REQUIRE_TEST_MODE !== 'false';
  if (requireTestMode && !secretKey.startsWith('sk_test_')) {
    throw new ApiError(
      503,
      'STRIPE_TEST_MODE_REQUIRED',
      'Kani checkout is locked to Stripe test mode and refuses live secret keys.',
    );
  }

  stripeClient = new Stripe(secretKey, {
    appInfo: {
      name: 'Kani 4-Way Corner Chess',
      version: '0.2.0-alpha',
      url: 'https://kani-4way-corner-chess.vercel.app',
    },
  });
  return stripeClient;
}

export function getStripeWebhookSecret() {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new ApiError(503, 'STRIPE_WEBHOOK_NOT_CONFIGURED', 'The Stripe webhook signing secret is not configured.');
  }
  return secret;
}
