"use server";

import { actionClient } from "@/lib/action-client";
import { z } from "zod";
import * as service from "@/services/rules";
import { revalidatePath } from "next/cache";
import { ruleFormSchema } from "./schema";

export const createRule = actionClient
  .schema(ruleFormSchema)
  .bindArgsSchemas<[rulesetId: z.ZodString]>([z.string()])
  .action(async ({ parsedInput: rule, bindArgsParsedInputs: [rulesetId], ctx: { organizationId } }) => {
    if (rule.type === "Preset") {
      await service.createPresetRule({
        organizationId,
        rulesetId,
        presetId: rule.presetId,
      });
    } else {
      await service.createCustomRule({
        organizationId,
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
  .action(async ({ parsedInput: { id, ...rule }, ctx: { organizationId } }) => {
    if (rule.type === "Preset") {
      await service.updatePresetRule({
        organizationId,
        id,
        presetId: rule.presetId,
      });
    } else {
      await service.updateCustomRule({
        organizationId,
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
  .action(async ({ parsedInput: id, ctx: { organizationId } }) => {
    await service.deleteRule(organizationId, id);
    revalidatePath("/dashboard/rules");
  });
