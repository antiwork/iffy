"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppealList } from "./appeal-list";
import { trpc } from "@/lib/trpc";
import { DebouncedInput } from "@/components/debounced-input";

interface AppealsProps {
  authOrganizationId: string;
  defaultLayout?: number[];
  children: React.ReactNode;
}

export function Appeals({ authOrganizationId, defaultLayout = [20, 32, 48], children }: AppealsProps) {
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const [tab, setTab] = useState("inbox");
  const [search, setSearch] = useState("");

  const { data, fetchNextPage, hasNextPage, isFetching, isLoading } = trpc.appeal.infinite.useInfiniteQuery(
    {
      authOrganizationId: authOrganizationId,
      statuses: tab === "inbox" ? ["Open"] : undefined,
      search,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  const appeals = useMemo(() => data?.pages?.flatMap((page) => page.appeals) ?? [], [data]);

  const fetchMoreOnBottomReached = useCallback(
    (containerRefElement?: HTMLDivElement | null) => {
      if (containerRefElement) {
        const { scrollHeight, scrollTop, clientHeight } = containerRefElement;
        // once the user has scrolled within 500px of the bottom of the table, fetch more data if we can
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
    <TooltipProvider delayDuration={0}>
      <ResizablePanelGroup direction="horizontal" className="h-full items-stretch">
        <ResizablePanel defaultSize={defaultLayout[1]} minSize={30} className="h-full">
          <Tabs value={tab} onValueChange={setTab} className="flex h-full flex-col">
            <div className="h-[132px] space-y-4 p-4">
              <TabsList>
                <TabsTrigger value="inbox" className="text-zinc-600 dark:text-zinc-200">
                  Inbox
                </TabsTrigger>
                <TabsTrigger value="all" className="text-zinc-600 dark:text-zinc-200">
                  All
                </TabsTrigger>
              </TabsList>
              <div className="bg-background/95 supports-backdrop-filter:bg-background/60 backdrop-blur-sm">
                <form>
                  <div className="relative">
                    <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
                    <DebouncedInput
                      value={search}
                      type="search"
                      onChange={(value) => setSearch(value as string)}
                      placeholder="Search appeals..."
                      className="pl-8"
                    />
                  </div>
                </form>
              </div>
            </div>
            <Separator />
            <div
              onScroll={(e) => fetchMoreOnBottomReached(e.target as HTMLDivElement)}
              ref={tableContainerRef}
              className="relative h-full flex-1 overflow-auto"
            >
              <TabsContent value="inbox" className="m-0 h-full">
                {!isLoading && <AppealList items={appeals} />}
              </TabsContent>
              <TabsContent value="all" className="m-0 h-full">
                {!isLoading && <AppealList items={appeals} />}
              </TabsContent>
            </div>
          </Tabs>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={defaultLayout[2]} minSize={30}>
          {children}
        </ResizablePanel>
      </ResizablePanelGroup>
    </TooltipProvider>
  );
}
