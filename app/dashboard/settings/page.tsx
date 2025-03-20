import { findOrCreateOrganization } from "@/services/organizations";
import { GeneralSettings } from "./general";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { findSubscription, findSubscriptionTier } from "@/services/stripe/subscriptions";
import { getUsageForCurrentBillingPeriod } from "@/services/stripe/usage";
import { ManageSubscription } from "./subscription";
import { METERS } from "@/products/products";
import { formatSubscriptionStatus } from "@/lib/subscription-badge";
import { formatDay } from "@/lib/date";
import { hasAdminRole } from "@/services/auth";

export const metadata: Metadata = {
  title: "Settings | Iffy",
};

export default async function SettingsPage() {
  const { orgId } = await auth();

  if (!orgId) {
    redirect("/");
  }

  const isAdmin = await hasAdminRole();

  const organization = await findOrCreateOrganization(orgId);
  const subscription = await findSubscription(orgId);
  const tier = await findSubscriptionTier(orgId);
  const usage = await getUsageForCurrentBillingPeriod(orgId, METERS.iffy_moderations.event_name);

  return (
    <div className="px-12 py-8">
      <div className="text-gray-950 dark:text-stone-50">
        <h2 className="mb-6 text-2xl font-bold">Settings</h2>
        <div className="space-y-8">
          <GeneralSettings organization={organization} />
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Billing</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-2 text-sm text-gray-500 dark:text-gray-400">Current subscription</div>
                {subscription ? (
                  <>
                    <div className="space-y-6">
                      {tier ? (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <h3 className="font-mono text-xl font-bold">{tier.name}</h3>
                            <p className="text-sm text-gray-500">{tier.description}</p>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {formatSubscriptionStatus({ status: subscription.status })}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <h3 className="font-mono text-xl font-bold">Custom</h3>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {formatSubscriptionStatus({ status: subscription.status })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    {isAdmin && (
                      <div className="flex justify-end">
                        <ManageSubscription />
                      </div>
                    )}
                  </>
                ) : (
                  "No active subscription"
                )}
              </div>
              {subscription && usage !== null && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Current usage</div>
                  <div className="space-y-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-bold">{usage.toLocaleString()}</span>
                      <span className="text-gray-500">moderations</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDay(new Date(subscription.current_period_start * 1000))} -{" "}
                      {formatDay(new Date(subscription.current_period_end * 1000))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
