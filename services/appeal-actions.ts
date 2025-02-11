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
  const [appealAction, lastAppealAction] = await db.transaction(async (tx) => {
    const lastAppealAction = await tx.query.appealActions.findFirst({
      where: and(
        eq(schema.appealActions.clerkOrganizationId, clerkOrganizationId),
        eq(schema.appealActions.appealId, appealId),
      ),
      orderBy: desc(schema.appealActions.createdAt),
      columns: {
        id: true,
        status: true,
      },
    });

    if (lastAppealAction?.status === status) {
      return [lastAppealAction, undefined];
    }

    const [appealAction] = await tx
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

    // sync the record user status with the new status
    await tx
      .update(schema.appeals)
      .set({
        actionStatus: status,
        actionStatusCreatedAt: appealAction.createdAt,
      })
      .where(and(eq(schema.appeals.clerkOrganizationId, clerkOrganizationId), eq(schema.appeals.id, appealId)));

    return [appealAction, lastAppealAction];
  });

  if (status !== lastAppealAction?.status) {
    try {
      await inngest.send({
        name: "appeal-action/status-changed",
        data: {
          clerkOrganizationId,
          id: appealAction.id,
          appealId,
          status,
          lastStatus: lastAppealAction?.status ?? null,
        },
      });
    } catch (error) {
      console.error(error);
    }
  }

  return appealAction;
}
