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

    return newRuleset;
  });
}
