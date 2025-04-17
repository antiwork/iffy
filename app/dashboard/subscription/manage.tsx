import { findOrCreateOrganization } from "@/services/organizations";
import { findSubscription, findSubscriptionTier } from "@/services/stripe/subscriptions";
import { getUsageForCurrentBillingPeriod } from "@/services/stripe/usage";
import { ManageSubscriptionButton } from "./manage-button";
import { METERS } from "@/products/products";
import { formatSubscriptionStatus } from "@/lib/subscription-badge";
import { formatDay } from "@/lib/date";

export default async function ManageSubscription({ authOrganizationId }: { authOrganizationId: string }) {
  const organization = await findOrCreateOrganization(authOrganizationId);
  const subscription = await findSubscription(authOrganizationId);
  const tier = await findSubscriptionTier(authOrganizationId);
  const usage = await getUsageForCurrentBillingPeriod(authOrganizationId, METERS.iffy_moderations.event_name);

  return (
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
            <div className="flex justify-end">
              <ManageSubscriptionButton />
            </div>
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
  );
}
