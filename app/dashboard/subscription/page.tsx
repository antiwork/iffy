import { authWithOrg } from "../auth";
import { Metadata } from "next";
import { findSubscription } from "@/services/stripe/subscriptions";
import { hasAdminRole } from "@/services/auth";
import { Subscribe } from "./subscribe";
import { PRODUCTS } from "@/products/products";
import NotAdmin from "./not-admin";
import ManageSubscription from "./manage";
import { env } from "@/lib/env";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Subscription | Iffy",
};

export default async function SubscriptionPage() {
  if (!env.ENABLE_BILLING) {
    notFound();
  }

  const { orgId } = await authWithOrg();

  const isAdmin = await hasAdminRole();
  if (!isAdmin) {
    return <NotAdmin />;
  }

  const subscription = await findSubscription(orgId);
  if (!subscription) {
    return (
      <div className="px-12 py-8">
        <Subscribe products={PRODUCTS} />
      </div>
    );
  }

  return (
    <div className="px-12 py-8">
      <div className="text-gray-950 dark:text-stone-50">
        <h2 className="mb-6 text-2xl font-bold">Subscription</h2>
        <div className="space-y-8">
          <ManageSubscription authOrganizationId={orgId} />
        </div>
      </div>
    </div>
  );
}
