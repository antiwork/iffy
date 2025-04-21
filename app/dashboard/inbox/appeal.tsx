"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatUserRecord, getUserRecordSecondaryParts } from "@/lib/user-record";
import {
  formatModerationStatus,
  formatVia,
  formatUserActionStatus,
  formatAppealStatus,
  getAppealActionStatus,
} from "@/lib/badges";
import {
  AppealTimelineItem,
  AppealAction,
  Message,
  UserAction,
  Moderation,
  Record,
  Appeal as AppealData,
  isAction,
  isUserAction,
  isModeration,
  isDeletedRecord,
  isInboundMessage,
  isOutboundMessage,
  isMessage,
  AppealTimelineUserAction,
  UserRecord,
  AppealTimelineAction,
  AppealTimelineModeration,
  AppealTimelineMessage,
  AppealTimelineDeletedRecord,
} from "./types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { createAppealAction } from "./actions";
import { trpc } from "@/lib/trpc";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

function makeAppealTimeline(
  actions: AppealAction[],
  messages: Message[],
  userActions: UserAction[],
  records: Record[],
  moderations: Moderation[],
) {
  let items: AppealTimelineItem[] = [];
  items = items.concat(messages.map((data) => ({ type: "Message", data, sortDate: data.createdAt })));
  items = items.concat(actions.map((data) => ({ type: "Action", data, sortDate: data.createdAt })));
  items = items.concat(userActions.map((data) => ({ type: "User Action", data, sortDate: data.createdAt })));
  items = items.concat(moderations.map((data) => ({ type: "Moderation", data, sortDate: data.updatedAt })));
  items = items.concat(
    records
      .filter((data) => data.deletedAt)
      .map((data) => ({ type: "Deleted Record", data, sortDate: data.deletedAt! })),
  );
  items = items.sort((a, b) => a.sortDate.getTime() - b.sortDate.getTime());
  return items;
}

const AppealActionItem = ({ item }: { item: AppealTimelineAction }) => {
  return (
    <div className="text-sm text-gray-950 dark:text-white/80">
      Appeal marked {getAppealActionStatus(item.data)} via {formatVia(item.data)}
    </div>
  );
};

const UserActionItem = ({ item, userRecord }: { item: AppealTimelineUserAction; userRecord: UserRecord }) => (
  <div className="text-sm text-gray-950 dark:text-white/80">
    <Link href={`/dashboard/users/${userRecord.id}`} className="font-bold">
      {formatUserRecord(userRecord)}
    </Link>{" "}
    marked {formatUserActionStatus(item.data)} via {formatVia(item.data)}
  </div>
);

const ModerationItem = ({ item }: { item: AppealTimelineModeration; userRecord: UserRecord }) => (
  <div className="text-sm text-gray-950 dark:text-white/80">
    {item.data.record.entity}{" "}
    <Link href={`/dashboard/records/${item.data.record.id}`} className="font-bold">
      {item.data.record.name}
    </Link>{" "}
    marked {formatModerationStatus(item.data)} via {formatVia(item.data)}
  </div>
);

const DeletedRecordItem = ({ item }: { item: AppealTimelineDeletedRecord }) => (
  <div className="text-sm text-gray-950 dark:text-white/80">
    {item.data.entity}{" "}
    <Link href={`/dashboard/records/${item.data.id}`} className="font-bold">
      {item.data.name}
    </Link>{" "}
    was deleted
  </div>
);

const MessageItem = ({ item }: { item: AppealTimelineMessage }) => (
  <div className={cn("max-w-[70%]")}>
    <div
      className={cn(
        "rounded-lg p-3",
        isInboundMessage(item)
          ? "bg-stone-100 dark:bg-zinc-800"
          : "bg-green-600/20 text-green-900 dark:bg-green-950 dark:text-white",
      )}
    >
      {item.data.text}
    </div>
  </div>
);

const TimelineItem = ({ item, appeal }: { item: AppealTimelineItem; appeal: AppealData }) => {
  if (isAction(item)) return <AppealActionItem item={item} />;
  if (isUserAction(item)) return <UserActionItem item={item} userRecord={appeal.userAction.userRecord} />;
  if (isModeration(item)) return <ModerationItem item={item} userRecord={appeal.userAction.userRecord} />;
  if (isDeletedRecord(item)) return <DeletedRecordItem item={item} />;
  return <MessageItem item={item} />;
};

const TimelineEnd = () => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.scrollIntoView();
  }, []);

  return <div ref={ref} className="invisible"></div>;
};

const TimelineItemLayout = ({
  item,
  children,
  className,
  ...props
}: { item: AppealTimelineItem; children: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn(
        "flex flex-col",
        {
          "items-center": !isMessage(item),
          "items-end": isOutboundMessage(item),
          "items-start": isMessage(item) && !isOutboundMessage(item),
        },
        className,
      )}
    >
      {children}
      <span className="mt-1 text-xs text-gray-500 dark:text-zinc-400">{item.data.createdAt.toLocaleString()}</span>
    </div>
  );
};

const AppealApproveConfirmation = ({
  onConfirm,
  onCancel,
  disabled,
}: {
  onConfirm: () => void;
  onCancel?: () => void;
  disabled: boolean;
}) => {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" disabled={disabled}>
          Unsuspend
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unsuspend user?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to approve this appeal and unsuspend the user?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Unsuspend</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

const AppealRejectConfirmation = ({
  onConfirm,
  onCancel,
  disabled,
}: {
  onConfirm: () => void;
  onCancel?: () => void;
  disabled: boolean;
}) => {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="destructive" disabled={disabled}>
          Reject
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reject appeal?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to reject this appeal and keep the user suspended?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600/90 text-stone-50 hover:bg-red-600 dark:bg-red-900 dark:text-stone-50 dark:hover:bg-red-900/90"
          >
            Reject
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export function Appeal({
  appeal,
  actions,
  messages,
  userActions,
  records,
  moderations,
}: {
  appeal: AppealData;
  actions: AppealAction[];
  messages: Message[];
  userActions: UserAction[];
  records: Record[];
  moderations: Moderation[];
}) {
  const { toast } = useToast();
  const router = useRouter();
  const utils = trpc.useUtils();
  const timeline = useMemo(
    () => makeAppealTimeline(actions, messages, userActions, records, moderations),
    [actions, messages, userActions, records, moderations],
  );

  const createAppealActionWithId = createAppealAction.bind(null, appeal.id);

  return (
    <div className="flex h-full flex-col">
      <div className="flex justify-between gap-4 border-b border-stone-300 p-4 dark:border-zinc-800">
        <div className="flex-1 text-gray-950 dark:text-white/80">
          <div className="text-lg">
            <Link href={`/dashboard/users/${appeal.userAction.userRecordId}`} className="font-bold">
              {formatUserRecord(appeal.userAction.userRecord)}
            </Link>
          </div>
          {getUserRecordSecondaryParts(appeal.userAction.userRecord).map((part) => (
            <div key={part} className="text-sm">
              {part}
            </div>
          ))}
          <div className="text-sm">{appeal.createdAt.toLocaleString()}</div>
        </div>
        <div>{formatAppealStatus(appeal)}</div>
      </div>
      <div className="flex-1 overflow-y-auto border-b dark:border-zinc-800">
        {timeline.map((item, i) => (
          <TimelineItemLayout key={i} item={item} className="p-4">
            <TimelineItem item={item} appeal={appeal} />
          </TimelineItemLayout>
        ))}
        <TimelineEnd />
      </div>
      <div className="flex justify-end gap-2 border-t border-stone-300 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <AppealRejectConfirmation
          onConfirm={async () => {
            try {
              await createAppealActionWithId({ status: "Rejected" });
              await utils.appeal.infinite.invalidate();
              router.refresh();
            } catch (error) {
              toast({
                title: "Error",
                description: "Failed to reject appeal.",
                variant: "destructive",
              });
              console.error("Error rejecting appeal:", error);
            }
          }}
          disabled={appeal.actionStatus !== "Open"}
        />
        <AppealApproveConfirmation
          onConfirm={async () => {
            try {
              await createAppealActionWithId({ status: "Approved" });
              await utils.appeal.infinite.invalidate();
              router.refresh();
            } catch (error) {
              toast({
                title: "Error",
                description: "Failed to approve appeal.",
                variant: "destructive",
              });
              console.error("Error approving appeal:", error);
            }
          }}
          disabled={appeal.actionStatus !== "Open"}
        />
      </div>
    </div>
  );
}
