"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useActiveCollection } from "@/components/active-collection-context";
import { PreviousNextButtons } from "@/components/previous-next-buttons";
import { Record } from "../types";
import { InfiniteData } from "@tanstack/react-query";

interface RecordsCollectionNavigationProps {
  currentRecordId: string;
}

type RecordsPage = {
  records: Record[];
  nextCursor?: number | undefined;
};

export function RecordsCollectionNavigation({ currentRecordId }: RecordsCollectionNavigationProps) {
  const { query } = useActiveCollection<InfiniteData<RecordsPage>>();
  const isRecordsActiveCollection = query?.data?.pages[0]?.records;
  const { data, fetchNextPage, hasNextPage } = query ?? {};

  const records: Record[] = React.useMemo(() => data?.pages?.flatMap((page) => page.records) ?? [], [data]);

  const router = useRouter();
  const onPrevious = (recordId: string) => {
    router.replace(`/dashboard/records/${recordId}`);
  };

  const onNext = (recordId: string) => {
    router.replace(`/dashboard/records/${recordId}`);
  };

  const fetchNextItems = async () => {
    if (fetchNextPage) {
      const { data } = await fetchNextPage();
      const records: Record[] = data?.pages?.flatMap((page) => page.records) ?? [];

      return records;
    }
  };

  if (!isRecordsActiveCollection) return null;
  return (
    <div className="sticky bottom-0 px-6 py-2">
      <PreviousNextButtons
        currentItemId={currentRecordId}
        items={records}
        onPrevious={onPrevious}
        onNext={onNext}
        fetchNextItems={fetchNextItems}
        hasNextItems={hasNextPage}
      />
    </div>
  );
}
