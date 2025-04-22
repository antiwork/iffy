import * as schema from "@/db/schema";

type AppealBase = typeof schema.appeals.$inferSelect;
type MessageBase = typeof schema.messages.$inferSelect;
type ModerationBase = typeof schema.moderations.$inferSelect;

export type UserAction = typeof schema.userActions.$inferSelect;
export type Record = typeof schema.records.$inferSelect;
export type UserRecord = typeof schema.userRecords.$inferSelect;
export type AppealAction = typeof schema.appealActions.$inferSelect;

export type Message = MessageBase & {
  from: UserRecord | null;
};

export type Appeal = AppealBase & {
  userAction: UserAction & {
    userRecord: UserRecord;
  };
};

export type AppealWithMessages = Appeal & {
  messages: Message[];
};

export type Moderation = ModerationBase & {
  record: Record;
};

export type AppealTimelineMessage = { type: "Message"; data: Message; sortDate: Date };
export type AppealTimelineAction = { type: "Action"; data: AppealAction; sortDate: Date };
export type AppealTimelineUserAction = { type: "User Action"; data: UserAction; sortDate: Date };
export type AppealTimelineModeration = { type: "Moderation"; data: Moderation; sortDate: Date };
export type AppealTimelineDeletedRecord = { type: "Deleted Record"; data: Record; sortDate: Date };

export type AppealTimelineItem =
  | AppealTimelineMessage
  | AppealTimelineAction
  | AppealTimelineUserAction
  | AppealTimelineModeration
  | AppealTimelineDeletedRecord;

export const isMessage = (item: AppealTimelineItem): item is AppealTimelineMessage => item.type === "Message";
export const isAction = (item: AppealTimelineItem): item is AppealTimelineAction => item.type === "Action";
export const isUserAction = (item: AppealTimelineItem): item is AppealTimelineUserAction => item.type === "User Action";
export const isModeration = (item: AppealTimelineItem): item is AppealTimelineModeration => item.type === "Moderation";
export const isInboundMessage = (item: AppealTimelineItem): item is AppealTimelineMessage =>
  item.type === "Message" && item.data.type === "Inbound";
export const isOutboundMessage = (item: AppealTimelineItem): item is AppealTimelineMessage =>
  item.type === "Message" && item.data.type === "Outbound";
export const isDeletedRecord = (item: AppealTimelineItem): item is AppealTimelineDeletedRecord =>
  item.type === "Deleted Record";
