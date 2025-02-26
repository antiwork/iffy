"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useActiveCollection } from "@/components/context/ActiveCollectionContext";
import { PrevNextButtons } from "@/components/prevnext-buttons";
import { User } from "../types";
import { InfiniteData } from "@tanstack/react-query";

interface UsersCollectionNavigationProps {
  currentUserId: string;
}

type UserPage = {
  users: User[];
  nextCursor?: number | undefined;
};

export function UsersCollectionNavigation({ currentUserId }: UsersCollectionNavigationProps) {
  const { query } = useActiveCollection<InfiniteData<UserPage>>();
  const isUsersActiveCollection = query?.data?.pages[0]?.users;
  const { data, fetchNextPage, hasNextPage } = query ?? {};
  const users: User[] = React.useMemo(() => data?.pages?.flatMap((page) => page.users) ?? [], [query?.data]);

  const router = useRouter();
  const onPrev = (userId: string) => {
    router.replace(`/dashboard/users/${userId}`);
  };

  const onNext = (userId: string) => {
    router.replace(`/dashboard/users/${userId}`);
  };

  const fetchNextItems = async () => {
    if (fetchNextPage) {
      const { data } = await fetchNextPage();
      const users: User[] = data?.pages?.flatMap((page) => page.users) ?? [];

      return users;
    }
  };

  if (!isUsersActiveCollection) return null;
  return (
    <div className="sticky bottom-6 px-6">
      <PrevNextButtons
        currentItemId={currentUserId}
        items={users}
        onPrev={onPrev}
        onNext={onNext}
        fetchNextItems={fetchNextItems}
        hasNextItems={hasNextPage}
      />
    </div>
  );
}
