import db from "@/db";
import { inngest } from "@/inngest/client";
import * as schema from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { ViaWithClerkUserOrUser } from "@/lib/types";

type ActionStatus = (typeof schema.userActionStatus.enumValues)[number];

export async function createUserAction({
  clerkOrganizationId,
  userId,
  status,
  via,
  clerkUserId,
}: {
  clerkOrganizationId: string;
  userId: string;
  status: ActionStatus;
} & ViaWithClerkUserOrUser) {
  const [userAction, lastUserAction] = await db.transaction(async (tx) => {
    const user = await tx.query.users.findFirst({
      where: and(eq(schema.users.clerkOrganizationId, clerkOrganizationId), eq(schema.users.id, userId)),
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
      where: and(
        eq(schema.userActions.clerkOrganizationId, clerkOrganizationId),
        eq(schema.userActions.userId, userId),
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
        userId,
        via,
        clerkUserId,
      })
      .returning();

    if (!userAction) {
      throw new Error("Failed to create user action");
    }

    // sync the record user status with the new status
    await tx
      .update(schema.users)
      .set({
        actionStatus: status,
        actionStatusCreatedAt: userAction.createdAt,
      })
      .where(and(eq(schema.users.clerkOrganizationId, clerkOrganizationId), eq(schema.users.id, userId)));

    return [userAction, lastUserAction];
  });

  if (userAction.status !== lastUserAction?.status) {
    try {
      await inngest.send({
        name: "user-action/status-changed",
        data: {
          clerkOrganizationId,
          id: userAction.id,
          userId,
          status,
          lastStatus: lastUserAction?.status ?? null,
        },
      });
    } catch (error) {
      console.error(error);
    }
  }
}
