import { NextResponse } from "next/server";
import { stripe } from "@/services/stripe";
import { env } from "@/lib/env";
import Stripe from "stripe";
import * as organizationsService from "@/services/organisations";
import * as subscriptionsService from "@/services/subscriptions";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new NextResponse("No signature", { status: 400 });
  }

  try {
    const event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);
    const subscription = event.data.object as Stripe.Subscription;

    switch (event.type) {
      case "customer.subscription.created":
        return handleSubscriptionCreated(subscription);
      case "customer.subscription.updated":
        return handleSubscriptionUpdated(subscription);
      case "customer.subscription.deleted":
        return handleSubscriptionCancelled(subscription);
      default:
        return new NextResponse(null, { status: 200 });
    }
  } catch (err) {
    console.error("Error processing webhook:", err);
    return new NextResponse(`Webhook Error: ${err instanceof Error ? err.message : "Unknown Error"}`, { status: 400 });
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const organisation = await organizationsService.getOrganizationByStripeCustomerId(subscription.customer.toString());

  // Ideally, this should never happen
  if (!organisation?.id) {
    throw new Error("No organisation found for Stripe customer");
  }

  await subscriptionsService.createTrialSubscription(organisation.id, organisation.clerkOrgId, subscription);
  return new NextResponse(null, { status: 200 });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const updated = await subscriptionsService.updateSubscription(subscription.id, {
    trial_end: subscription.trial_end,
    status: subscription.status,
  });

  if (!updated) {
    throw new Error(`No subscription found to update with Stripe subscription id ${subscription.id}`);
  }

  return new NextResponse(null, { status: 200 });
}

async function handleSubscriptionCancelled(subscription: Stripe.Subscription) {
  const cancelled = subscriptionsService.updateSubscription(subscription.id, {
    trial_end: subscription.trial_end,
    status: subscription.status,
  });

  if (!cancelled) {
    throw new Error(`No subscription found to cancel with Stripe subscription id ${subscription.id}`);
  }

  return new NextResponse(null, { status: 200 });
}
