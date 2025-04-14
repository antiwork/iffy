"use server";

import { z } from "zod";
import { actionClient } from "@/lib/action-client";
import * as schema from "@/db/schema";
import * as service from "@/services/moderations";
import { revalidatePath } from "next/cache";
import { inngest } from "@/inngest/client";
import db from "@/db";
import { eq, inArray, and } from "drizzle-orm";

const createModerationSchema = z.object({
  status: z.enum(schema.moderationStatus.enumValues),
  reasoning: z.string().optional(),
});

// TODO(s3ththompson): Add bulk services in the future
export const createModerations = actionClient
  .schema(createModerationSchema)
  .bindArgsSchemas<[recordIds: z.ZodArray<z.ZodString>]>([z.array(z.string())])
  .action(
    async ({
      parsedInput: { status, reasoning },
      bindArgsParsedInputs: [recordIds],
      ctx: { organizationId, clerkUserId },
    }) => {
      const moderations = await Promise.all(
        recordIds.map((recordId) =>
          service.createModeration({
            organizationId,
            recordId,
            status,
            reasoning,
            via: "Manual",
            clerkUserId,
          }),
        ),
      );
      for (const recordId of recordIds) {
        revalidatePath(`/dashboard/records/${recordId}`);
      }
      return moderations;
    },
  );

// TODO(s3ththompson): Add bulk services in the future
export const moderateMany = actionClient
  .bindArgsSchemas<[recordIds: z.ZodArray<z.ZodString>]>([z.array(z.string())])
  .action(async ({ bindArgsParsedInputs: [recordIds], ctx: { organizationId } }) => {
    const pendingModerations = await Promise.all(
      recordIds.map(async (recordId) => {
        const pendingModeration = await service.createPendingModeration({
          organizationId,
          recordId,
          via: "AI",
        });
        try {
          await inngest.send({
            name: "moderation/moderated",
            data: {
              organizationId,
              moderationId: pendingModeration.id,
              recordId,
            },
          });
          await inngest.send({
            name: "moderation/usage",
            data: {
              organizationId,
              id: pendingModeration.id,
              recordId,
            },
          });
        } catch (error) {
          console.error(error);
        }
        return pendingModeration;
      }),
    );
    for (const recordId of recordIds) {
      revalidatePath(`/dashboard/records/${recordId}`);
    }
    return pendingModerations;
  });

const setRecordProtectedSchema = z.boolean();

// TODO(s3ththompson): Add bulk services in the future
export const setRecordProtectedMany = actionClient
  .schema(setRecordProtectedSchema)
  .bindArgsSchemas<[recordIds: z.ZodArray<z.ZodString>]>([z.array(z.string())])
  .action(async ({ parsedInput, bindArgsParsedInputs: [recordIds], ctx: { organizationId } }) => {
    const records = await db
      .update(schema.records)
      .set({
        protected: parsedInput,
      })
      .where(and(eq(schema.records.organizationId, organizationId), inArray(schema.records.id, recordIds)))
      .returning();

    for (const recordId of recordIds) {
      revalidatePath(`/dashboard/records/${recordId}`);
    }
    return records;
  });
