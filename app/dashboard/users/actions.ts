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
  .bindArgsSchemas<[userRecordIds: z.ZodArray<z.ZodString>]>([z.array(z.string())])
  .action(
    async ({
      parsedInput: { status, reasoning },
      bindArgsParsedInputs: [userRecordIds],
      ctx: { organizationId, userId },
    }) => {
      const userActions = await Promise.all(
        userRecordIds.map((userRecordId) =>
          service.createUserAction({
            organizationId,
            userRecordId,
            status,
            via: "Manual",
            userId,
            reasoning,
          }),
        ),
      );
      for (const userRecordId of userRecordIds) {
        revalidatePath(`/dashboard/users/${userRecordId}`);
      }
      return userActions;
    },
  );

const setUserProtectedSchema = z.boolean();

export const setUserProtectedMany = actionClient
  .schema(setUserProtectedSchema)
  .bindArgsSchemas<[userRecordIds: z.ZodArray<z.ZodString>]>([z.array(z.string())])
  .action(async ({ parsedInput, bindArgsParsedInputs: [userRecordIds], ctx: { organizationId } }) => {
    const userRecords = await db
      .update(schema.userRecords)
      .set({
        protected: parsedInput,
      })
      .where(and(eq(schema.userRecords.organizationId, organizationId), inArray(schema.userRecords.id, userRecordIds)))
      .returning();

    for (const userRecordId of userRecordIds) {
      revalidatePath(`/dashboard/users/${userRecordId}`);
    }
    return userRecords;
  });
