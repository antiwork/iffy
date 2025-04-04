import { Suspense } from "react";
import { ChartSkeleton, TotalsSkeleton } from "./skeletons";
import { DailyAnalyticsChart } from "./daily-analytics-chart";
import { HourlyAnalyticsChart } from "./hourly-analytics-chart";
import { TotalsCards } from "./totals-cards";
import { authWithOrgSubscription } from "@/app/dashboard/auth";
import { Metadata } from "next";

type HourlyAnalyticsChartData = Omit<typeof schema.moderationsAnalyticsHourly.$inferSelect, "clerkOrganizationId">;
type DailyAnalyticsChartData = Omit<typeof schema.moderationsAnalyticsDaily.$inferSelect, "clerkOrganizationId">;

export const metadata: Metadata = {
  title: "Analytics | Iffy",
};

import * as schema from "@/db/schema";
import db from "@/db";
import { eq, and, sql } from "drizzle-orm";

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

async function HourlySection({ orgId }: { orgId: string }) {
  const stats = await db
    .select({
      time: schema.moderationsAnalyticsHourly.time,
      moderations: schema.moderationsAnalyticsHourly.moderations,
      flagged: schema.moderationsAnalyticsHourly.flagged,
      flaggedByRule: schema.moderationsAnalyticsHourly.flaggedByRule,
    })
    .from(schema.moderationsAnalyticsHourly)
    .where(eq(schema.moderationsAnalyticsHourly.clerkOrganizationId, orgId));

  // Builds a 24-hour timeline of moderation stats, filling gaps with zeros
  const result = [];
  const now = new Date();
  for (let i = 23; i >= 0; i--) {
    const hour = new Date(now.getTime());
    hour.setHours(now.getHours() - i, 0, 0, 0);
    const stat = stats.find((s) => {
      const sTime = new Date(s.time);
      return (
        sTime.getHours() === hour.getHours() &&
        sTime.getDate() === hour.getDate() &&
        sTime.getMonth() === hour.getMonth() &&
        sTime.getFullYear() === hour.getFullYear()
      );
    });
    if (stat) {
      result.push(stat);
    } else {
      const empty: HourlyAnalyticsChartData = {
        time: hour,
        moderations: 0,
        flagged: 0,
        flaggedByRule: {},
      };
      result.push(empty);
    }
  }

  return <HourlyAnalyticsChart stats={result} />;
}

async function DailySection({ orgId }: { orgId: string }) {
  const stats = await db
    .select({
      time: schema.moderationsAnalyticsDaily.time,
      moderations: schema.moderationsAnalyticsDaily.moderations,
      flagged: schema.moderationsAnalyticsDaily.flagged,
      flaggedByRule: schema.moderationsAnalyticsDaily.flaggedByRule,
    })
    .from(schema.moderationsAnalyticsDaily)
    .where(eq(schema.moderationsAnalyticsDaily.clerkOrganizationId, orgId));

  // Builds a 30-day timeline of moderation stats, filling gaps with zeros
  const result = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const day = new Date(now.getTime());
    day.setDate(now.getDate() - i);
    day.setHours(0, 0, 0, 0);
    const stat = stats.find((s) => {
      const sDate = new Date(s.time);
      return (
        sDate.getDate() === day.getDate() &&
        sDate.getMonth() === day.getMonth() &&
        sDate.getFullYear() === day.getFullYear()
      );
    });
    if (stat) {
      result.push(stat);
    } else {
      const empty: DailyAnalyticsChartData = {
        time: day,
        moderations: 0,
        flagged: 0,
        flaggedByRule: {},
      };
      result.push(empty);
    }
  }

  return <DailyAnalyticsChart stats={result} />;
}

export default async function Analytics() {
  const { orgId } = await authWithOrgSubscription();

  return (
    <div className="space-y-6 px-12 py-8">
      <div className="grid gap-4 md:grid-cols-2">
        <Suspense fallback={<TotalsSkeleton />}>
          <TotalsSection orgId={orgId} />
        </Suspense>
      </div>
      <Suspense fallback={<ChartSkeleton />}>
        <HourlySection orgId={orgId} />
      </Suspense>
      <Suspense fallback={<ChartSkeleton />}>
        <DailySection orgId={orgId} />
      </Suspense>
    </div>
  );
}
