/**
 * Server-side Stripe helpers.
 * Uses lazy initialization so env vars are read on first use, not at import time.
 */
import Stripe from "stripe";
import { STRIPE_PRICES, type Plan } from "@/config/stripe";

let _stripe: Stripe | null | undefined;

/**
 * Get the Stripe instance (lazy init).
 * Returns null if STRIPE_SECRET_KEY is not set.
 */
export function getStripe(): Stripe | null {
  if (_stripe === undefined) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      console.warn("STRIPE_SECRET_KEY not set — Stripe features disabled");
      _stripe = null;
    } else {
      _stripe = new Stripe(key, { typescript: true });
    }
  }
  return _stripe;
}

function ensureStripe(): Stripe {
  const s = getStripe();
  if (!s) throw new Error("Stripe not configured — set STRIPE_SECRET_KEY in Railway");
  return s;
}

function getAppUrl(): string {
  return process.env.APP_URL || "https://novacv-production.up.railway.app";
}

/**
 * Create or retrieve a Stripe customer for a user.
 */
export async function getOrCreateCustomer(
  email: string,
  clerkId: string,
  existingCustomerId?: string | null
): Promise<string> {
  const stripe = ensureStripe();
  if (existingCustomerId) return existingCustomerId;

  const customer = await stripe.customers.create({
    email,
    metadata: { clerkId },
  });

  return customer.id;
}

/**
 * Create a Stripe Checkout session for a plan purchase.
 */
export async function createCheckoutSession(
  customerId: string,
  plan: Plan,
  userId: string
): Promise<string> {
  const stripe = ensureStripe();
  const priceId = STRIPE_PRICES[plan];
  if (!priceId) throw new Error(`No price ID configured for plan: ${plan}`);

  const isLifetime = plan === "lifetime";

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: isLifetime ? "payment" : "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${getAppUrl()}/app/dashboard/billing?success=true`,
    cancel_url: `${getAppUrl()}/app/dashboard/billing?canceled=true`,
    metadata: {
      userId,
      plan,
    },
    ...(isLifetime
      ? {}
      : {
          subscription_data: {
            metadata: { userId, plan },
          },
        }),
  });

  return session.url!;
}

/**
 * Create a Stripe Customer Portal session for managing subscriptions.
 */
export async function createPortalSession(
  customerId: string
): Promise<string> {
  const stripe = ensureStripe();

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${getAppUrl()}/app/dashboard/billing`,
  });

  return session.url!;
}
