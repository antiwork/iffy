import { renderEmailTemplate } from "@/services/email";

import { eq } from "drizzle-orm";
import db from "../index";
import * as schema from "../schema";
import sample from "lodash/sample";
import { createMessage } from "@/services/messages";

export async function seedUserActions(clerkOrganizationId: string) {
  const users = await db.query.users.findMany({
    where: eq(schema.users.clerkOrganizationId, clerkOrganizationId),
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
          clerkOrganizationId,
          userId: user.id,
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
      .update(schema.users)
      .set({
        actionStatus: userAction.status,
        actionStatusCreatedAt: userAction.createdAt,
      })
      .where(eq(schema.users.id, userAction.userId));

    if (userAction.status === "Suspended") {
      await createMessage({
        clerkOrganizationId,
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
