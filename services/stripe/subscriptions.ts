import db from "@/db";
import * as schema from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { PRODUCTS } from "@/products/products";
import stripe from "@/lib/stripe";
import type { Stripe } from "stripe";
import { env } from "@/lib/env";

// A subscription is current if it can be updated in the Customer Portal
export function isCurrentSubscription(subscription: Stripe.Subscription) {
  return subscription.status !== "canceled" && subscription.status !== "incomplete_expired";
}

// A subscription is active if it should allow access to the app
export function isActiveSubscription(subscription: Stripe.Subscription) {
  return subscription.status === "active" || subscription.status === "trialing" || subscription.status === "past_due";
}

// Find the first current subscription for an organization
export async function findSubscription(clerkOrganizationId: string) {
  if (!env.ENABLE_BILLING || !stripe) {
    throw new Error("Billing is not enabled");
  }

  const subscriptions = await db.query.subscriptions.findMany({
    where: eq(schema.subscriptions.organizationId, clerkOrganizationId),
    orderBy: desc(schema.subscriptions.createdAt),
  });

  for (const subscription of subscriptions) {
    const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);
    if (isCurrentSubscription(stripeSubscription)) {
      return stripeSubscription;
    }
  }

  return null;
}

export async function findSubscriptionTier(clerkOrganizationId: string) {
  const subscription = await findSubscription(clerkOrganizationId);
  if (!subscription) {
    return null;
  }

  const id = subscription.items.data[0]?.plan.product;
  const product = Object.values(PRODUCTS).find((p) => p.id === id);
  if (!product) {
    return null;
  }

  return product;
}

export async function findOrCreateSubscription(clerkOrganizationId: string, stripeSubscriptionId: string) {
  if (!env.ENABLE_BILLING || !stripe) {
    throw new Error("Billing is not enabled");
  }

  const existingSubscription = await db.query.subscriptions.findFirst({
    where: and(
      eq(schema.subscriptions.organizationId, clerkOrganizationId),
      eq(schema.subscriptions.stripeSubscriptionId, stripeSubscriptionId),
    ),
  });

  if (existingSubscription) {
    return await stripe.subscriptions.retrieve(existingSubscription.stripeSubscriptionId);
  }

  const [subscription] = await db
    .insert(schema.subscriptions)
    .values({
      clerkOrganizationId,
      stripeSubscriptionId,
    })
    .returning();

  if (!subscription) {
    throw new Error("Failed to create subscription");
  }

  return await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);
}

export async function hasActiveSubscription(clerkOrganizationId: string) {
  const subscription = await findSubscription(clerkOrganizationId);
  if (!subscription) {
    return false;
  }

  return isActiveSubscription(subscription);
}

export async function startOfCurrentBillingPeriod(clerkOrganizationId: string) {
  const subscription = await findSubscription(clerkOrganizationId);
  if (!subscription) {
    return null;
  }

  return new Date(subscription.current_period_start * 1000);
}
