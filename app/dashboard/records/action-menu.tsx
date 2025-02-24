"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MoreHorizontal, Command } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import * as schema from "@/db/schema";
import { createModerations, moderateMany } from "./actions";
import { toast } from "@/hooks/use-toast";

type Record = typeof schema.records.$inferSelect;

export const BulkActionMenu = ({ records }: { records: Record[] }) => {
  const utils = trpc.useUtils();
  const createModerationsWithIds = createModerations.bind(
    null,
    records.map((record) => record.id),
  );
  const moderateManyWithIds = moderateMany.bind(
    null,
    records.map((record) => record.id),
  );
  const [actionType, setActionType] = useState<"flag" | "unflag" | null>(null);
  const [reasoning, setReasoning] = useState<{ value: string; error?: boolean }>({ value: "" });
  const [isLoading, setIsLoading] = useState(false);

  const hideFlag = records.length === 1 && records[0]?.moderationStatus === "Flagged";
  const hideUnflag = records.length === 1 && records[0]?.moderationStatus === "Compliant";

  const handleAction = useCallback(async () => {
    if (!reasoning.value.trim()) {
      setReasoning((prev) => ({ ...prev, error: true }));
      return;
    }
    setIsLoading(true);
    try {
      if (actionType === "flag") {
        await createModerationsWithIds({ status: "Flagged", reasoning: reasoning.value });
      } else if (actionType === "unflag") {
        await createModerationsWithIds({ status: "Compliant", reasoning: reasoning.value });
      }
      await utils.record.infinite.invalidate();
      await utils.user.infinite.invalidate();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to perform action.",
        variant: "destructive",
      });
      console.error("Error performing action:", error);
    } finally {
      setIsLoading(false);
      setActionType(null);
      setReasoning({ value: "" });
    }
  }, [actionType, reasoning, createModerationsWithIds, utils]);

  const handleCancel = () => {
    setActionType(null);
    setReasoning({ value: "" });
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter" && actionType) {
        handleAction();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [actionType, handleAction]);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="h-8 w-8 p-0" onClick={(event) => event.stopPropagation()}>
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={async (event) => {
              try {
                event.stopPropagation();
                await moderateManyWithIds();
                utils.record.infinite.invalidate();
              } catch (error) {
                toast({
                  title: "Error",
                  description: "Failed to re-moderate records.",
                  variant: "destructive",
                });
                console.error("Error re-moderating records:", error);
              }
            }}
          >
            Re-run moderation
          </DropdownMenuItem>
          {!hideUnflag && (
            <DropdownMenuItem
              onClick={(event) => {
                event.stopPropagation();
                setActionType("unflag");
              }}
            >
              Unflag record
            </DropdownMenuItem>
          )}
          {!hideFlag && (
            <DropdownMenuItem
              onClick={(event) => {
                event.stopPropagation();
                setActionType("flag");
              }}
            >
              Flag record
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={actionType !== null} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actionType === "flag" ? "Flag" : "Unflag"} record</DialogTitle>
          </DialogHeader>
          <div className="grid w-full gap-2">
            <Label htmlFor="reasoning">Reasoning</Label>
            <Textarea
              id="reasoning"
              placeholder="Enter your reasoning"
              value={reasoning.value}
              onChange={(e) => setReasoning({ value: e.target.value, error: false })}
              className={cn(reasoning.error && "border-red-500")}
            />
            {reasoning.error && <p className="text-sm text-red-500">Reasoning is required.</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleAction} disabled={isLoading} className="flex items-center gap-2">
              {isLoading ? (
                "Processing..."
              ) : (
                <>
                  Confirm
                  <pre className="flex items-center gap-1 rounded-sm border border-white bg-transparent p-1 text-xs text-white">
                    <Command className="h-3 w-3" />
                    <span>+</span>
                    <span>Enter</span>
                  </pre>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export const ActionMenu = ({ record }: { record: Record }) => {
  return <BulkActionMenu records={[record]} />;
};
