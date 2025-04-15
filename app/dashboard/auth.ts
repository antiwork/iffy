import { env } from "@/lib/env";
import { findSubscription, isActiveSubscription } from "@/services/stripe/subscriptions";
import { auth } from "@/services/auth";
import { redirect } from "next/navigation";

export async function authWithOrgSubscription() {
  const { userId, orgId, ...data } = await auth();

  if (!userId) {
    redirect("/");
  }

  if (!orgId) {
    redirect("/dashboard");
  }

  if (!env.ENABLE_BILLING) {
    return { ...data, userId, orgId };
  }

  const subscription = await findSubscription(orgId);
  if (!subscription) {
    redirect("/dashboard/subscription");
  }

  if (!isActiveSubscription(subscription)) {
    redirect("/dashboard/subscription");
  }

  return { ...data, userId, orgId, subscription };
}

export async function authWithOrg() {
  const { userId, orgId, ...data } = await auth();

  if (!userId) {
    redirect("/");
  }

  if (!orgId) {
    redirect("/dashboard");
  }

  return { ...data, orgId, userId };
}
