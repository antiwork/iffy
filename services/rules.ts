import { findOrCreateDefaultRuleset } from "./ruleset";
import db from "@/db";
import * as schema from "@/db/schema";
import { transformStrategy } from "@/strategies";
import { and, eq } from "drizzle-orm";
import { RuleFormValues } from "@/app/dashboard/rules/schema";
import { Strategy } from "@/strategies/types";

export type RuleWithStrategies = typeof schema.rules.$inferSelect & {
  preset:
    | (typeof schema.presets.$inferSelect & {
        strategies: Strategy[];
      })
    | null;
  strategies: Strategy[];
};

export type RuleWithStrategiesInsert =
  | (typeof schema.rules.$inferInsert & { presetId: string; strategies?: never })
  | (typeof schema.rules.$inferInsert & {
      presetId?: never;
      strategies: Pick<typeof schema.ruleStrategies.$inferInsert, "type" | "options">[];
    });

export const getRules = async (clerkOrganizationId: string, rulesetId: string): Promise<RuleWithStrategies[]> => {
  const rules = await db.query.rules.findMany({
    where: and(eq(schema.rules.clerkOrganizationId, clerkOrganizationId), eq(schema.rules.rulesetId, rulesetId)),
    with: {
      preset: {
        with: {
          strategies: true,
        },
      },
      strategies: true,
    },
    orderBy: (rules, { asc }) => [asc(rules.createdAt)],
  });

  return rules.map((rule) => {
    return {
      ...rule,
      preset: rule.preset
        ? { ...rule.preset, strategies: rule.preset.strategies.map((strategy) => transformStrategy(strategy)) }
        : null,
      strategies: rule.strategies.map((strategy) => transformStrategy(strategy)),
    };
  });
};

export const createCustomRule = async ({
  clerkOrganizationId,
  rulesetId,
  strategies,
  name,
  description,
}: {
  clerkOrganizationId: string;
  rulesetId: string;
  strategies: Pick<typeof schema.ruleStrategies.$inferInsert, "type" | "options">[];
  name: string;
  description?: string;
}) => {
  const [newRule] = await db
    .insert(schema.rules)
    .values({
      clerkOrganizationId,
      rulesetId,
      name,
      description,
    })
    .returning();

  if (!newRule) {
    throw new Error("Failed to create rule");
  }

  for (const strategy of strategies) {
    await db
      .insert(schema.ruleStrategies)
      .values({ clerkOrganizationId, type: strategy.type, ruleId: newRule.id, options: strategy.options });
  }

  return newRule;
};

export const updateCustomRule = async ({
  clerkOrganizationId,
  id,
  strategies,
  name,
  description,
}: {
  clerkOrganizationId: string;
  id: string;
  strategies: Pick<typeof schema.ruleStrategies.$inferInsert, "type" | "options">[];
  name: string;
  description?: string;
}) => {
  return await db.transaction(async (tx) => {
    await tx.delete(schema.ruleStrategies).where(eq(schema.ruleStrategies.ruleId, id));

    for (const strategy of strategies) {
      await tx
        .insert(schema.ruleStrategies)
        .values({ clerkOrganizationId, type: strategy.type, ruleId: id, options: strategy.options });
    }

    const [updatedRule] = await tx
      .update(schema.rules)
      .set({ name, description })
      .where(and(eq(schema.rules.id, id), eq(schema.rules.clerkOrganizationId, clerkOrganizationId)))
      .returning();

    if (!updatedRule) {
      throw new Error("Failed to update rule");
    }

    return updatedRule;
  });
};

export const createPresetRule = async ({
  clerkOrganizationId,
  rulesetId,
  presetId,
}: {
  clerkOrganizationId: string;
  rulesetId: string;
  presetId: string;
}) => {
  const [newRule] = await db.insert(schema.rules).values({ clerkOrganizationId, rulesetId, presetId }).returning();

  if (!newRule) {
    throw new Error("Failed to create rule");
  }

  return newRule;
};

export const updatePresetRule = async ({
  clerkOrganizationId,
  id,
  presetId,
}: {
  clerkOrganizationId: string;
  id: string;
  presetId: string;
}) => {
  const [updatedRule] = await db
    .update(schema.rules)
    .set({ presetId })
    .where(and(eq(schema.rules.id, id), eq(schema.rules.clerkOrganizationId, clerkOrganizationId)))
    .returning();

  if (!updatedRule) {
    throw new Error("Failed to update rule");
  }

  return updatedRule;
};

export const deleteRule = async (clerkOrganizationId: string, ruleId: string) => {
  return await db.transaction(async (tx) => {
    const rule = await tx.query.rules.findFirst({
      where: and(eq(schema.rules.id, ruleId), eq(schema.rules.clerkOrganizationId, clerkOrganizationId)),
    });
    if (!rule) {
      throw new Error("Rule not found");
    }
    await tx.delete(schema.ruleStrategies).where(eq(schema.ruleStrategies.ruleId, ruleId));
    if (rule.presetId) {
      await tx.delete(schema.presetStrategies).where(eq(schema.presetStrategies.presetId, rule.presetId));
    }
    await tx
      .delete(schema.rules)
      .where(and(eq(schema.rules.id, ruleId), eq(schema.rules.clerkOrganizationId, clerkOrganizationId)));
  });
};
