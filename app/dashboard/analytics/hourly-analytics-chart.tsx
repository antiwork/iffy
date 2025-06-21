"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import defaultTheme from "tailwindcss/defaultTheme";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import * as schema from "@/db/schema";

type HourlyAnalyticsChartData = Omit<typeof schema.moderationsAnalyticsHourly.$inferSelect, "clerkOrganizationId">;

const COLORS = [
  defaultTheme.colors().blue[700],
  defaultTheme.colors().sky[500],
  defaultTheme.colors().fuchsia[600],
  defaultTheme.colors().orange[500],
  defaultTheme.colors().emerald[600],
];

const getRules = (stats: HourlyAnalyticsChartData[]): { key: string; label: string; color: string }[] => {
  const keysToNames = stats.reduce(
    (acc, stat) => {
      Object.entries(stat.flaggedByRule).forEach(([key, value]) => {
        acc[key] = value.name ?? key;
      });
      return acc;
    },
    {} as Record<string, string>,
  );

  const sortedKeys = Object.keys(keysToNames).sort((a, b) => {
    if (a === "other") return 1;
    if (b === "other") return -1;
    return a.localeCompare(b);
  });

  return sortedKeys.map((key, i) => ({
    key,
    label: keysToNames[key]!,
    color: key === "other" ? defaultTheme.colors().gray[500] : COLORS[i % COLORS.length]!,
  }));
};

export function HourlyAnalyticsChart({
  stats,
  byRule = false,
}: {
  stats: HourlyAnalyticsChartData[];
  byRule?: boolean;
}) {
  const totalModerations = stats.reduce((sum, stat) => sum + stat.moderations, 0);
  const totalFlagged = stats.reduce((sum, stat) => sum + stat.flagged, 0);
  const totalFlaggedByRule = stats.reduce(
    (acc, stat) => {
      Object.entries(stat.flaggedByRule).forEach(([key, value]) => {
        acc[key] = (acc[key] || 0) + value.count;
      });
      return acc;
    },
    {} as Record<string, number>,
  );

  const rules = getRules(stats);

  const chartConfig = {
    moderations: {
      label: "Moderations",
      color: defaultTheme.colors().black,
    },
    flagged: {
      label: "Flagged",
      color: defaultTheme.colors().red[600],
    },
    ...rules.reduce(
      (acc, rule) => {
        acc[rule.key] = { label: rule.label, color: rule.color };
        return acc;
      },
      {} as Record<string, { label: string; color: string }>,
    ),
  } satisfies ChartConfig;

  return (
    <Card>
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row dark:border-zinc-700">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardTitle className="dark:text-stone-100">Moderations</CardTitle>
          <CardDescription className="dark:text-stone-400">Last 24 hours</CardDescription>
        </div>
        <div className="flex">
          <div className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6 dark:border-zinc-700">
            <div className="text-muted-foreground text-xs">{chartConfig.moderations.label}</div>
            <div
              className="text-lg leading-none font-bold sm:text-3xl"
              style={{ color: chartConfig.moderations.color }}
            >
              {totalModerations.toLocaleString()}
            </div>
          </div>
          <div className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6 dark:border-zinc-700">
            <div className="text-muted-foreground text-xs">{chartConfig.flagged.label}</div>
            <div className="text-lg leading-none font-bold sm:text-3xl" style={{ color: chartConfig.flagged.color }}>
              {totalFlagged.toLocaleString()}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <BarChart
            accessibilityLayer
            data={stats}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="time"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={48}
              tickFormatter={(value: Date) => value.toLocaleTimeString("en-US", { hour: "numeric" })}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  labelKey="time"
                  labelFormatter={(_, payload) => {
                    if (!payload || payload.length === 0) return "";
                    const time = payload[0].payload.time;
                    return time.toLocaleTimeString("en-US", { hour: "numeric" });
                  }}
                />
              }
            />
            <Bar dataKey="moderations" fill={chartConfig.moderations.color} />
            {byRule ? (
              rules.map((rule) => (
                <Bar
                  key={rule.key}
                  stackId="a"
                  name={rule.label}
                  dataKey={(stat) => stat.flaggedByRule[rule.key]?.count ?? 0}
                  fill={rule.color}
                />
              ))
            ) : (
              <Bar dataKey="flagged" fill={chartConfig.flagged.color} />
            )}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
