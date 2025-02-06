import db from "@/db";
import * as schema from "@/db/schema";
import { eq, desc, and, sql, count } from "drizzle-orm";
import crypto from "crypto";
import { createMessage } from "./messages";
import { createAppealAction } from "./appeal-actions";
import { env } from "@/lib/env";

export function generateAppealToken(userId: string) {
  if (!env.APPEAL_ENCRYPTION_KEY) {
    throw new Error("APPEAL_ENCRYPTION_KEY is not set");
  }
  const signature = crypto.createHmac("sha256", env.APPEAL_ENCRYPTION_KEY).update(userId).digest("hex");
  return `${userId}-${signature}`;
}

export function validateAppealToken(token: string): [isValid: false, userId: null] | [isValid: true, userId: string] {
  const [userId, _] = token.split("-");
  if (!userId) {
    return [false, null];
  }
  const isValid = token === generateAppealToken(userId);
  if (!isValid) {
    return [false, null];
  }
  return [true, userId];
}

export async function createAppeal({ userId, text }: { userId: string; text: string }) {
  const user = await db.query.users.findFirst({
    where: eq(schema.users.id, userId),
    orderBy: desc(schema.userActions.createdAt),
    with: {
      actions: {
        orderBy: desc(schema.appealActions.createdAt),
        limit: 1,
      },
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const userAction = user.actions[0];
  if (!userAction) {
    throw new Error("No user action found");
  }

  if (userAction.status === "Banned") {
    throw new Error("Banned users may not appeal");
  }

  if (userAction.status !== "Suspended") {
    throw new Error("User action is not suspended");
  }

  const { clerkOrganizationId } = user;

  const [appeal] = await db
    .insert(schema.appeals)
    .values({
      clerkOrganizationId,
      userActionId: userAction.id,
    })
    .returning();

  if (!appeal) {
    throw new Error("Failed to create appeal");
  }

  await createAppealAction({
    clerkOrganizationId,
    appealId: appeal.id,
    status: "Open",
    via: "Inbound",
  });

  await db
    .update(schema.messages)
    .set({
      appealId: appeal.id,
    })
    .where(
      and(
        eq(schema.messages.clerkOrganizationId, clerkOrganizationId),
        eq(schema.messages.userActionId, userAction.id),
      ),
    );

  await createMessage({
    clerkOrganizationId,
    userActionId: userAction.id,
    fromId: userId,
    text,
    appealId: appeal.id,
    type: "Inbound",
    status: "Delivered",
  });

  return appeal;
}

export async function getInboxCount(orgId: string) {
  const [result] = await db
    .select({ count: count() })
    .from(schema.appeals)
    .where(and(eq(schema.appeals.clerkOrganizationId, orgId), eq(schema.appeals.actionStatus, "Open")))
    .execute();

  if (!result) {
    throw new Error("Failed to get inbox count");
  }

  return result.count;
}
