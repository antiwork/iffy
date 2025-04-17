"use server";

import { actionClient } from "@/lib/action-client";
import { z } from "zod";
import * as service from "@/services/rules";
import { revalidatePath } from "next/cache";
import { ruleFormSchema } from "./schema";

export const createRule = actionClient
  .schema(ruleFormSchema)
  .bindArgsSchemas<[rulesetId: z.ZodString]>([z.string()])
  .action(async ({ parsedInput: rule, bindArgsParsedInputs: [rulesetId], ctx: { authOrganizationId } }) => {
    if (rule.type === "Preset") {
      await service.createPresetRule({
        authOrganizationId,
        rulesetId,
        presetId: rule.presetId,
      });
    } else {
      await service.createCustomRule({
        authOrganizationId,
        rulesetId,
        name: rule.name,
        description: rule.description,
        strategies: rule.strategies,
      });
    }
    revalidatePath("/dashboard/rules");
  });

export const updateRule = actionClient
  .schema(ruleFormSchema.and(z.object({ id: z.string() })))
  .action(async ({ parsedInput: { id, ...rule }, ctx: { authOrganizationId } }) => {
    if (rule.type === "Preset") {
      await service.updatePresetRule({
        authOrganizationId,
        id,
        presetId: rule.presetId,
      });
    } else {
      await service.updateCustomRule({
        authOrganizationId,
        id,
        name: rule.name,
        description: rule.description,
        strategies: rule.strategies,
      });
    }
    revalidatePath("/dashboard/rules");
  });

export const deleteRule = actionClient
  .schema(z.string())
  .action(async ({ parsedInput: id, ctx: { authOrganizationId } }) => {
    await service.deleteRule(authOrganizationId, id);
    revalidatePath("/dashboard/rules");
  });
