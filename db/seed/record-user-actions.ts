import { renderEmailTemplate } from "@/services/email";

import { eq } from "drizzle-orm";
import db from "../index";
import * as schema from "../schema";
import sample from "lodash/sample";
import { createMessage } from "@/services/messages";

export async function seedUserActions(authOrganizationId: string) {
  const users = await db.query.endUsers.findMany({
    where: eq(schema.endUsers.authOrganizationId, authOrganizationId),
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
          authOrganizationId,
          endUserId: user.id,
          status,
          createdAt: user.createdAt,
        } as const;
      }),
    )
    .returning();

  const { subject, body } = await renderEmailTemplate({
    authOrganizationId,
    type: "Suspended",
  });

  for (const userAction of userActions) {
    await db
      .update(schema.endUsers)
      .set({
        actionStatus: userAction.status,
        actionStatusCreatedAt: userAction.createdAt,
      })
      .where(eq(schema.endUsers.id, userAction.endUserId));

    if (userAction.status === "Suspended") {
      await createMessage({
        authOrganizationId: authOrganizationId,
        userActionId: userAction.id,
        type: "Outbound",
        toId: userAction.endUserId,
        subject,
        text: body,
      });
    }
  }

  console.log("Seeded User Actions");

  return userActions;
}
