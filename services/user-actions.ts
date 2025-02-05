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
  const user = await db.query.users.findFirst({
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

  const lastAction = await db.query.userActions.findFirst({
    where: and(eq(schema.userActions.clerkOrganizationId, clerkOrganizationId), eq(schema.userActions.userId, userId)),
    orderBy: desc(schema.userActions.createdAt),
    columns: {
      status: true,
    },
  });

  // read the last status
  const lastStatus = lastAction?.status;

  if (lastStatus === status) {
    return lastAction;
  }

  const [userAction] = await db
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
  await db
    .update(schema.users)
    .set({
      actionStatus: status,
      actionStatusCreatedAt: userAction.createdAt,
    })
    .where(and(eq(schema.users.clerkOrganizationId, clerkOrganizationId), eq(schema.users.id, userId)));

  if (status !== lastStatus) {
    try {
      await inngest.send({
        name: "user-action/status-changed",
        data: {
          clerkOrganizationId,
          id: userAction.id,
          userId,
          status,
          lastStatus: lastStatus ?? null,
        },
      });
    } catch (error) {
      console.error(error);
    }
  }

  return userAction;
}
