import * as z from "zod";

const strategySchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("Blocklist"),
    options: z.object({
      blocklist: z.array(z.string()).refine((value) => value.length > 0, "Blocklist must have at least one word"),
      matcher: z
        .object({
          onlyMatchWords: z.boolean().optional().default(false),
        })
        .optional()
        .default({ onlyMatchWords: false }),
    }),
  }),
  z.object({
    type: z.literal("Prompt"),
    options: z.object({
      topic: z.string().refine((value) => value !== "", "Topic is required"),
      prompt: z.string().refine((value) => value !== "", "Prompt is required"),
      skipImages: z.boolean().optional().default(false),
    }),
  }),
  z.object({
    type: z.literal("Classifier"),
    options: z.object({
      thresholds: z.record(z.string(), z.number()),
    }),
  }),
]);

export const ruleFormSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("Preset"),
    presetId: z.string().refine((value) => value !== "", "Preset is required"),
  }),
  z.object({
    type: z.literal("Custom"),
    name: z.string().refine((value) => value !== "", "Name is required"),
    description: z.string().optional(),
    strategies: z.array(strategySchema).refine((value) => value.length > 0, "Rule must have at least one strategy"),
  }),
]);

export type RuleFormValues = z.input<typeof ruleFormSchema>;
export type StrategyFormValues = z.input<typeof strategySchema>;
