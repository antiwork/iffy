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
  authOrganizationId: authOrganizationId,
  userActionId,
  toId,
  fromId,
  type,
  subject,
  text,
  status = "Pending",
  appealId,
}: {
  authOrganizationId: string;
  userActionId: string;
  subject?: string;
  text: string;
  status?: (typeof schema.messageStatus.enumValues)[number];
  appealId?: string;
} & ToOrFromId) {
  const [message] = await db
    .insert(schema.messages)
    .values({
      authOrganizationId,
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

export async function updateMessage({
  organizationId,
  id,
  status = "Pending",
}: {
  organizationId: string;
  id: string;
  status?: (typeof schema.messageStatus.enumValues)[number];
}) {
  const [message] = await db
    .update(schema.messages)
    .set({ status })
    .where(and(eq(schema.messages.authOrganizationId, organizationId), eq(schema.messages.id, id)))
    .returning();

  return message;
}
