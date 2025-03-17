"use client";

import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatRecordStatus, formatRecordVia } from "@/lib/badges";
import { trpc } from "@/lib/trpc";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { FlaskConical } from "lucide-react";
import { Date } from "@/components/date";
import { ActionMenu } from "../../records/action-menu";

export function RecordsTable({ clerkOrganizationId, userId }: { clerkOrganizationId: string; userId: string }) {
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const { data, fetchNextPage, hasNextPage, isFetching, isLoading } = trpc.record.infinite.useInfiniteQuery(
    {
      clerkOrganizationId,
      userId,
      sorting: [{ id: "flaggedModerationsCount", desc: true }],
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );
  const records = useMemo(() => data?.pages?.flatMap((page) => page.records) ?? [], [data]);

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

  return (
    <div
      onScroll={(e) => fetchMoreOnBottomReached(e.target as HTMLDivElement)}
      ref={tableContainerRef}
      className="relative"
    >
      {!isLoading && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-2 py-1">Name</TableHead>
              <TableHead className="px-2 py-1">Status</TableHead>
              <TableHead className="px-2 py-1">Via</TableHead>
              <TableHead className="px-2 py-1">Entity</TableHead>
              <TableHead className="px-2 py-1">Created At</TableHead>
              <TableHead className="px-2 py-1"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => {
              return (
                <TableRow key={record.id}>
                  <TableCell className="px-2 py-1">
                    <div className="py-1">
                      <div className="flex w-64 items-center space-x-1 truncate">
                        <Button
                          asChild
                          variant="link"
                          className="text-md -mx-4 -my-2 block w-full truncate font-normal"
                        >
                          <Link href={`/dashboard/records/${record.id}`}>{record.name}</Link>
                        </Button>
                        {record.moderations[0]?.testMode && (
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
                    </div>
                  </TableCell>
                  <TableCell className="px-2 py-1">
                    <div className="py-1">{formatRecordStatus(record) ?? "—"}</div>
                  </TableCell>
                  <TableCell className="px-2 py-1">
                    <div className="py-1">{formatRecordVia(record) ?? "—"}</div>
                  </TableCell>
                  <TableCell className="px-2 py-1">
                    <div className="py-1">
                      <Badge variant="secondary">
                        <span>{record.entity}</span>
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="px-2 py-1">
                    <div className="py-1">
                      <Date date={record.createdAt} />
                    </div>
                  </TableCell>
                  <TableCell className="px-2 py-1">
                    <ActionMenu record={record} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
