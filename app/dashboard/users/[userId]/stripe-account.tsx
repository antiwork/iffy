import { CodeInline } from "@/components/code";
import { CopyButton } from "@/components/copy-button";
import { Section, SectionContent, SectionTitle } from "@/components/sheet/section";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import db from "@/db";
import * as schema from "@/db/schema";
import { decrypt } from "@/services/encrypt";
import { getPaymentsAndPayouts } from "@/services/stripe-account";
import { eq } from "drizzle-orm";
import { Suspense } from "react";

const StripeAccountPaymentsAndPayouts = async ({
  stripeAccountId,
  stripeApiKey,
}: {
  stripeAccountId: string;
  stripeApiKey: string;
}) => {
  const { payments, payouts, reason } = await getPaymentsAndPayouts(stripeApiKey, stripeAccountId);

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <dt className="text-stone-500 dark:text-zinc-500">Stripe Payments</dt>
        <dd className="flex items-center gap-2 break-words">
          <Badge variant={payments ? "success" : "failure"}>{payments ? "Enabled" : "Disabled"}</Badge>
        </dd>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <dt className="text-stone-500 dark:text-zinc-500">Stripe Payouts</dt>
        <dd className="flex items-center gap-2 break-words">
          <Badge variant={payouts ? "success" : "failure"}>{payouts ? "Enabled" : "Disabled"}</Badge>
        </dd>
      </div>
      {reason && (
        <div className="grid grid-cols-2 gap-4">
          <dt className="text-stone-500 dark:text-zinc-500">Disabled Reason</dt>
          <dd className="flex items-center gap-2 break-words">
            <CodeInline>{reason}</CodeInline>
          </dd>
        </div>
      )}
    </>
  );
};

const StripeAccountPaymentsAndPayoutsSkeleton = () => {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <dt className="text-stone-500 dark:text-zinc-500">Stripe Payments</dt>
        <dd className="flex items-center gap-2 break-words">
          <Skeleton className="h-6 w-16" />
        </dd>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <dt className="text-stone-500 dark:text-zinc-500">Stripe Payouts</dt>
        <dd className="flex items-center gap-2 break-words">
          <Skeleton className="h-6 w-16" />
        </dd>
      </div>
    </>
  );
};

export async function StripeAccount({
  clerkOrganizationId,
  stripeAccountId,
}: {
  clerkOrganizationId: string;
  stripeAccountId: string;
}) {
  const result = await db.query.organizations.findFirst({
    where: eq(schema.organizations.clerkOrganizationId, clerkOrganizationId),
  });

  const stripeApiKey = result?.stripeApiKey ? decrypt(result.stripeApiKey) : null;

  return (
    <Section>
      <SectionTitle>Stripe</SectionTitle>
      <SectionContent>
        <dl className="grid gap-3">
          <div className="grid grid-cols-2 gap-4">
            <dt className="text-stone-500 dark:text-zinc-500">Stripe Account ID</dt>
            <dd className="flex items-center gap-2 break-words">
              <CodeInline>{stripeAccountId}</CodeInline>
              <CopyButton text={stripeAccountId} name="Stripe Account ID" />
            </dd>
          </div>
          {stripeApiKey && (
            <Suspense fallback={<StripeAccountPaymentsAndPayoutsSkeleton />}>
              <StripeAccountPaymentsAndPayouts stripeAccountId={stripeAccountId} stripeApiKey={stripeApiKey} />
            </Suspense>
          )}
        </dl>
      </SectionContent>
    </Section>
  );
}
