import Stripe from "stripe";

export async function getPaymentsAndPayouts(stripeApiKey: string, stripeAccountId: string) {
  if (!stripeApiKey) {
    throw new Error("Stripe API key not provided");
  }

  const stripe = new Stripe(stripeApiKey);
  const account = await stripe.accounts.retrieve(stripeAccountId);

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

  const stripe = new Stripe(stripeApiKey);

  await stripe.accounts.update(stripeAccountId, {
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

  const stripe = new Stripe(stripeApiKey);

  await stripe.accounts.update(stripeAccountId, {
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
