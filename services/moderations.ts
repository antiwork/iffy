import db from "@/db";
import { and, desc, eq, sql } from "drizzle-orm";
import { findOrCreateOrganization } from "./organizations";
import { inngest } from "@/inngest/client";
import * as schema from "@/db/schema";
import { ViaWithRelations } from "@/lib/types";
import { makeStrategyInstance } from "@/strategies";
import type { StrategyInstance } from "@/strategies/types";

type ModerationStatus = (typeof schema.moderationStatus.enumValues)[number];
type DBTX = Parameters<Parameters<typeof db.transaction>[0]>[0];

export interface LinkData {
  originalUrl: string;
  finalUrl: string;
  title: string;
  description: string;
  snippet: string;
}

export interface Context {
  clerkOrganizationId: string;
  record: typeof schema.records.$inferSelect;
  user?: typeof schema.users.$inferSelect;
  externalLinks: LinkData[];
  tokens: number;
  lastManualModeration?: typeof schema.moderations.$inferSelect;
}

export interface StrategyResult {
  status: "Compliant" | "Flagged";
  reasoning?: string[];
}

export async function createModeration({
  clerkOrganizationId,
  recordId,
  status,
  via,
  clerkUserId,
  reasoning,
  rulesetId,
  ruleIds = [],
  testMode = false,
  createdAt,
}: {
  clerkOrganizationId: string;
  recordId: string;
  status: ModerationStatus;
  reasoning?: string;
  rulesetId?: string;
  ruleIds?: string[];
  testMode?: boolean;
  createdAt?: Date;
} & ViaWithRelations) {
  let lastStatus: ModerationStatus | null = null;

  const moderation = await db.transaction(async (tx) => {
    // read the last status from the record
    const record = await tx.query.records.findFirst({
      where: and(eq(schema.records.clerkOrganizationId, clerkOrganizationId), eq(schema.records.id, recordId)),
      columns: {
        userId: true,
        moderationStatus: true,
        protected: true,
      },
    });

    if (!record) {
      throw new Error("Record not found");
    }

    if (record.protected && status !== "Compliant") {
      throw new Error("Record is protected");
    }

    lastStatus = record.moderationStatus;

    const [moderation] = await tx
      .insert(schema.moderations)
      .values({
        clerkOrganizationId,
        status,
        via,
        clerkUserId,
        reasoning,
        recordId,
        rulesetId,
        testMode,
        createdAt,
      })
      .returning();

    if (!moderation) {
      throw new Error("Failed to create moderation");
    }

    if (ruleIds.length > 0) {
      await tx.insert(schema.moderationsToRules).values(
        ruleIds.map((ruleId) => ({
          moderationId: moderation.id,
          ruleId,
        })),
      );
    }

    // sync the record status with the new status
    await tx
      .update(schema.records)
      .set({
        moderationStatus: status,
        moderationStatusCreatedAt: moderation.createdAt,
        moderationPending: false,
      })
      .where(and(eq(schema.records.clerkOrganizationId, clerkOrganizationId), eq(schema.records.id, recordId)));

    if (status !== lastStatus) {
      if (record.userId) {
        if (status === "Flagged") {
          await tx
            .update(schema.users)
            .set({
              flaggedRecordsCount: sql`${schema.users.flaggedRecordsCount} + 1`,
            })
            .where(and(eq(schema.users.clerkOrganizationId, clerkOrganizationId), eq(schema.users.id, record.userId)));
        }
        if (lastStatus === "Flagged" && status !== "Flagged") {
          await tx
            .update(schema.users)
            .set({
              flaggedRecordsCount: sql`${schema.users.flaggedRecordsCount} - 1`,
            })
            .where(and(eq(schema.users.clerkOrganizationId, clerkOrganizationId), eq(schema.users.id, record.userId)));
        }
      }
    }

    return moderation;
  });

  if (status !== lastStatus && !moderation.testMode) {
    try {
      await inngest.send({
        name: "moderation/status-changed",
        data: {
          clerkOrganizationId,
          id: moderation.id,
          recordId,
          status,
          lastStatus,
        },
      });
    } catch (error) {
      console.error(error);
    }
  }

  return moderation;
}


export async function createManualModeration({
  tx, // Accept transaction context from the caller
  clerkOrganizationId,
  recordId,
  status,
  clerkUserId, // Should be required for manual actions
  reasoning,
  createdAt,
}: {
  tx: DBTX; // Use the inferred transaction type
  clerkOrganizationId: string;
  recordId: string;
  status: ModerationStatus;
  clerkUserId: string; 
  reasoning?: string;
  createdAt?: Date;
}) {
  const record = await tx.query.records.findFirst({
    where: and(eq(schema.records.clerkOrganizationId, clerkOrganizationId), eq(schema.records.id, recordId)),
    columns: {
      userId: true,
      moderationStatus: true,
      //protected: true, // Check protection status if relevant for manual override rules
    },
  });

  if (!record) {
    throw new Error(`Record ${recordId} not found within transaction`);
  }

  // Note: Potentially add logic here if manual moderation should treat 'protected' status differently

  const lastStatus = record.moderationStatus;

  const [moderation] = await tx
    .insert(schema.moderations)
    .values({
      clerkOrganizationId,
      status,
      via: "Manual", // Explicitly set as Manual
      clerkUserId, 
      reasoning,
      recordId,
      // rulesetId: undefined, // Manual actions are not tied to a specific ruleset run
      testMode: false, 
      createdAt: createdAt ?? new Date(),
      pending: false, // Manual actions resolve immediately
    })
    .returning();

  if (!moderation) {
    throw new Error("Failed to create manual moderation record");
  }

  // Sync the record status with the new manual status
  const statusChanged = status !== lastStatus;
  await tx
    .update(schema.records)
    .set({
      moderationStatus: status,
      moderationStatusCreatedAt: moderation.createdAt,
      moderationPending: false, // Ensure pending is cleared
    })
    .where(and(eq(schema.records.clerkOrganizationId, clerkOrganizationId), eq(schema.records.id, recordId)));

  // Update user's flagged count if status changed
  if (statusChanged && record.userId) {
    if (status === "Flagged") {
      await tx
        .update(schema.users)
        .set({
          flaggedRecordsCount: sql`${schema.users.flaggedRecordsCount} + 1`,
        })
        .where(and(eq(schema.users.clerkOrganizationId, clerkOrganizationId), eq(schema.users.id, record.userId)));
    } else if (lastStatus === "Flagged") {
      // Only decrement if it *was* flagged
      await tx
        .update(schema.users)
        .set({
          flaggedRecordsCount: sql`GREATEST(0, ${schema.users.flaggedRecordsCount} - 1)`, // Prevent going below 0
        })
        .where(and(eq(schema.users.clerkOrganizationId, clerkOrganizationId), eq(schema.users.id, record.userId)));
    }
  }

  // Return necessary data for the caller to send Inngest event after all manual moderations have been made
  return {
    moderation,
    statusChanged,
    lastStatus,
  };
}

export async function createPendingModeration({
  clerkOrganizationId,
  recordId,
  via,
  clerkUserId,
  createdAt,
}: {
  clerkOrganizationId: string;
  recordId: string;
  createdAt?: Date;
} & ViaWithRelations) {
  return await db.transaction(async (tx) => {
    const record = await tx.query.records.findFirst({
      where: and(eq(schema.records.clerkOrganizationId, clerkOrganizationId), eq(schema.records.id, recordId)),
      columns: {
        protected: true,
      },
    });

    if (!record) {
      throw new Error("Record not found");
    }

    if (record.protected) {
      throw new Error("Record is protected");
    }

    const [moderation] = await tx
      .insert(schema.moderations)
      .values({
        clerkOrganizationId,
        via,
        clerkUserId,
        recordId,
        createdAt,
        status: "Compliant",
        pending: true,
      })
      .returning();

    if (!moderation) {
      throw new Error("Failed to create pending moderation");
    }

    // update the record pending state
    await tx
      .update(schema.records)
      .set({
        moderationPending: true,
        moderationPendingCreatedAt: moderation.createdAt,
      })
      .where(and(eq(schema.records.clerkOrganizationId, clerkOrganizationId), eq(schema.records.id, recordId)));

    return moderation;
  });
}

export async function updatePendingModeration({
  clerkOrganizationId,
  id,
  status,
  reasoning,
  rulesetId,
  ruleIds = [],
  testMode = false,
  tokens = 0,
}: {
  clerkOrganizationId: string;
  id: string;
  status: ModerationStatus;
  reasoning?: string;
  rulesetId?: string;
  ruleIds?: string[];
  testMode?: boolean;
  tokens?: number;
}) {
  let statusChanged = false;
  let lastStatus: ModerationStatus | null = null;

  const moderation = await db.transaction(async (tx) => {
    const [moderation] = await tx
      .update(schema.moderations)
      .set({
        status,
        reasoning,
        rulesetId,
        pending: false,
        testMode,
        tokens,
      })
      .where(and(eq(schema.moderations.id, id), eq(schema.moderations.clerkOrganizationId, clerkOrganizationId)))
      .returning();

    if (!moderation) {
      throw new Error("Failed to update moderation");
    }

    if (ruleIds.length > 0) {
      await tx.insert(schema.moderationsToRules).values(
        ruleIds.map((ruleId) => ({
          moderationId: moderation.id,
          ruleId,
        })),
      );
    }

    const record = await tx.query.records.findFirst({
      where: and(
        eq(schema.records.clerkOrganizationId, clerkOrganizationId),
        eq(schema.records.id, moderation.recordId),
      ),
    });

    if (!record) {
      throw new Error("Record not found");
    }

    let updateData: Partial<typeof schema.records.$inferInsert> = {};

    // read the last status from the record
    lastStatus = record.moderationStatus;

    // if the moderation is newer than the one that last updated the status,
    // update the status
    const statusCreatedAt = record.moderationStatusCreatedAt;
    if (!statusCreatedAt || moderation.createdAt > statusCreatedAt) {
      updateData.moderationStatus = status;
      updateData.moderationStatusCreatedAt = moderation.createdAt;
      if (status !== lastStatus) {
        statusChanged = true;
      }
    }

    // if the moderation is newer or the same as the one that set the pending flag,
    // clear the pending flag
    const pendingCreatedAt = record.moderationPendingCreatedAt;
    if (!pendingCreatedAt || moderation.createdAt >= pendingCreatedAt) {
      updateData.moderationPending = false;
    }

    // if no updates are needed, return the moderation
    if (Object.keys(updateData).length === 0) {
      return moderation;
    }

    // sync the record with the new status and/or pending flag
    await tx
      .update(schema.records)
      .set(updateData)
      .where(
        and(eq(schema.records.clerkOrganizationId, clerkOrganizationId), eq(schema.records.id, moderation.recordId)),
      );

    if (statusChanged) {
      if (record.userId) {
        if (status === "Flagged") {
          await tx
            .update(schema.users)
            .set({
              flaggedRecordsCount: sql`${schema.users.flaggedRecordsCount} + 1`,
            })
            .where(and(eq(schema.users.clerkOrganizationId, clerkOrganizationId), eq(schema.users.id, record.userId)));
        }
        if (lastStatus === "Flagged" && status !== "Flagged") {
          await tx
            .update(schema.users)
            .set({
              flaggedRecordsCount: sql`${schema.users.flaggedRecordsCount} - 1`,
            })
            .where(and(eq(schema.users.clerkOrganizationId, clerkOrganizationId), eq(schema.users.id, record.userId)));
        }
      }
    }

    return moderation;
  });

  if (statusChanged && !moderation.testMode) {
    try {
      await inngest.send({
        name: "moderation/status-changed",
        data: {
          clerkOrganizationId,
          id,
          recordId: moderation.recordId,
          status,
          lastStatus,
        },
      });
    } catch (error) {
      console.error(error);
    }
  }

  return moderation;
}

type ModerationResult = {
  status: ModerationStatus;
  reasoning: string;
  rulesetId?: string;
  ruleIds?: string[];
  tokens?: number;
  testMode: boolean;
};

export const moderate = async ({
  clerkOrganizationId,
  recordId,
}: {
  clerkOrganizationId: string;
  recordId: string;
}): Promise<ModerationResult> => {
  const record = await db.query.records.findFirst({
    where: and(eq(schema.records.clerkOrganizationId, clerkOrganizationId), eq(schema.records.id, recordId)),
    with: {
      moderations: {
        where: eq(schema.moderations.via, "Manual"),
        orderBy: desc(schema.moderations.createdAt),
        limit: 1,
      },
    },
  });

  if (!record) {
    throw new Error(`Record not found: ${recordId}`);
  }

  const ruleset = await db.query.rulesets.findFirst({
    where: eq(schema.rulesets.clerkOrganizationId, clerkOrganizationId),
  });

  if (!ruleset) {
    throw new Error("No ruleset found for organization");
  }

  const organization = await findOrCreateOrganization(clerkOrganizationId);

  const rules = await db.query.rules.findMany({
    where: and(eq(schema.rules.clerkOrganizationId, clerkOrganizationId), eq(schema.rules.rulesetId, ruleset.id)),
    with: {
      preset: {
        with: {
          strategies: true,
        },
      },
      strategies: true,
    },
  });

  const context: Context = {
    clerkOrganizationId,
    record,
    externalLinks: [],
    tokens: 0,
    lastManualModeration: record.moderations[0],
  };

  const RULE_ID = Symbol("ruleId");

  const strategies = rules.flatMap((rule) => {
    return (rule.preset ? rule.preset.strategies : rule.strategies).map((strategy) => {
      (strategy as any)[RULE_ID] = rule.id;
      return strategy;
    });
  });

  let status: ModerationStatus = "Compliant";
  let reasoning: string[] = [];
  const ruleIds = new Set<string>();

  const numWorkers = 5;
  const cursor = strategies.entries();
  await Promise.all(
    Array(numWorkers)
      .fill(0)
      .map(async () => {
        for (let [_, strategy] of cursor) {
          let s: StrategyInstance;
          try {
            s = await makeStrategyInstance(strategy);
          } catch (error) {
            console.error(error);
            continue;
          }
          if (await s.accepts(context)) {
            const result = await s.test(context);
            if (result.status === "Flagged") {
              status = "Flagged";
              if (result.reasoning) {
                reasoning = reasoning.concat(result.reasoning);
              }
              ruleIds.add((strategy as any)[RULE_ID]);
            }
          }
        }
      }),
  );

  return {
    status,
    reasoning: reasoning.join("\n"),
    tokens: context.tokens,
    rulesetId: ruleset.id,
    ruleIds: Array.from(ruleIds),
    testMode: organization.testModeEnabled,
  };
};
