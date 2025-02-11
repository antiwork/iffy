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
  let transactionResult: typeof schema.appealActions.$inferSelect;
  let lastStatusFromTransaction: (typeof schema.appeals.$inferSelect)["actionStatus"] | null = null;

  const result = await db.transaction(async (tx): Promise<typeof schema.appealActions.$inferSelect> => {
    const lastAction = await tx.query.appealActions.findFirst({
      where: and(
        eq(schema.appealActions.clerkOrganizationId, clerkOrganizationId),
        eq(schema.appealActions.appealId, appealId),
      ),
      orderBy: desc(schema.appealActions.createdAt),
      columns: {
        status: true,
      },
    });

    if (lastAction?.status === status && lastAction) {
      return lastAction as typeof schema.appealActions.$inferSelect;
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

    const appeal = await tx.query.appeals.findFirst({
      where: and(eq(schema.appeals.clerkOrganizationId, clerkOrganizationId), eq(schema.appeals.id, appealId)),
      columns: {
        actionStatus: true,
      },
    });

    // read the last status from the record user
    lastStatusFromTransaction = appeal?.actionStatus ?? null;

    // sync the record user status with the new status
    await tx
      .update(schema.appeals)
      .set({
        actionStatus: status,
        actionStatusCreatedAt: appealAction.createdAt,
      })
      .where(and(eq(schema.appeals.clerkOrganizationId, clerkOrganizationId), eq(schema.appeals.id, appealId)));

    return appealAction;
  });
  transactionResult = result;

  if (status !== lastStatusFromTransaction) {
    try {
      await inngest.send({
        name: "appeal-action/status-changed",
        data: {
          clerkOrganizationId,
          id: transactionResult.id,
          appealId,
          status,
          lastStatus: lastStatusFromTransaction ?? null,
        },
      });
    } catch (error) {
      console.error(error);
    }
  }

  return transactionResult;
}
