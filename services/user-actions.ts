import db from "@/db";
import { inngest } from "@/inngest/client";
import * as schema from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { ViaWithRelations } from "@/lib/types";

type ActionStatus = (typeof schema.userActionStatus.enumValues)[number];

export async function createUserAction({
  organizationId,
  endUserId,
  status,
  via,
  userId,
  reasoning,
  viaRecordId,
  viaAppealId,
}: {
  organizationId: string;
  endUserId: string;
  status: ActionStatus;
  reasoning?: string;
} & ViaWithRelations) {
  const [userAction, lastUserAction] = await db.transaction(async (tx) => {
    const user = await tx.query.endUsers.findFirst({
      where: and(eq(schema.endUsers.organizationId, organizationId), eq(schema.endUsers.id, endUserId)),
      columns: {
        protected: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (user.protected && status !== "Compliant") {
      throw new Error("User is protected");
    }

    const lastUserAction = await tx.query.userActions.findFirst({
      where: and(eq(schema.userActions.organizationId, organizationId), eq(schema.userActions.endUserId, endUserId)),
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
        organizationId,
        status,
        endUserId,
        via,
        userId,
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
      .update(schema.endUsers)
      .set({
        actionStatus: status,
        actionStatusCreatedAt: userAction.createdAt,
      })
      .where(and(eq(schema.endUsers.organizationId, organizationId), eq(schema.endUsers.id, endUserId)));

    return [userAction, lastUserAction];
  });

  if (status !== lastUserAction?.status) {
    try {
      await inngest.send({
        name: "user-action/status-changed",
        data: {
          organizationId,
          id: userAction.id,
          endUserId,
          status,
          lastStatus: lastUserAction?.status ?? null,
        },
      });
    } catch (error) {
      console.error(error);
    }
  }
}
