import db from "@/db";
import { organizations, subscriptions } from "@/db/tables";
import { and, eq, gt } from "drizzle-orm";
import { DEFAULT_TRIAL_MODERATIONS, SUBSCRIPTION_PLANS } from "@/config/subscriptions";
import Stripe from "stripe";
import { stripe } from "./stripe";

export async function getActiveSubscription(orgId: string) {
  try {
    const result = await db
      .select()
      .from(subscriptions)
      .innerJoin(organizations, eq(organizations.id, subscriptions.organizationId))
      .where(
        and(
          eq(organizations.clerkOrgId, orgId),
          gt(subscriptions.trialEnd, new Date()),
          gt(subscriptions.trialModerationsRemaining, 0),
        ),
      )
      .orderBy(subscriptions.createdAt)
      .limit(1);

    return result[0]?.subscriptions || null;
  } catch (error) {
    console.error("Error fetching active subscription for organization:", orgId, error);
    throw error;
  }
}

// Create Free Tier subscription for new organisations
// If there's active subscription already, it will be canceled
export async function createFreeSubscription(organizationId: string, stripeSubscription: Stripe.Subscription) {
  try {
    const activeSub = await getActiveSubscription(organizationId);

    if (activeSub) {
      try {
        await stripe.subscriptions.cancel(activeSub.stripeSubscriptionId);
      } catch (cancelError) {
        console.error("Error cancelling active subscription on Stripe:", activeSub.stripeSubscriptionId, cancelError);
        throw cancelError;
      }
    }

    const [subscription] = await db
      .insert(subscriptions)
      .values({
        organizationId,
        stripeSubscriptionId: stripeSubscription.id,
        plan: SUBSCRIPTION_PLANS.FREE,
        status: stripeSubscription.status,
        trialEnd: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000) : null,
        trialModerationsRemaining: DEFAULT_TRIAL_MODERATIONS,
      })
      .returning();

    return subscription;
  } catch (error) {
    console.error("Error creating free subscription:", error);
    throw error;
  }
}
