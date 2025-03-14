"use server";

import { z } from "zod";
import { actionClient } from "@/lib/action-client";
import * as schema from "@/db/schema";
import * as services from "@/services/appeal-actions";

const createAppealActionSchema = z.object({
  status: z.enum(schema.appealActionStatus.enumValues),
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
