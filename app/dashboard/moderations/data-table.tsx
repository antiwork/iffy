"use client";

import { trpc } from "@/lib/trpc";
import {
  ColumnFiltersState,
  getCoreRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { columns } from "./columns";
import { DataTableInfinite } from "@/components/ui/data-table-infinite";
import { DataTableToolbar } from "./data-table-toolbar";
import { DataTableLoading } from "@/components/ui/data-table-loading";
import { useRouter } from "next/navigation";

import * as schema from "@/db/schema";
import { useActiveCollection } from "@/components/context/ActiveCollectionContext";
type ModerationStatus = (typeof schema.moderations.$inferSelect)["status"];

const DataTable = ({ clerkOrganizationId }: { clerkOrganizationId: string }) => {
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([
    { id: "status", value: ["Compliant", "Flagged"] },
  ]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "sort", desc: true }]);
  const { setQuery } = useActiveCollection();

  const query = {
    clerkOrganizationId: clerkOrganizationId,
    sorting,
    statuses: (columnFilters.find((filter) => filter.id === "status")?.value as ModerationStatus[]) || [],
    entities: (columnFilters.find((filter) => filter.id === "entity")?.value as string[]) || [],
    search: globalFilter || undefined,
  };
  const queryResult = trpc.record.infinite.useInfiniteQuery(query, {
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
  const { data, fetchNextPage, hasNextPage, isFetching, isLoading } = queryResult;
  const records = useMemo(() => data?.pages?.flatMap((page) => page.records) ?? [], [data]);

  useEffect(() => {
    setQuery(queryResult);
  }, [JSON.stringify(queryResult.data)]);

  const table = useReactTable({
    data: records,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      globalFilter,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualFiltering: true,
    manualPagination: true,
  });

  const fetchMoreOnBottomReached = useCallback(
    (containerRefElement?: HTMLDivElement | null) => {
      if (containerRefElement) {
        const { scrollHeight, scrollTop, clientHeight } = containerRefElement;
        //once the user has scrolled within 500px of the bottom of the table, fetch more data if we can
        if (scrollHeight - scrollTop - clientHeight < 500 && !isFetching && hasNextPage) {
          fetchNextPage();
        }
      }
    },
    [fetchNextPage, isFetching, hasNextPage],
  );

  useEffect(() => {
    if (tableContainerRef.current) {
      fetchMoreOnBottomReached(tableContainerRef.current);
    }
  }, [fetchMoreOnBottomReached]);

  const router = useRouter();

  return (
    <div className="flex h-full flex-col space-y-4 py-4">
      <DataTableToolbar table={table} data={records} />

      <div
        onScroll={(e) => fetchMoreOnBottomReached(e.target as HTMLDivElement)}
        ref={tableContainerRef}
        className="relative h-full flex-1 overflow-auto border-y border-stone-300 dark:border-zinc-800"
      >
        {isLoading ? (
          <DataTableLoading table={table} />
        ) : (
          <DataTableInfinite table={table} onRowClick={(row) => router.push(`/dashboard/records/${row.original.id}`)} />
        )}
      </div>
    </div>
  );
};

export default DataTable;
