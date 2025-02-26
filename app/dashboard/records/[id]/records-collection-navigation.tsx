"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useActiveCollection } from "@/components/context/ActiveCollectionContext";
import { PrevNextButtons } from "@/components/prevnext-buttons";
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
  const onPrev = (recordId: string) => {
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
    <div className="sticky bottom-6 px-6">
      <PrevNextButtons
        currentItemId={currentRecordId}
        items={records}
        onPrev={onPrev}
        onNext={onNext}
        fetchNextItems={fetchNextItems}
        hasNextItems={hasNextPage}
      />
    </div>
  );
}
