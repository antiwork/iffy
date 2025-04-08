import { Suspense } from "react";
import { TotalsSkeleton } from "./skeletons";
import { TotalsCards } from "./totals-cards";
import { authWithOrgSubscription } from "@/app/dashboard/auth";
import { Metadata } from "next";
import { TrendsSection } from "./trends-section";
import * as schema from "@/db/schema";
import db from "@/db";
import { eq, and, sql } from "drizzle-orm";
import { HourlySection } from "./hourly-section";
import { DailySection } from "./daily-section";
import { createLoader, parseAsString, type SearchParams } from "nuqs/server";

export const metadata: Metadata = {
  title: "Analytics | Iffy",
};

async function TotalsSection({ orgId }: { orgId: string }) {
  const [moderationsCount, flaggedCount] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(schema.moderations)
      .where(eq(schema.moderations.clerkOrganizationId, orgId))
      .then((res) => Number(res[0]?.count ?? 0)),
    db
      .select({ count: sql<number>`count(*)` })
      .from(schema.moderations)
      .where(and(eq(schema.moderations.clerkOrganizationId, orgId), eq(schema.moderations.status, "Flagged")))
      .then((res) => Number(res[0]?.count ?? 0)),
  ]);

  const totals = {
    moderations: moderationsCount,
    flagged: flaggedCount,
  };

  return <TotalsCards totals={totals} />;
}

const loadTrendsFilters = createLoader(
  {
    timeRange: parseAsString.withDefault("24h"),
    flaggedFilter: parseAsString.withDefault("all"),
  },
  {
    urlKeys: {
      timeRange: "range",
      flaggedFilter: "filter",
    },
  },
);

export default async function Analytics({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { orgId } = await authWithOrgSubscription();

  const { timeRange, flaggedFilter } = await loadTrendsFilters(searchParams);

  return (
    <div className="space-y-6 px-12 py-8">
      <h2 className="text-xl font-bold">Summary</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <Suspense fallback={<TotalsSkeleton />}>
          <TotalsSection orgId={orgId} />
        </Suspense>
      </div>

      <TrendsSection>
        {timeRange === "24h" ? (
          <HourlySection orgId={orgId} byRule={flaggedFilter === "by-rule"} />
        ) : (
          <DailySection orgId={orgId} byRule={flaggedFilter === "by-rule"} />
        )}
      </TrendsSection>
    </div>
  );
}
