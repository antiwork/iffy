import db from "@/db";
import * as schema from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { Stripe } from "stripe";
import { env } from "@/lib/env";
import { PRODUCTS } from "@/products/products";
import { findOrCreateOrganization } from "../organizations";

const stripe = new Stripe(env.STRIPE_API_KEY);

export async function findSubscription(clerkOrganizationId: string) {
  const subscription = await db.query.subscriptions.findFirst({
    where: eq(schema.subscriptions.clerkOrganizationId, clerkOrganizationId),
    orderBy: desc(schema.subscriptions.createdAt),
  });

  if (!subscription) {
    return null;
  }

  return await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);
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

export async function createSubscription(clerkOrganizationId: string, stripeSubscriptionId: string) {
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

  return subscription.status === "active" || subscription.status === "trialing" || subscription.status === "past_due";
}

export async function hasNonTrialingSubscription(clerkOrganizationId: string) {
  const subscription = await findSubscription(clerkOrganizationId);
  if (!subscription) {
    return false;
  }

  return subscription.status === "active" || subscription.status === "past_due";
}

export async function startOfCurrentBillingPeriod(clerkOrganizationId: string) {
  const subscription = await findSubscription(clerkOrganizationId);
  if (!subscription) {
    return null;
  }

  return new Date(subscription.current_period_start * 1000);
}

export async function createCustomerPortalSession(clerkOrganizationId: string) {
  const organization = await findOrCreateOrganization(clerkOrganizationId);
  if (!organization.stripeCustomerId) {
    return null;
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: organization.stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/settings`,
  });

  return session.url;
}
