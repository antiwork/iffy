"use server";

import db from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";

export async function findOrCreateDefaultRuleset(clerkOrganizationId: string) {
  return await db.transaction(async (tx) => {
    const defaultRuleset = await tx.query.rulesets.findFirst({
      where: eq(schema.rulesets.clerkOrganizationId, clerkOrganizationId),
    });

    if (defaultRuleset) return defaultRuleset;

    const [newRuleset] = await tx
      .insert(schema.rulesets)
      .values({
        name: "Default",
        clerkOrganizationId,
      })
      .returning();

    if (!newRuleset) {
      throw new Error("Failed to create default ruleset");
    }

    const defaultPresets = await tx.query.presets.findMany({
      where: eq(schema.presets.default, true),
    });

    for (const preset of defaultPresets) {
      const [newRule] = await tx
        .insert(schema.rules)
        .values({ clerkOrganizationId, rulesetId: newRuleset.id, presetId: preset.id })
        .returning();

      if (!newRule) {
        throw new Error("Failed to create rule");
      }
    }

    return newRuleset;
  });
}
