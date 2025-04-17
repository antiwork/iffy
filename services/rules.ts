import db from "@/db";
import * as schema from "@/db/schema";
import { transformStrategy } from "@/strategies";
import { and, eq } from "drizzle-orm";
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

export const getRules = async (authOrganizationId: string, rulesetId: string): Promise<RuleWithStrategies[]> => {
  const rules = await db.query.rules.findMany({
    where: and(eq(schema.rules.authOrganizationId, authOrganizationId), eq(schema.rules.rulesetId, rulesetId)),
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
  authOrganizationId,
  rulesetId,
  strategies,
  name,
  description,
}: {
  authOrganizationId: string;
  rulesetId: string;
  strategies: Pick<typeof schema.ruleStrategies.$inferInsert, "type" | "options">[];
  name: string;
  description?: string;
}) => {
  return await db.transaction(async (tx) => {
    const [newRule] = await tx
      .insert(schema.rules)
      .values({
        authOrganizationId,
        rulesetId,
        name,
        description,
      })
      .returning();

    if (!newRule) {
      throw new Error("Failed to create rule");
    }

    for (const strategy of strategies) {
      await tx
        .insert(schema.ruleStrategies)
        .values({ authOrganizationId, type: strategy.type, ruleId: newRule.id, options: strategy.options });
    }

    return newRule;
  });
};

export const updateCustomRule = async ({
  authOrganizationId,
  id,
  strategies,
  name,
  description,
}: {
  authOrganizationId: string;
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
        .values({ authOrganizationId, type: strategy.type, ruleId: id, options: strategy.options });
    }

    const [updatedRule] = await tx
      .update(schema.rules)
      .set({ name, description })
      .where(and(eq(schema.rules.id, id), eq(schema.rules.authOrganizationId, authOrganizationId)))
      .returning();

    if (!updatedRule) {
      throw new Error("Failed to update rule");
    }

    return updatedRule;
  });
};

export const createPresetRule = async ({
  authOrganizationId,
  rulesetId,
  presetId,
}: {
  authOrganizationId: string;
  rulesetId: string;
  presetId: string;
}) => {
  const [newRule] = await db.insert(schema.rules).values({ authOrganizationId, rulesetId, presetId }).returning();

  if (!newRule) {
    throw new Error("Failed to create rule");
  }

  return newRule;
};

export const updatePresetRule = async ({
  authOrganizationId,
  id,
  presetId,
}: {
  authOrganizationId: string;
  id: string;
  presetId: string;
}) => {
  const [updatedRule] = await db
    .update(schema.rules)
    .set({ presetId })
    .where(and(eq(schema.rules.id, id), eq(schema.rules.authOrganizationId, authOrganizationId)))
    .returning();

  if (!updatedRule) {
    throw new Error("Failed to update rule");
  }

  return updatedRule;
};

export const deleteRule = async (authOrganizationId: string, ruleId: string) => {
  return await db.transaction(async (tx) => {
    const rule = await tx.query.rules.findFirst({
      where: and(eq(schema.rules.id, ruleId), eq(schema.rules.authOrganizationId, authOrganizationId)),
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
      .where(and(eq(schema.rules.id, ruleId), eq(schema.rules.authOrganizationId, authOrganizationId)));

    return rule;
  });
};
