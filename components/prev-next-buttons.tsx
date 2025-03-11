"use client";
import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useModalCollection } from "./modal-collection-context";

export const NextPrevButtons = React.forwardRef<HTMLDivElement, { recordId: string; path: string }>(
  ({ recordId, path }, ref) => {
    const { previousRecordId, nextRecordId } = useModalCollection(recordId);

    return (
      <div ref={ref} className="sticky bottom-0 flex justify-between border-t border-zinc-700 bg-zinc-900 px-4 py-2">
        <Button
          asChild
          variant="outline"
          disabled={Boolean(previousRecordId)}
          className="bg-white px-6 py-2 shadow-lg dark:bg-zinc-800"
        >
          {previousRecordId ? (
            <Link href={`${path}${previousRecordId}`}>← Previous</Link>
          ) : (
            <span className="opacity-50">← Previous</span>
          )}
        </Button>

        <Button
          asChild
          variant="outline"
          disabled={Boolean(nextRecordId)}
          className="bg-white px-6 py-2 shadow-lg dark:bg-zinc-800"
        >
          {nextRecordId ? (
            <Link href={`${path}${nextRecordId}`}>Next →</Link>
          ) : (
            <span className="opacity-50">Next →</span>
          )}
        </Button>
      </div>
    );
  },
);

export default NextPrevButtons;
