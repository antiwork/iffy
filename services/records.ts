import db from "@/db";
import { inngest } from "@/inngest/client";
import * as schema from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { findUrlsInText } from "@/services/url-moderation";
import { mergeMetadata } from "./metadata";

export async function createOrUpdateRecord({
  clerkOrganizationId,
  clientId,
  name,
  entity,
  text,
  imageUrls,
  externalUrls,
  clientUrl,
  userId,
  createdAt,
  initialProtected,
  metadata,
}: {
  clerkOrganizationId: string;
  clientId: string;
  clientUrl?: string;
  name: string;
  entity: string;
  text: string;
  imageUrls?: string[];
  externalUrls?: string[];
  userId?: string;
  createdAt?: Date;
  initialProtected?: boolean;
  metadata?: Record<string, unknown>;
}) {
  const record = await db.transaction(async (tx) => {
    const lastRecord = await tx.query.records.findFirst({
      where: and(eq(schema.records.organizationId, clerkOrganizationId), eq(schema.records.clientId, clientId)),
      columns: {
        userId: true,
        metadata: true,
      },
    });

    if (metadata && lastRecord?.metadata) {
      metadata = mergeMetadata(lastRecord.metadata, metadata);
    }

    const [record] = await tx
      .insert(schema.records)
      .values({
        clerkOrganizationId,
        clientId,
        clientUrl,
        name,
        entity,
        text,
        imageUrls,
        externalUrls,
        protected: initialProtected,
        metadata,
        userId,
        createdAt,
      })
      .onConflictDoUpdate({
        target: schema.records.clientId,
        set: {
          clientUrl,
          name,
          entity,
          text,
          imageUrls,
          externalUrls,
          metadata,
          userId,
        },
      })
      .returning();

    if (!record) {
      throw new Error("Failed to upsert record");
    }

    if (record.moderationStatus === "Flagged") {
      const userRemoved = !!lastRecord?.userId && !record.userId;
      const userAdded = !lastRecord?.userId && !!record.userId;
      const userChanged = !!lastRecord?.userId && !!record.userId && lastRecord.userId !== record.userId;

      if (userRemoved || userChanged) {
        await tx
          .update(schema.endUsers)
          .set({
            flaggedRecordsCount: sql`${schema.endUsers.flaggedRecordsCount} - 1`,
          })
          .where(
            and(eq(schema.endUsers.organizationId, clerkOrganizationId), eq(schema.endUsers.id, lastRecord.userId!)),
          );
      }

      if (userAdded || userChanged) {
        await tx
          .update(schema.endUsers)
          .set({
            flaggedRecordsCount: sql`${schema.endUsers.flaggedRecordsCount} + 1`,
          })
          .where(and(eq(schema.endUsers.organizationId, clerkOrganizationId), eq(schema.endUsers.id, record.userId!)));
      }
    }

    return record;
  });

  return record;
}

export async function deleteRecord(clerkOrganizationId: string, recordId: string) {
  return await db.transaction(async (tx) => {
    const [record] = await tx
      .update(schema.records)
      .set({
        deletedAt: new Date(),
      })
      .where(and(eq(schema.records.organizationId, clerkOrganizationId), eq(schema.records.id, recordId)))
      .returning();

    if (!record) {
      throw new Error("Failed to delete record");
    }

    if (record.endUserId && record.moderationStatus === "Flagged") {
      await tx
        .update(schema.endUsers)
        .set({
          flaggedRecordsCount: sql`${schema.endUsers.flaggedRecordsCount} - 1`,
        })
        .where(and(eq(schema.endUsers.organizationId, clerkOrganizationId), eq(schema.endUsers.id, record.endUserId)));
    }

    try {
      await inngest.send({
        name: "record/deleted",
        data: { clerkOrganizationId, id: record.id },
      });
    } catch (error) {
      console.error(error);
    }

    return record;
  });
}

export function getRecordUrls({ text, externalUrls }: { text: string; externalUrls?: string[] }) {
  const embeddedUrls = findUrlsInText(text);
  const allLinks = Array.from(new Set([...embeddedUrls, ...(externalUrls ?? [])]));
  return allLinks;
}
