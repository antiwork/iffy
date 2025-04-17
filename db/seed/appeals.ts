import { faker } from "@faker-js/faker";
import db from "../index";
import * as schema from "../schema";
import { eq, desc, and } from "drizzle-orm";

export async function seedAppeals(authOrganizationId: string) {
  const users = await db.query.endUsers.findMany({
    where: eq(schema.endUsers.authOrganizationId, authOrganizationId),
    with: {
      actions: {
        orderBy: [desc(schema.userActions.createdAt)],
      },
    },
  });

  for (const user of users) {
    const userAction = user.actions[0];
    if (!userAction || userAction.status !== "Suspended") {
      continue;
    }

    await db
      .insert(schema.appeals)
      .values({
        authOrganizationId,
        userActionId: userAction.id,
      })
      .onConflictDoNothing();

    const [appeal] = await db
      .select()
      .from(schema.appeals)
      .where(
        and(
          eq(schema.appeals.authOrganizationId, authOrganizationId),
          eq(schema.appeals.userActionId, userAction.id),
        ),
      );

    if (!appeal) {
      continue;
    }

    const [appealAction] = await db
      .insert(schema.appealActions)
      .values({
        authOrganizationId,
        appealId: appeal.id,
        status: "Open",
        via: "Inbound",
      })
      .returning();

    if (!appealAction) {
      continue;
    }

    await db
      .update(schema.appeals)
      .set({
        actionStatus: appealAction.status,
        actionStatusCreatedAt: appealAction.createdAt,
      })
      .where(and(eq(schema.appeals.authOrganizationId, authOrganizationId), eq(schema.appeals.id, appeal.id)));

    await db
      .update(schema.messages)
      .set({
        appealId: appeal.id,
      })
      .where(
        and(
          eq(schema.messages.authOrganizationId, authOrganizationId),
          eq(schema.messages.userActionId, userAction.id),
        ),
      );

    await db.insert(schema.messages).values({
      authOrganizationId,
      userActionId: userAction.id,
      fromId: user.id,
      text: faker.lorem.paragraph(),
      appealId: appeal.id,
      type: "Inbound",
      status: "Delivered",
      subject: faker.lorem.sentence(),
    });
  }
  console.log("Seeded Appeals");
}
