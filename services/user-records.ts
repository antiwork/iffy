"use server";

import db from "@/db";
import { and, desc, isNull, eq } from "drizzle-orm";
import * as schema from "@/db/schema";
import { mergeMetadata } from "./metadata";

export async function createOrUpdateUser({
  clerkOrganizationId,
  clientId,
  clientUrl,
  email,
  name,
  username,
  initialProtected,
  stripeAccountId,
  metadata,
}: {
  clerkOrganizationId: string;
  clientId: string;
  clientUrl?: string;
  email?: string;
  name?: string;
  username?: string;
  initialProtected?: boolean;
  stripeAccountId?: string;
  metadata?: Record<string, unknown>;
}) {
  const userRecord = await db.transaction(async (tx) => {
    const lastUserRecord = await tx.query.userRecords.findFirst({
      where: and(eq(schema.userRecords.clerkOrganizationId, clerkOrganizationId), eq(schema.userRecords.clientId, clientId)),
      columns: {
        metadata: true,
      },
    });

    if (metadata && lastUserRecord?.metadata) {
      metadata = mergeMetadata(lastUserRecord.metadata, metadata);
    }

    const [userRecord] = await db
      .insert(schema.userRecords)
      .values({
        clerkOrganizationId,
        clientId,
        clientUrl,
        email,
        name,
        username,
        protected: initialProtected,
        stripeAccountId,
        metadata,
      })
      .onConflictDoUpdate({
        target: schema.userRecords.clientId,
        set: {
          clientUrl,
          email,
          name,
          username,
          stripeAccountId,
          metadata,
        },
      })
      .returning();

    if (!userRecord) {
      throw new Error("Failed to create or update user record");
    }

    return userRecord;
  });

  return userRecord;
}

export async function getFlaggedRecordsFromUser({
  clerkOrganizationId,
  id,
}: {
  clerkOrganizationId: string;
  id: string;
}) {
  const records = await db.query.records.findMany({
    where: and(
      eq(schema.records.clerkOrganizationId, clerkOrganizationId),
      eq(schema.records.userRecordId, id),
      isNull(schema.records.deletedAt),
    ),
    with: {
      moderations: {
        orderBy: [desc(schema.moderations.createdAt)],
        columns: { status: true },
        limit: 1,
      },
    },
  });

  return records.filter((record) => record.moderations[0]?.status === "Flagged");
}
