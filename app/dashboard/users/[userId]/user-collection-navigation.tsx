"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useActiveCollection } from "@/components/active-collection-context";
import { PreviousNextButtons } from "@/components/previous-next-buttons";
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
  const onPrevious = (userId: string) => {
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
    <div className="sticky bottom-0 px-6 py-2">
      <PreviousNextButtons
        currentItemId={currentUserId}
        items={users}
        onPrevious={onPrevious}
        onNext={onNext}
        fetchNextItems={fetchNextItems}
        hasNextItems={hasNextPage}
      />
    </div>
  );
}
