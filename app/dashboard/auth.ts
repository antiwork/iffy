import { env } from "@/lib/env";
import { findSubscription, isActiveSubscription } from "@/services/stripe/subscriptions";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export async function authWithOrgSubscription() {
  const { orgId, endUserId, ...data } = await auth();

  if (!endUserId) {
    redirect("/");
  }

  if (!orgId) {
    redirect("/dashboard");
  }

  if (!env.ENABLE_BILLING) {
    return { orgId, endUserId, ...data };
  }

  const subscription = await findSubscription(orgId);
  if (!subscription) {
    redirect("/dashboard/subscription");
  }

  if (!isActiveSubscription(subscription)) {
    redirect("/dashboard/subscription");
  }

  return { orgId, endUserId, ...data, subscription };
}

export async function authWithOrg() {
  const { orgId, endUserId, ...data } = await auth();

  if (!endUserId) {
    redirect("/");
  }

  if (!orgId) {
    redirect("/dashboard");
  }

  return { orgId, endUserId, ...data };
}
