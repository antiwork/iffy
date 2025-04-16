"use server";

import { createManualModeration } from "@/services/moderations";
import { z } from "zod";
import { actionClient } from "@/lib/action-client";
import * as schema from "@/db/schema";
import * as services from "@/services/appeal-actions";
import db from "@/db";
import { inngest } from "@/inngest/client";

const createAppealActionSchema = z.object({
  status: z.enum(schema.appealActionStatus.enumValues),
});

const approveAppealSchema = z.object({
  appealId: z.string(),
  recordIds: z.array(z.string()), // IDs of records to mark compliant
  reasoning: z.string().min(1, "Reasoning is required"),
});

export const createAppealAction = actionClient
  .schema(createAppealActionSchema)
  .bindArgsSchemas<[appealId: z.ZodString]>([z.string()])
  .action(
    async ({
      parsedInput: { status },
      bindArgsParsedInputs: [appealId],
      ctx: { clerkOrganizationId, clerkUserId },
    }) => {
      await services.createAppealAction({ clerkOrganizationId, appealId, status, via: "Manual", clerkUserId });
    },
  );

  export const approveAppealAndUnflagRecords = actionClient
  .schema(approveAppealSchema)
  .action(
    async ({
      parsedInput: { appealId, recordIds, reasoning },
      ctx: { clerkOrganizationId, clerkUserId },
    }) => {
      try {

        let appealAction: any = null;
        let appealStatusChanged = false;
        let lastAppealStatus: string | null = null;

        const moderationResults: Array<{
          moderation: typeof schema.moderations.$inferSelect;
          statusChanged: boolean;
          lastStatus: typeof schema.moderationStatus.enumValues[number] | null;
        }> = [];

        // Start the transaction
        await db.transaction(async (tx) => {
          // 1. Create/Update the 'Approved' AppealAction with reasoning
          const appealResult = await services.createAppealAction({
            clerkOrganizationId,
            appealId,
            status: "Approved",
            via: "Manual",
            clerkUserId,
            reasoning,
            tx, // Pass the transaction
          });

          // Store appeal action result for later event sending
          appealAction = appealResult[0];
          lastAppealStatus = appealResult[1]?.status || null;
          appealStatusChanged = appealAction.status !== lastAppealStatus;

          // 2. Create Manual Moderations for selected records
          for (const recordId of recordIds) {
            // Pass the transaction context `tx`
            const result = await createManualModeration({
              tx,
              clerkOrganizationId,
              recordId,
              status: "Compliant",
              clerkUserId,
              reasoning,
            });
            moderationResults.push(result); // Collect results
          }
        }); // Transaction commits here if no errors occurred

        // --- Actions AFTER successful transaction ---

        // 1. Send appeal action status change event
        if (appealStatusChanged) {
          try {
            await inngest.send({
              name: "appeal-action/status-changed",
              data: {
                clerkOrganizationId,
                id: appealAction.id,
                appealId,
                status: appealAction.status,
                lastStatus: lastAppealStatus,
              },
            });
            console.log("Sent appeal status change event");
          } catch (error) {
            console.error("Failed to send appeal status change event:", error);
          }
        }

        // 2. Send moderation status change events
        for (const result of moderationResults) {
          if (result.statusChanged) {
            try {
              await inngest.send({
                name: "moderation/status-changed",
                data: {
                  clerkOrganizationId,
                  id: result.moderation.id,
                  recordId: result.moderation.recordId,
                  status: result.moderation.status, // Should be "Compliant" here
                  lastStatus: result.lastStatus,
                },
              });
            } catch (error) {
              console.error(
                `Inngest event failed for moderation ${result.moderation.id} after transaction commit:`,
                error,
              );
            }
          }
        }

        return { success: true };
      } catch (error) {
        console.log(`approveAppealAndUnflagRecords error: ${error}`);
      }
    },
  );