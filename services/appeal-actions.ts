import db from "@/db";
import { inngest } from "@/inngest/client";
import * as schema from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { ViaWithRelations } from "@/lib/types";

type ActionStatus = (typeof schema.appealActionStatus.enumValues)[number];
type Via = (typeof schema.via.enumValues)[number];

export async function createAppealAction({
  clerkOrganizationId,
  appealId,
  status,
  via,
  clerkUserId,
  reasoning,
  tx: providedTx, // Optional parameter to accept an external transaction
}: {
  clerkOrganizationId: string;
  appealId: string;
  status: ActionStatus;
  reasoning?: string;
  tx?: any;
} & ViaWithRelations) {
  // If an external transaction is provided, use it; otherwise create a new one
  const runOperation = async (tx: any) => {
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
        reasoning,
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
  };

  // Use provided transaction or create a new one
  const [appealAction, lastAppealAction] = providedTx 
    ? await runOperation(providedTx)
    : await db.transaction(runOperation);

  // Only send Inngest event if not using an external transaction
  // When using an external transaction, the caller should handle events after commit
  if (!providedTx && status !== lastAppealAction?.status) {
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

  return [appealAction, lastAppealAction];
}
