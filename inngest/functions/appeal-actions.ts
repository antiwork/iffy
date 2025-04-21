import { inngest } from "@/inngest/client";
import db from "@/db";
import { createUserAction } from "@/services/user-actions";
import * as schema from "@/db/schema";
import { eq, and } from "drizzle-orm";

const updateUserAfterAppealAction = inngest.createFunction(
  { id: "update-user-after-appeal-action" },
  { event: "appeal-action/status-changed" },
  async ({ event, step }) => {
    const { clerkOrganizationId, appealId, status, lastStatus } = event.data;

    // We only care about an appeal that has been marked as approved, having previously been open
    if (lastStatus !== "Open" || status !== "Approved") {
      return;
    }

    const appeal = await step.run("fetch-appeal", async () => {
      const appeal = await db.query.appeals.findFirst({
        where: and(eq(schema.appeals.clerkOrganizationId, clerkOrganizationId), eq(schema.appeals.id, appealId)),
        with: {
          userAction: {
            with: {
              user: true,
            },
            columns: {
              id: true,
            },
          },
        },
      });

      if (!appeal) throw new Error(`Appeal not found: ${appealId}`);
      return appeal;
    });
    const userId = appeal.userAction.user.id;

    // See if user is already compliant
    const currentUser = await step.run("fetch-current-user-status", async () => {
      return await db.query.users.findFirst({
          where: eq(schema.users.id, userId),
          columns: { actionStatus: true }
      });
    });

    // Only create the compliant action if the user ISN'T already compliant
    // (Likely set by the moderation/status-changed events from unflagging records)
    if (currentUser?.actionStatus === "Suspended") {
      await step.run("create-user-action", async () => {
        return await createUserAction({
          clerkOrganizationId,
          userId: appeal.userAction.user.id,
          status: "Compliant",
          via: "Automation Appeal Approved",
          viaAppealId: appeal.id,
        });
      });
    } else {
      console.log(`Skipping compliant user action for user ${userId} as they are already ${currentUser?.actionStatus ?? 'Unknown'}`);
    }
  },
);

export default [updateUserAfterAppealAction];
