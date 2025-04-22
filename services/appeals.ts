import db from "@/db";
import * as schema from "@/db/schema";
import { eq, desc, and, sql, count } from "drizzle-orm";
import * as crypto from "crypto";
import { env } from "@/lib/env";
import { inngest } from "@/inngest/client";
import { deriveSecret } from "@/lib/crypto";

export function generateAppealToken(userRecordId: string) {
  const derivedKey = deriveSecret(env.SECRET_KEY, `appeal-token`);
  const signature = crypto.createHmac("sha256", derivedKey).update(userRecordId).digest("hex");

  return `${userRecordId}-${signature}`;
}

export function validateAppealToken(
  token: string,
): [isValid: false, userRecordId: null] | [isValid: true, userRecordId: string] {
  const [userRecordId, _] = token.split("-");
  if (!userRecordId) {
    return [false, null];
  }

  if (token === generateAppealToken(userRecordId)) {
    return [true, userRecordId];
  }

  return [false, null];
}

export async function createAppeal({ userRecordId, text }: { userRecordId: string; text: string }) {
  const [appeal, appealAction] = await db.transaction(async (tx) => {
    const userRecord = await tx.query.userRecords.findFirst({
      where: eq(schema.userRecords.id, userRecordId),
      orderBy: desc(schema.userActions.createdAt),
      with: {
        actions: {
          orderBy: desc(schema.appealActions.createdAt),
          limit: 1,
        },
      },
    });

    if (!userRecord) {
      throw new Error("User not found");
    }

    const userAction = userRecord.actions[0];
    if (!userAction) {
      throw new Error("User is not suspended");
    }

    if (userAction.status === "Banned") {
      throw new Error("Banned users may not appeal");
    }

    if (userAction.status !== "Suspended") {
      throw new Error("User is not suspended");
    }

    const { organizationId } = userRecord;

    const existingAppeal = await tx.query.appeals.findFirst({
      where: and(eq(schema.appeals.organizationId, organizationId), eq(schema.appeals.userActionId, userAction.id)),
    });

    if (existingAppeal) {
      throw new Error("Appeal already exists");
    }

    const [appeal] = await tx
      .insert(schema.appeals)
      .values({
        organizationId,
        userActionId: userAction.id,
      })
      .returning();

    if (!appeal) {
      throw new Error("Failed to create appeal");
    }

    const [appealAction] = await tx
      .insert(schema.appealActions)
      .values({
        organizationId,
        appealId: appeal.id,
        status: "Open",
        via: "Inbound",
      })
      .returning();

    if (!appealAction) {
      throw new Error("Failed to create appeal action");
    }

    // sync the record user status with the new status
    await tx
      .update(schema.appeals)
      .set({
        actionStatus: appealAction.status,
        actionStatusCreatedAt: appealAction.createdAt,
      })
      .where(and(eq(schema.appeals.organizationId, organizationId), eq(schema.appeals.id, appeal.id)));

    await tx
      .update(schema.messages)
      .set({
        appealId: appeal.id,
      })
      .where(and(eq(schema.messages.organizationId, organizationId), eq(schema.messages.userActionId, userAction.id)));

    await tx.insert(schema.messages).values({
      organizationId,
      userActionId: userAction.id,
      fromId: userRecordId,
      text,
      appealId: appeal.id,
      type: "Inbound",
      status: "Delivered",
    });

    return [appeal, appealAction];
  });

  try {
    await inngest.send({
      name: "appeal-action/status-changed",
      data: {
        organizationId: appeal.organizationId,
        id: appealAction.id,
        appealId: appeal.id,
        status: "Open",
        lastStatus: null,
      },
    });
  } catch (error) {
    console.error(error);
  }

  return appeal;
}

export async function getInboxCount(orgId: string) {
  const [result] = await db
    .select({ count: count() })
    .from(schema.appeals)
    .where(and(eq(schema.appeals.organizationId, orgId), eq(schema.appeals.actionStatus, "Open")))
    .execute();

  if (!result) {
    throw new Error("Failed to get inbox count");
  }

  return result.count;
}
