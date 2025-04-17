import { env } from "@/lib/env";
import { findSubscription, isActiveSubscription } from "@/services/stripe/subscriptions";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export async function authWithOrgSubscription() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    redirect("/");
  }
  var orgId = session.session.activeOrganizationId
  var userId = session?.session.userId

  if (!orgId) {
    redirect("/dashboard");
  }


  if (!env.ENABLE_BILLING) {
    return { orgId, userId, };
  }

  const subscription = await findSubscription(orgId);
  if (!subscription) {
    redirect("/dashboard/subscription");
  }

  if (!isActiveSubscription(subscription)) {
    redirect("/dashboard/subscription");
  }

  return { orgId, endUserId: userId, subscription };
}

export async function authWithOrg() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  var orgId = session?.session.activeOrganizationId
  var userId = session?.session.userId

  if (!userId) {
    redirect("/");
  }

  if (!orgId) {
    redirect("/dashboard");
  }

  return { orgId, endUserId: userId };
}
