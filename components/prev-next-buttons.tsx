"use client";
import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useModalCollection } from "./modal-collection-context";

export const NextPrevButtons = React.forwardRef<HTMLDivElement, { rowId: string; path: string }>(
  ({ rowId, path }, ref) => {
    const { previousRowId, nextRowId } = useModalCollection(rowId);

    return (
      <div ref={ref} className="sticky bottom-0 flex justify-between border-t border-zinc-700 bg-zinc-900 px-4 py-2">
        <Button
          asChild
          variant="outline"
          disabled={Boolean(previousRowId)}
          className="bg-white px-6 py-2 shadow-lg dark:bg-zinc-800"
        >
          {previousRowId ? (
            <Link href={`${path}${previousRowId}`}>← Previous</Link>
          ) : (
            <span className="opacity-50">← Previous</span>
          )}
        </Button>

        <Button
          asChild
          variant="outline"
          disabled={Boolean(nextRowId)}
          className="bg-white px-6 py-2 shadow-lg dark:bg-zinc-800"
        >
          {nextRowId ? <Link href={`${path}${nextRowId}`}>Next →</Link> : <span className="opacity-50">Next →</span>}
        </Button>
      </div>
    );
  },
);

export default NextPrevButtons;
