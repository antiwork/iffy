import * as schema from "@/db/schema";
import db from "@/db";
import { eq } from "drizzle-orm";
import { DailyAnalyticsChart } from "./daily-analytics-chart";

type DailyAnalyticsChartData = Omit<typeof schema.moderationsAnalyticsDaily.$inferSelect, "clerkOrganizationId">;

export async function DailySection({ orgId, byRule = false }: { orgId: string; byRule?: boolean }) {
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
      const { flaggedByRule, ...rest } = stat;
      result.push({
        ...rest,
        flaggedByRule: {
          ...flaggedByRule,
          other: {
            count: Math.max(0, rest.flagged - Object.values(flaggedByRule).reduce((acc, curr) => acc + curr.count, 0)),
            name: "Other",
            description: null,
          },
        },
      });
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

  return <DailyAnalyticsChart stats={result} byRule={byRule} />;
}
