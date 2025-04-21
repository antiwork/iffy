import db from "@/db";
import { inngest } from "@/inngest/client";
import * as schema from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { ViaWithRelations } from "@/lib/types";

type ActionStatus = (typeof schema.userActionStatus.enumValues)[number];

export async function createUserAction({
  clerkOrganizationId,
  userRecordId,
  status,
  via,
  clerkUserId,
  reasoning,
  viaRecordId,
  viaAppealId,
}: {
  clerkOrganizationId: string;
  userRecordId: string;
  status: ActionStatus;
  reasoning?: string;
} & ViaWithRelations) {
  const [userAction, lastUserAction] = await db.transaction(async (tx) => {
    const userRecord = await tx.query.userRecords.findFirst({
      where: and(
        eq(schema.userRecords.clerkOrganizationId, clerkOrganizationId),
        eq(schema.userRecords.id, userRecordId),
      ),
      columns: {
        protected: true,
      },
    });

    if (!userRecord) {
      throw new Error("User not found");
    }

    if (userRecord.protected && status !== "Compliant") {
      throw new Error("User is protected");
    }

    const lastUserAction = await tx.query.userActions.findFirst({
      where: and(
        eq(schema.userActions.clerkOrganizationId, clerkOrganizationId),
        eq(schema.userActions.userRecordId, userRecordId),
      ),
      orderBy: desc(schema.userActions.createdAt),
      columns: {
        id: true,
        status: true,
      },
    });

    if (lastUserAction?.status === status) {
      return [lastUserAction, undefined];
    }

    const [userAction] = await tx
      .insert(schema.userActions)
      .values({
        clerkOrganizationId,
        status,
        userRecordId,
        via,
        clerkUserId,
        reasoning,
        viaRecordId,
        viaAppealId,
      })
      .returning();

    if (!userAction) {
      throw new Error("Failed to create user action");
    }

    // sync the record user status with the new status
    await tx
      .update(schema.userRecords)
      .set({
        actionStatus: status,
        actionStatusCreatedAt: userAction.createdAt,
      })
      .where(
        and(eq(schema.userRecords.clerkOrganizationId, clerkOrganizationId), eq(schema.userRecords.id, userRecordId)),
      );

    return [userAction, lastUserAction];
  });

  if (status !== lastUserAction?.status) {
    try {
      await inngest.send({
        name: "user-action/status-changed",
        data: {
          clerkOrganizationId,
          id: userAction.id,
          userRecordId,
          status,
          lastStatus: lastUserAction?.status ?? null,
        },
      });
    } catch (error) {
      console.error(error);
    }
  }
}
