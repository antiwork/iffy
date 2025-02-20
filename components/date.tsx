"use client";

import * as React from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/ui/tooltip";
import { formatDay, formatDayFull, formatDate } from "../lib/date";

interface DateProps {
  date: Date;
}

export function Day({ date }: DateProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <span>{formatDay(date)}</span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{date.toISOString()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function DayFull({ date }: DateProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <span>{formatDayFull(date)}</span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{date.toISOString()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function Date({ date }: DateProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <span>{formatDate(date)}</span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{date.toISOString()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
