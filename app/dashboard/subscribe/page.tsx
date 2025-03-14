import { findOrCreateOrganization } from "@/services/organizations";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { hasActiveSubscription } from "@/services/subscriptions";
import { hasAdminRole } from "@/services/auth";
import { Subscribe } from "./subscribe";
import { PRODUCTS } from "@/products/products";

export const metadata: Metadata = {
  title: "Subscribe | Iffy",
};

export default async function SubscribePage() {
  const { orgId } = await auth();

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

  // TODO: if query param, redirect
  // else, show the pricing page, click on a tier redirects

  return (
    <div className="px-12 py-8">
      <Subscribe products={PRODUCTS} />
    </div>
  );
}
