"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Command } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { createUserActions, setUserProtectedMany } from "./actions";
import { toast } from "@/hooks/use-toast";
import * as schema from "@/db/schema";
import { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type User = typeof schema.userRecords.$inferSelect;

export const BulkActionMenu = ({ users }: { users: User[] }) => {
  const utils = trpc.useUtils();
  const createUserActionsWithIds = createUserActions.bind(
    null,
    users.map((user) => user.id),
  );
  const setUserProtectedManyWithIds = setUserProtectedMany.bind(
    null,
    users.map((user) => user.id),
  );

  const [actionType, setActionType] = useState<"suspend" | "unsuspend" | "ban" | null>(null);
  const [reasoning, setReasoning] = useState<{ value: string; error?: boolean }>({ value: "" });
  const [isLoading, setIsLoading] = useState(false);

  const hideSuspend = users.length === 1 && users[0]?.actionStatus === "Suspended";
  const hideUnsuspend = users.length === 1 && users[0]?.actionStatus !== "Suspended";

  const hideBan = users.length === 1 && users[0]?.actionStatus === "Banned";
  const hideUnban = users.length === 1 && users[0]?.actionStatus !== "Banned";

  const disableSuspendAndBan = users.length === 1 && users[0]?.protected;

  const hideProtect = users.length === 1 && users[0]?.protected;
  const hideUnprotect = users.length === 1 && !users[0]?.protected;

  const handleAction = useCallback(async () => {
    if (!reasoning.value.trim()) {
      setReasoning((prev) => ({ ...prev, error: true }));
      return;
    }
    setIsLoading(true);
    try {
      if (actionType === "suspend") {
        await createUserActionsWithIds({
          status: "Suspended",
          reasoning: reasoning.value,
        });
      } else if (actionType === "unsuspend") {
        await createUserActionsWithIds({
          status: "Compliant",
          reasoning: reasoning.value,
        });
      } else if (actionType === "ban") {
        await createUserActionsWithIds({
          status: "Banned",
          reasoning: reasoning.value,
        });
      }
      await utils.user.infinite.invalidate();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${actionType} user.`,
        variant: "destructive",
      });
      console.error(`Error ${actionType}ing user:`, error);
    } finally {
      setIsLoading(false);
      setActionType(null);
      setReasoning({ value: "" });
    }
  }, [actionType, createUserActionsWithIds, reasoning.value, utils.user.infinite]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter" && actionType) {
        handleAction();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [actionType, handleAction]);

  const handleCancel = () => {
    setActionType(null);
    setReasoning({ value: "" });
  };

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
          {!hideUnsuspend && (
            <DropdownMenuItem
              onClick={(event) => {
                event.stopPropagation();
                setActionType("unsuspend");
              }}
            >
              Unsuspend user
            </DropdownMenuItem>
          )}
          {!hideSuspend && (
            <DropdownMenuItem
              disabled={disableSuspendAndBan}
              onClick={(event) => {
                event.stopPropagation();
                setActionType("suspend");
              }}
            >
              Suspend user
            </DropdownMenuItem>
          )}
          {!hideUnban && (
            <DropdownMenuItem
              onClick={(event) => {
                event.stopPropagation();
                setActionType("unsuspend");
              }}
            >
              Unban user
            </DropdownMenuItem>
          )}
          {!hideBan && (
            <DropdownMenuItem
              disabled={disableSuspendAndBan}
              onClick={(event) => {
                event.stopPropagation();
                setActionType("ban");
              }}
            >
              Ban user
            </DropdownMenuItem>
          )}
          {!hideProtect && (
            <DropdownMenuItem
              onClick={async (event) => {
                try {
                  event.stopPropagation();
                  await setUserProtectedManyWithIds(true);
                  await utils.user.infinite.invalidate();
                } catch (error) {
                  toast({
                    title: "Error",
                    description: "Failed to protect user.",
                    variant: "destructive",
                  });
                  console.error("Error protecting user:", error);
                }
              }}
            >
              Protect user
            </DropdownMenuItem>
          )}
          {!hideUnprotect && (
            <DropdownMenuItem
              onClick={async (event) => {
                try {
                  event.stopPropagation();
                  await setUserProtectedManyWithIds(false);
                  await utils.user.infinite.invalidate();
                } catch (error) {
                  toast({
                    title: "Error",
                    description: "Failed to unprotect user.",
                    variant: "destructive",
                  });
                  console.error("Error unprotecting user:", error);
                }
              }}
            >
              Unprotect user
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={actionType !== null} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "suspend"
                ? "Suspend"
                : actionType === "unsuspend"
                  ? "Unsuspend"
                  : actionType === "ban"
                    ? "Ban"
                    : ""}{" "}
              user
            </DialogTitle>
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
                  <pre className="flex items-center gap-1 rounded border border-white bg-transparent p-1 text-xs text-white">
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

export const ActionMenu = ({ user }: { user: User }) => {
  return <BulkActionMenu users={[user]} />;
};
