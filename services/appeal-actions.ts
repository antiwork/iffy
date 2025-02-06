import db from "@/db";
import { inngest } from "@/inngest/client";
import * as schema from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { ViaWithClerkUserOrUser } from "@/lib/types";

type ActionStatus = (typeof schema.appealActionStatus.enumValues)[number];
type Via = (typeof schema.via.enumValues)[number];

export async function createAppealAction({
  clerkOrganizationId,
  appealId,
  status,
  via,
  clerkUserId,
}: {
  clerkOrganizationId: string;
  appealId: string;
  status: ActionStatus;
} & ViaWithClerkUserOrUser) {
  const lastAction = await db.query.appealActions.findFirst({
    where: and(
      eq(schema.appealActions.clerkOrganizationId, clerkOrganizationId),
      eq(schema.appealActions.appealId, appealId),
    ),
    orderBy: desc(schema.appealActions.createdAt),
    columns: {
      status: true,
    },
  });

  if (lastAction?.status === status) {
    return lastAction;
  }

  const [appealAction] = await db
    .insert(schema.appealActions)
    .values({
      clerkOrganizationId,
      status,
      appealId,
      via,
      clerkUserId,
    })
    .returning();

  if (!appealAction) {
    throw new Error("Failed to create appeal action");
  }

  const appeal = await db.query.appeals.findFirst({
    where: and(eq(schema.appeals.clerkOrganizationId, clerkOrganizationId), eq(schema.appeals.id, appealId)),
    columns: {
      actionStatus: true,
    },
  });

  // read the last status from the record user
  const lastStatus = appeal?.actionStatus;

  // sync the record user status with the new status
  await db
    .update(schema.appeals)
    .set({
      actionStatus: status,
      actionStatusCreatedAt: appealAction.createdAt,
    })
    .where(and(eq(schema.appeals.clerkOrganizationId, clerkOrganizationId), eq(schema.appeals.id, appealId)));

  if (status !== lastStatus) {
    try {
      await inngest.send({
        name: "appeal-action/status-changed",
        data: {
          clerkOrganizationId,
          id: appealAction.id,
          appealId,
          status,
          lastStatus: lastStatus ?? null,
        },
      });
    } catch (error) {
      console.error(error);
    }
  }

  return appealAction;
}
