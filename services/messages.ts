import db from "@/db";
import * as schema from "@/db/schema";
import { and, eq } from "drizzle-orm/expressions";

type ToId = {
  type: "Outbound";
  toId: string;
  fromId?: never;
};

type FromId = {
  type: "Inbound";
  toId?: never;
  fromId: string;
};
type ToOrFromId = ToId | FromId;

export async function createMessage({
  clerkOrganizationId,
  userActionId,
  toId,
  fromId,
  type,
  subject,
  text,
  status = "Pending",
  appealId,
}: {
  clerkOrganizationId: string;
  userActionId: string;
  subject?: string;
  text: string;
  status?: (typeof schema.messageStatus.enumValues)[number];
  appealId?: string;
} & ToOrFromId) {
  const [message] = await db
    .insert(schema.messages)
    .values({
      clerkOrganizationId,
      userActionId,
      toId,
      fromId,
      type,
      subject,
      text,
      status,
      appealId,
    })
    .returning();

  return message;
}
