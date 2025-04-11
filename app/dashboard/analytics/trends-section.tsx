"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Suspense } from "react";
import { ChartSkeleton } from "./skeletons";
import { parseAsString, useQueryStates } from "nuqs";

export function TrendsSection({ children }: { children: React.ReactNode }) {
  const [trendsFilters, setTrendsFilters] = useQueryStates(
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Trends</h2>
        <div className="flex gap-2">
          <Select
            value={trendsFilters.timeRange}
            onValueChange={(value) =>
              setTrendsFilters(
                { timeRange: value },
                {
                  shallow: false,
                },
              )
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Time range</SelectLabel>
                <SelectItem value="24h">Last 24 hours</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select
            value={trendsFilters.flaggedFilter}
            onValueChange={(value) =>
              setTrendsFilters(
                { flaggedFilter: value },
                {
                  shallow: false,
                },
              )
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Grouping</SelectLabel>
                <SelectItem value="all">All flagged</SelectItem>
                <SelectItem value="by-rule">Flagged by rule</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Suspense fallback={<ChartSkeleton />}>{children}</Suspense>
    </div>
  );
}
