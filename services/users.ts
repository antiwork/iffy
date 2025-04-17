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
  const user = await db.transaction(async (tx) => {
    const lastUser = await tx.query.userRecords.findFirst({
      where: and(eq(schema.userRecords.clerkOrganizationId, clerkOrganizationId), eq(schema.userRecords.clientId, clientId)),
      columns: {
        metadata: true,
      },
    });

    if (metadata && lastUser?.metadata) {
      metadata = mergeMetadata(lastUser.metadata, metadata);
    }

    const [user] = await db
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

    if (!user) {
      throw new Error("Failed to create or update user");
    }

    return user;
  });

  return user;
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
