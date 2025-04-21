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
  .bindArgsSchemas<[userIds: z.ZodArray<z.ZodString>]>([z.array(z.string())])
  .action(
    async ({
      parsedInput: { status, reasoning },
      bindArgsParsedInputs: [userIds],
      ctx: { clerkOrganizationId, clerkUserId },
    }) => {
      const userActions = await Promise.all(
        userIds.map((userId) =>
          service.createUserAction({
            clerkOrganizationId,
            userRecordId: userId,
            status,
            via: "Manual",
            clerkUserId,
            reasoning,
          }),
        ),
      );
      for (const userId of userIds) {
        revalidatePath(`/dashboard/users/${userId}`);
      }
      return userActions;
    },
  );

const setUserProtectedSchema = z.boolean();

export const setUserProtectedMany = actionClient
  .schema(setUserProtectedSchema)
  .bindArgsSchemas<[userIds: z.ZodArray<z.ZodString>]>([z.array(z.string())])
  .action(async ({ parsedInput, bindArgsParsedInputs: [userIds], ctx: { clerkOrganizationId } }) => {
    const userRecords = await db
      .update(schema.userRecords)
      .set({
        protected: parsedInput,
      })
      .where(
        and(eq(schema.userRecords.clerkOrganizationId, clerkOrganizationId), inArray(schema.userRecords.id, userIds)),
      )
      .returning();

    for (const userId of userIds) {
      revalidatePath(`/dashboard/users/${userId}`);
    }
    return userRecords;
  });
