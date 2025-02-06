"use client";

import { Badge } from "@/components/ui/badge";
import { createColumnHelper } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { Checkbox } from "@/components/ui/checkbox";

import { formatUserActionStatus, formatVia } from "@/lib/badges";
import { ActionMenu } from "./action-menu";
import { formatDate } from "@/lib/date";
import type { User } from "./types";
import { formatUserCompact } from "@/lib/record-user";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { ShieldCheck } from "lucide-react";

const columnHelper = createColumnHelper<User>();

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
    cell: ({ row }) =>
      row.getCanSelect() && (
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
  columnHelper.accessor((row) => formatUserCompact(row), {
    id: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="User / Record" />,
    cell: (props) => {
      const { row } = props;
      return (
        <div className="flex w-64 items-center space-x-1 truncate">
          <span className="w-full truncate font-bold">{props.getValue()}</span>
          {row.original.protected && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <ShieldCheck size={16} className="text-stone-500 dark:text-zinc-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Protected User</p>
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
    cell: ({ row }) =>
      row.original.actionStatus ? formatUserActionStatus({ status: row.original.actionStatus }) : "—",
    enableSorting: false,
  }),
  columnHelper.display({
    id: "via",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Via" />,
    cell: ({ row }) => (row.original.actions ? formatUserVia({ actions: row.original.actions }) : "—"),
    enableSorting: false,
  }),
  columnHelper.accessor((row) => row.flaggedRecordsCount, {
    id: "flaggedRecordsCount",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Moderations" />,
    cell: (props) => {
      const flags = props.getValue();
      if (!flags) return null;
      return (
        <Badge variant="failure" className="space-x-1">
          <span>Flagged</span> <span className="font-normal">{flags}</span>
        </Badge>
      );
    },
  }),
  columnHelper.accessor("createdAt", {
    id: "createdAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created At" />,
    cell: (props) => {
      const date = props.getValue();
      return formatDate(date);
    },
  }),
  columnHelper.display({
    id: "actions",
    cell: ({ row }) => {
      const record = row.original;
      return (
        <div onClick={(event) => event.stopPropagation()}>
          <ActionMenu user={record} />
        </div>
      );
    },
  }),
];
