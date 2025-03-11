import { findOrCreateOrganization } from "@/services/organizations";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { hasActiveSubscription } from "@/services/subscriptions";
import { hasAdminRole } from "@/services/auth";

export const metadata: Metadata = {
  title: "Subscribe | Iffy",
};

export default async function SubscribePage() {
  const { orgId, userId } = await auth();

  if (!orgId) {
    redirect("/");
  }

  const organization = await findOrCreateOrganization(orgId);
  if (await hasActiveSubscription(orgId)) {
    redirect("/dashboard");
  }

  if (!(await hasAdminRole())) {
    // TODO: show a message that the org admin needs to subscribe
    redirect("/dashboard");
  }

  return <div className="px-12 py-8"></div>;
}
