import db from "@/db";
import * as schema from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { Stripe } from "stripe";
import { env } from "@/lib/env";

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

export async function hasActiveSubscription(clerkOrganizationId: string) {
  const subscription = await findSubscription(clerkOrganizationId);
  if (!subscription) {
    return false;
  }

  return subscription.status === "active" || subscription.status === "trialing" || subscription.status === "past_due";
}

export async function hasPaidSubscription(clerkOrganizationId: string) {
  const subscription = await findSubscription(clerkOrganizationId);
  if (!subscription) {
    return false;
  }

  return subscription.status === "active" || subscription.status === "past_due";
}
