import * as schema from "@/db/schema"
import db from "@/db"
import { eq } from "drizzle-orm"
import { HourlyAnalyticsChart } from "./hourly-analytics-chart"

type HourlyAnalyticsChartData = Omit<typeof schema.moderationsAnalyticsHourly.$inferSelect, "clerkOrganizationId">

export async function HourlySection({ orgId }: { orgId: string }) {
  const stats = await db
    .select({
      time: schema.moderationsAnalyticsHourly.time,
      moderations: schema.moderationsAnalyticsHourly.moderations,
      flagged: schema.moderationsAnalyticsHourly.flagged,
      flaggedByRule: schema.moderationsAnalyticsHourly.flaggedByRule,
    })
    .from(schema.moderationsAnalyticsHourly)
    .where(eq(schema.moderationsAnalyticsHourly.clerkOrganizationId, orgId))

  // Builds a 24-hour timeline of moderation stats, filling gaps with zeros
  const result = []
  const now = new Date()
  for (let i = 23; i >= 0; i--) {
    const hour = new Date(now.getTime())
    hour.setHours(now.getHours() - i, 0, 0, 0)
    const stat = stats.find((s) => {
      const sTime = new Date(s.time)
      return (
        sTime.getHours() === hour.getHours() &&
        sTime.getDate() === hour.getDate() &&
        sTime.getMonth() === hour.getMonth() &&
        sTime.getFullYear() === hour.getFullYear()
      )
    })
    if (stat) {
      result.push(stat)
    } else {
      const empty: HourlyAnalyticsChartData = {
        time: hour,
        moderations: 0,
        flagged: 0,
        flaggedByRule: {},
      }
      result.push(empty)
    }
  }

  return <HourlyAnalyticsChart stats={result} />
} 