import Stripe from "stripe";
import { env } from "@/lib/env";

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-01-27.acacia",
});

interface CreateCustomerParams {
  clerkOrgId: string;
  name: string;
}

export async function createCustomer({ clerkOrgId, name }: CreateCustomerParams) {
  return stripe.customers.create({
    name,
    metadata: {
      clerkOrgId,
    },
  });
}

export async function deleteCustomer(customerId: string) {
  return stripe.customers.del(customerId);
}

export async function createFreeSubscription(customerId: string, orgId: string) {
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: env.STRIPE_FREE_PRICE_ID }],
    trial_settings: {
      end_behavior: {
        missing_payment_method: "cancel",
      },
    },
    metadata: {
      orgId,
    },
  });

  return subscription;
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
