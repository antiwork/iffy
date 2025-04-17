import { renderEmailTemplate } from "@/services/email";

import { eq } from "drizzle-orm";
import db from "../index";
import * as schema from "../schema";
import sample from "lodash/sample";
import { createMessage } from "@/services/messages";

export async function seedUserActions(clerkOrganizationId: string) {
  const users = await db.query.userRecords.findMany({
    where: eq(schema.userRecords.clerkOrganizationId, clerkOrganizationId),
    with: {
      records: true,
    },
  });

  const userActions = await db
    .insert(schema.userActions)
    .values(
      users.map((user: typeof schema.userRecords.$inferSelect & { records: typeof schema.records.$inferSelect[] }) => {
        const isFlagged = user.records.some((record: typeof schema.records.$inferSelect) => record.moderationStatus === "Flagged");
        const status = isFlagged && !user.protected ? sample(["Suspended", "Banned"] as const) : "Compliant";
        return {
          clerkOrganizationId,
          userRecordId: user.id,
          status,
          createdAt: user.createdAt,
        } as const;
      }),
    )
    .returning();

  const { subject, body } = await renderEmailTemplate({
    clerkOrganizationId,
    type: "Suspended",
  });

  for (const userAction of userActions) {
    await db
      .update(schema.userRecords)
      .set({
        actionStatus: userAction.status,
        actionStatusCreatedAt: userAction.createdAt,
      })
      .where(eq(schema.userRecords.id, userAction.userRecordId));

    if (userAction.status === "Suspended") {
      await createMessage({
        clerkOrganizationId,
        userActionId: userAction.id,
        type: "Outbound",
        toId: userAction.userRecordId,
        subject,
        text: body,
      });
    }
  }

  console.log("Seeded User Actions");

  return userActions;
}
