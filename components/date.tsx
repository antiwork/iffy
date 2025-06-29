"use client";

import * as React from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/ui/tooltip";
import { formatDay, formatDayFull, formatDate, formatDateFull } from "../lib/date";
import { useLayoutEffect } from "react";

interface DateProps {
  date: Date;
}

export function DayFull({ date }: DateProps) {
  const [localDate, setLocalDate] = React.useState<string | null>(null);

  useLayoutEffect(() => {
    setLocalDate(formatDayFull(date));
  }, [date]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger className="whitespace-nowrap">
          <span>{localDate}</span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{date.toISOString()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function Date({ date }: DateProps) {
  const [localDate, setLocalDate] = React.useState<string | null>(null);

  useLayoutEffect(() => {
    setLocalDate(formatDate(date));
  }, [date]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <span>{localDate}</span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{date.toISOString()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function DateFull({ date }: DateProps) {
  const [localDate, setLocalDate] = React.useState<string | null>(null);

  useLayoutEffect(() => {
    setLocalDate(formatDateFull(date));
  }, [date]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <span>{localDate}</span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{date.toISOString()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
