"use client";

import { Badge } from "@/components/ui/badge";
import { createColumnHelper } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { formatRecordStatus, formatRecordVia } from "@/lib/badges";
import { ActionMenu } from "../records/action-menu";
import type { Record } from "../records/types";
import { FlaskConical } from "lucide-react";
import { Date } from "@/components/date";

const columnHelper = createColumnHelper<Record>();

export const columns = [
  columnHelper.display({
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
        onClick={(event) => event.stopPropagation()}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
        onClick={(event) => event.stopPropagation()}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  }),
  columnHelper.accessor("name", {
    id: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Record" />,
    cell: (props) => {
      const { row } = props;
      return (
        <div className="flex w-64 items-center space-x-1 truncate">
          <span className="w-full truncate font-bold">{props.getValue()}</span>
          {row.original.moderations[0]?.testMode && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <FlaskConical size={16} className="text-stone-500 dark:text-zinc-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Test Mode</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      );
    },
  }),
  columnHelper.display({
    id: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => formatRecordStatus(row.original) ?? "—",
    enableSorting: false,
  }),
  columnHelper.display({
    id: "via",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Via" />,
    cell: ({ row }) => formatRecordVia(row.original) ?? "—",
    enableSorting: false,
  }),
  columnHelper.accessor("entity", {
    id: "entity",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Entity" />,
    cell: (props) => (
      <Badge variant="secondary">
        <span>{props.getValue()}</span>
      </Badge>
    ),
    enableSorting: false,
  }),

  columnHelper.accessor(
    (row) => {
      const moderation = row.moderations[0];
      if (!moderation) return "";
      const rules = moderation.moderationsToRules.map((moderationToRule) => moderationToRule.rule);
      return rules.map((rule) => (rule.preset ? rule.preset.name : rule.name)).join(", ");
    },
    {
      id: "rules",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Rules" />,
      cell: (props) => {
        const content = props.getValue();
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="w-36">{content}</TooltipTrigger>
              <TooltipContent>
                <p>{content}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
      enableSorting: false,
    },
  ),
  columnHelper.accessor("createdAt", {
    id: "createdAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created At" />,
    cell: (props) => {
      const date = props.getValue();
      return <Date date={date} />;
    },
  }),
  columnHelper.display({
    id: "actions",
    cell: ({ row }) => (
      <div onClick={(event) => event.stopPropagation()}>
        <ActionMenu record={row.original} />
      </div>
    ),
  }),
];
