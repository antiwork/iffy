"use client";

import { XIcon } from "lucide-react";
import { Table } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { DataTableViewOptions } from "@/components/ui/data-table-view-options";
import { DataTableFacetedFilter } from "@/components/ui/data-table-faceted-filter";
import { DebouncedInput } from "@/components/debounced-input";
import { BulkActionMenu } from "./action-menu";

import type { UserRecord } from "./types";
import * as schema from "@/db/schema";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  data: TData[];
}

function DataTableToolbarActions<TData extends UserRecord>({ table, data }: DataTableToolbarProps<TData>) {
  const selected = table.getFilteredSelectedRowModel().rows.map((row) => row.original);
  return (
    <div className="flex items-center text-sm">
      <span className="text-gray-500">{selected.length} selected</span>
      <Button variant="link" className="h-8" onClick={() => table.toggleAllRowsSelected(false)}>
        Deselect
      </Button>
      <BulkActionMenu userRecords={selected} />
    </div>
  );
}

export function DataTableToolbar<TData extends UserRecord>({ table, data }: DataTableToolbarProps<TData>) {
  const isFiltered = !!table.getState().globalFilter || table.getState().columnFilters.length > 0;
  const hasSelected = table.getFilteredSelectedRowModel().rows.length > 0;

  return (
    <div className="flex items-center justify-between px-4">
      <div className="flex flex-1 items-center space-x-2">
        <DebouncedInput
          placeholder="Search users..."
          value={(table.getState().globalFilter as string) ?? ""}
          onChange={(value) => table.setGlobalFilter(value)}
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {table.getColumn("status") && (
          <DataTableFacetedFilter
            column={table.getColumn("status")}
            title="Status"
            options={schema.userActionStatus.enumValues.map((value) => ({ label: value, value }))}
          />
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => {
              table.resetGlobalFilter();
              table.resetColumnFilters();
            }}
            className="h-8 px-2 lg:px-3"
          >
            Clear
            <XIcon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      {hasSelected ? <DataTableToolbarActions table={table} data={data} /> : <DataTableViewOptions table={table} />}
    </div>
  );
}
