"use server";

import { z } from "zod";
import { actionClient } from "@/lib/action-client";
import { revalidatePath } from "next/cache";
import * as service from "@/services/user-actions";
import * as schema from "@/db/schema";
import db from "@/db";
import { and, eq, inArray } from "drizzle-orm";

const createUserActionSchema = z.object({
  status: z.enum(schema.userActionStatus.enumValues),
  reasoning: z.string().optional(),
});

// TODO(s3ththompson): Add bulk services in the future
export const createUserActions = actionClient
  .schema(createUserActionSchema)
  .bindArgsSchemas<[endUserIds: z.ZodArray<z.ZodString>]>([z.array(z.string())])
  .action(
    async ({
      parsedInput: { status, reasoning },
      bindArgsParsedInputs: [endUserIds],
      ctx: { organizationId, userId },
    }) => {
      const userActions = await Promise.all(
        endUserIds.map((endUserId) =>
          service.createUserAction({
            organizationId,
            endUserId,
            status,
            via: "Manual",
            userId,
            reasoning,
          }),
        ),
      );
      for (const endUserId of endUserIds) {
        revalidatePath(`/dashboard/users/${endUserId}`);
      }
      return userActions;
    },
  );

const setUserProtectedSchema = z.boolean();

export const setUserProtectedMany = actionClient
  .schema(setUserProtectedSchema)
  .bindArgsSchemas<[userIds: z.ZodArray<z.ZodString>]>([z.array(z.string())])
  .action(async ({ parsedInput, bindArgsParsedInputs: [endUserIds], ctx: { organizationId } }) => {
    const endUserRecords = await db
      .update(schema.endUsers)
      .set({
        protected: parsedInput,
      })
      .where(and(eq(schema.endUsers.organizationId, organizationId), inArray(schema.endUsers.id, endUserIds)))
      .returning();

    for (const endUserId of endUserIds) {
      revalidatePath(`/dashboard/users/${endUserId}`);
    }
    return endUserRecords;
  });
