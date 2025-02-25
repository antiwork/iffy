import db from "@/db";
import { organizations, subscriptions } from "@/db/tables";
import { and, eq, gt, sql } from "drizzle-orm";
import { DEFAULT_TRIAL_MODERATIONS } from "@/config/subscriptions";
import Stripe from "stripe";
import { SUBSCRIPTION_PLANS, SUBSCRIPTION_STATUSES } from "@/lib/constants";
import * as stripeService from "@/services/stripe";

export async function getTrialSubscription(clerkOrgId: string) {
  try {
    const result = await db
      .select()
      .from(subscriptions)
      .innerJoin(organizations, eq(organizations.id, subscriptions.organizationId))
      .where(
        and(
          eq(organizations.clerkOrgId, clerkOrgId),
          eq(subscriptions.plan, SUBSCRIPTION_PLANS.TRIAL),
          eq(subscriptions.status, SUBSCRIPTION_STATUSES.TRIALING),
          gt(subscriptions.trialModerationsRemaining, 0),
        ),
      )
      .orderBy(subscriptions.createdAt)
      .limit(1);

    return result[0]?.subscriptions || null;
  } catch (error) {
    console.error("Error getting Trial subscription for organization:", error);
    throw error;
  }
}

export async function createTrialSubscription(
  organizationId: string,
  clerkOrgId: string,
  stripeSubscription: Stripe.Subscription,
) {
  try {
    // Check for active subscription and cancel it
    // This way we ensure that only one subscription can be active at the same time
    const activeSubscription = await getTrialSubscription(clerkOrgId);

    if (activeSubscription) {
      await stripeService.cancelSubscription(activeSubscription.stripeSubscriptionId);
    }

    const [subscription] = await db
      .insert(subscriptions)
      .values({
        organizationId,
        stripeSubscriptionId: stripeSubscription.id,
        plan: SUBSCRIPTION_PLANS.TRIAL,
        status: stripeSubscription.status,
        trialEnd: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000) : null,
        trialModerationsRemaining: DEFAULT_TRIAL_MODERATIONS,
      })
      .returning();

    return subscription;
  } catch (error) {
    console.error("Error creating Trial subscription:", error);
    throw error;
  }
}

type UpdatableSubscriptionFields = Pick<Stripe.Subscription, "status" | "trial_end">;
export async function updateSubscription(subscriptionId: string, { trial_end, status }: UpdatableSubscriptionFields) {
  try {
    const [updated] = await db
      .update(subscriptions)
      .set({
        status,
        trialEnd: trial_end ? new Date(trial_end * 1000) : null,
      })
      .where(eq(subscriptions.stripeSubscriptionId, subscriptionId))
      .returning();

    return updated;
  } catch (error) {
    console.error("Error updating subscription:", error);
    throw error;
  }
}

export async function decrementTrialModerations(subscriptionId: string) {
  try {
    const [updated] = await db
      .update(subscriptions)
      .set({
        trialModerationsRemaining: sql`${subscriptions.trialModerationsRemaining} - 1`,
      })
      .where(eq(subscriptions.id, subscriptionId))
      .returning();

    return updated;
  } catch (error) {
    console.error("Error decrementing trial moderations:", error);
    throw error;
  }
}
