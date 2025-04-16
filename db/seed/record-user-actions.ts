import { renderEmailTemplate } from "@/services/email";

import { eq } from "drizzle-orm";
import db from "../index";
import * as schema from "../schema";
import sample from "lodash/sample";
import { createMessage } from "@/services/messages";

export async function seedUserActions(organizationId: string) {
  const users = await db.query.endUsers.findMany({
    where: eq(schema.endUsers.authOrganizationId, organizationId),
    with: {
      records: true,
    },
  });

  const userActions = await db
    .insert(schema.userActions)
    .values(
      users.map((user) => {
        const isFlagged = user.records.some((record) => record.moderationStatus === "Flagged");
        const status = isFlagged && !user.protected ? sample(["Suspended", "Banned"] as const) : "Compliant";
        return {
          organizationId,
          userId: user.id,
          status,
          createdAt: user.createdAt,
        } as const;
      }),
    )
    .returning();

  const { subject, body } = await renderEmailTemplate({
    organizationId,
    type: "Suspended",
  });

  for (const userAction of userActions) {
    await db
      .update(schema.endUsers)
      .set({
        actionStatus: userAction.status,
        actionStatusCreatedAt: userAction.createdAt,
      })
      .where(eq(schema.endUsers.id, userAction.userId));

    if (userAction.status === "Suspended") {
      await createMessage({
        organizationId,
        userActionId: userAction.id,
        type: "Outbound",
        toId: userAction.userId,
        subject,
        text: body,
      });
    }
  }

  console.log("Seeded User Actions");

  return userActions;
}
