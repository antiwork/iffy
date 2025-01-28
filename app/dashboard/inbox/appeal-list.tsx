"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { AppealWithMessages } from "./types";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { useParams, useRouter } from "next/navigation";
import { formatAppealStatus } from "@/lib/badges";
import { formatRecordUserCompact } from "@/lib/record-user";

export function AppealList({ items }: { items: AppealWithMessages[] }) {
  const router = useRouter();
  const { id: selectedAppealId } = useParams<{ id?: string }>();

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col">
        {items.map((item) => {
          return (
            <button
              key={item.id}
              className={cn(
                "flex flex-col items-stretch gap-2 border-b border-stone-300 p-4 text-left text-sm text-gray-950 ring-offset-green-950/80 transition-all hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-green-950/20 focus-visible:ring-offset-2 dark:border-b-zinc-800 dark:text-white/80 dark:ring-offset-stone-950 dark:hover:bg-white/5 dark:focus-visible:ring-stone-300 dark:focus-visible:ring-offset-stone-950",
                selectedAppealId === item.id && "bg-stone-100 dark:bg-white/5",
              )}
              onClick={() => {
                router.push(`/dashboard/inbox/${item.id}`);
              }}
            >
              <div className="flex justify-between gap-2">
                <div className="flex flex-1 flex-col gap-2">
                  <div className="font-semibold">{formatRecordUserCompact(item.recordUserAction.recordUser)}</div>
                  <div
                    className={cn(
                      "text-xs",
                      selectedAppealId === item.id
                        ? "text-black dark:text-white/80"
                        : "text-gray-500 dark:text-zinc-400",
                    )}
                  >
                    {formatDistanceToNow(item.createdAt, {
                      addSuffix: true,
                    })}
                  </div>
                </div>
                <div>{formatAppealStatus(item)}</div>
              </div>
              {item.messages[0]?.subject && <div className="text-xs font-medium">{item.messages[0].subject}</div>}
              <div className="text-muted-foreground line-clamp-2 text-sm dark:text-zinc-400">
                {item.messages[0]?.text?.substring(0, 300)}
              </div>
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
}
