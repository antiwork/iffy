import { inngest } from "@/inngest/client";
import db from "@/db";
import { createUserAction } from "@/services/user-actions";
import * as schema from "@/db/schema";
import { eq, and } from "drizzle-orm";

const updateUserAfterAppealAction = inngest.createFunction(
  { id: "update-user-after-appeal-action" },
  { event: "appeal-action/status-changed" },
  async ({ event, step }) => {
    const { organizationId, appealId, status, lastStatus } = event.data;

    // We only care about an appeal that has been marked as approved, having previously been open
    if (lastStatus !== "Open" || status !== "Approved") {
      return;
    }

    const appeal = await step.run("fetch-appeal", async () => {
      const appeal = await db.query.appeals.findFirst({
        where: and(eq(schema.appeals.organizationId, organizationId), eq(schema.appeals.id, appealId)),
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

    await step.run("create-user-action", async () => {
      return await createUserAction({
        organizationId,
        userId: appeal.userAction.user.id,
        status: "Compliant",
        via: "Automation Appeal Approved",
        viaAppealId: appeal.id,
      });
    });
  },
);

export default [updateUserAfterAppealAction];
