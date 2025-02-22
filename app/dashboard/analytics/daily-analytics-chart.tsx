"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import defaultTheme from "tailwindcss/defaultTheme";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { formatDay, formatDayFull } from "@/lib/date";

export interface DailyAnalyticsChartProps {
  stats: {
    date: Date;
    moderations: number;
    flagged: number;
  }[];
}

const chartConfig = {
  moderations: {
    label: "Moderations",
    color: defaultTheme.colors().black,
  },
  flagged: {
    label: "Flagged",
    color: defaultTheme.colors().red[600],
  },
} satisfies ChartConfig;

export function DailyAnalyticsChart({ stats }: DailyAnalyticsChartProps) {
  const { totalModerations, totalFlagged } = React.useMemo(() => {
    const totalModerations = stats.reduce((sum, stat) => sum + stat.moderations, 0);
    const totalFlagged = stats.reduce((sum, stat) => sum + stat.flagged, 0);
    return { totalModerations, totalFlagged };
  }, [stats]);

  return (
    <Card>
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row dark:border-zinc-700">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardTitle className="dark:text-stone-100">Moderations</CardTitle>
          <CardDescription className="dark:text-stone-400">Last 30 days</CardDescription>
        </div>
        <div className="flex">
          <div className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6 dark:border-zinc-700">
            <span className="text-muted-foreground text-xs">{chartConfig.moderations.label}</span>
            <span
              className="text-lg leading-none font-bold sm:text-3xl"
              style={{ color: chartConfig.moderations.color }}
            >
              {totalModerations.toLocaleString()}
            </span>
          </div>
          <div className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6 dark:border-zinc-700">
            <span className="text-muted-foreground text-xs">{chartConfig.flagged.label}</span>
            <span className="text-lg leading-none font-bold sm:text-3xl" style={{ color: chartConfig.flagged.color }}>
              {totalFlagged.toLocaleString()}
            </span>
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
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
              tickFormatter={(value: Date) => formatDay(value)}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  labelKey="date"
                  labelFormatter={(_, payload) => {
                    const date = payload[0]!.payload.date;
                    return formatDayFull(date);
                  }}
                />
              }
            />
            <Bar dataKey="moderations" fill="var(--color-moderations)" />
            <Bar dataKey="flagged" fill="var(--color-flagged)" />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
