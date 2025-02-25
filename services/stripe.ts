import Stripe from "stripe";
import { env } from "@/lib/env";

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-01-27.acacia",
});

export async function createCustomer({ clerkOrgId, name }: { clerkOrgId: string; name: string }) {
  try {
    return stripe.customers.create({
      name,
      metadata: {
        clerkOrgId,
      },
    });
  } catch (error) {
    console.error("Failed to create Stripe customer:", error);
    throw error;
  }
}

export async function deleteCustomer(customerId: string) {
  try {
    return stripe.customers.del(customerId);
  } catch (error) {
    console.error("Failed to delete Stripe customer:", error);
    throw error;
  }
}

export async function createTrialSubscription(customerId: string) {
  try {
    return await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: env.STRIPE_FREE_PRICE_ID }],
      trial_settings: {
        end_behavior: {
          missing_payment_method: "cancel",
        },
      },
      trial_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
      cancel_at_period_end: true,
    });
  } catch (error) {
    console.error("Failed to create Trial Subscription:", error);
    throw error;
  }
}

export async function cancelSubscription(stripeSubscriptionId: string) {
  try {
    await stripe.subscriptions.cancel(stripeSubscriptionId);
  } catch (error) {
    console.error("Failed to cancel Stripe subscription:", error);
    throw error;
  }
}

export async function getPaymentsAndPayouts(stripeApiKey: string, stripeAccountId: string) {
  if (!stripeApiKey) {
    throw new Error("Stripe API key not provided");
  }

  const stripeInstance = new Stripe(stripeApiKey);
  const account = await stripeInstance.accounts.retrieve(stripeAccountId);

  return {
    payments: account.charges_enabled,
    payouts: account.payouts_enabled,
    reason: account.requirements?.disabled_reason ?? undefined,
  };
}

export async function pausePayments(stripeApiKey: string, stripeAccountId: string) {
  if (!stripeApiKey) {
    throw new Error("Stripe API key not provided");
  }

  const stripeInstance = new Stripe(stripeApiKey);

  await stripeInstance.accounts.update(stripeAccountId, {
    // @ts-ignore preview feature
    risk_controls: {
      charges: {
        pause_requested: true,
      },
    },
  });
}

export async function resumePayments(stripeApiKey: string, stripeAccountId: string) {
  if (!stripeApiKey) {
    throw new Error("Stripe API key not provided");
  }

  const stripeInstance = new Stripe(stripeApiKey);

  await stripeInstance.accounts.update(stripeAccountId, {
    // @ts-ignore preview feature
    risk_controls: {
      payouts: {
        pause_requested: false,
      },
      charges: {
        pause_requested: false,
      },
    },
  });
}
