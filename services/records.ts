import db from "@/db";
import { inngest } from "@/inngest/client";
import * as schema from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { findUrlsInText } from "@/services/url-moderation";
import { mergeMetadata } from "./metadata";

export async function createOrUpdateRecord({
  organizationId,
  clientId,
  name,
  entity,
  text,
  imageUrls,
  externalUrls,
  clientUrl,
  userRecordId,
  createdAt,
  initialProtected,
  metadata,
}: {
  organizationId: string;
  clientId: string;
  clientUrl?: string;
  name: string;
  entity: string;
  text: string;
  imageUrls?: string[];
  externalUrls?: string[];
  userRecordId?: string;
  createdAt?: Date;
  initialProtected?: boolean;
  metadata?: Record<string, unknown>;
}) {
  const record = await db.transaction(async (tx) => {
    const lastRecord = await tx.query.records.findFirst({
      where: and(eq(schema.records.organizationId, organizationId), eq(schema.records.clientId, clientId)),
      columns: {
        userRecordId: true,
        metadata: true,
      },
    });

    if (metadata && lastRecord?.metadata) {
      metadata = mergeMetadata(lastRecord.metadata, metadata);
    }

    const [record] = await tx
      .insert(schema.records)
      .values({
        organizationId,
        clientId,
        clientUrl,
        name,
        entity,
        text,
        imageUrls,
        externalUrls,
        protected: initialProtected,
        metadata,
        userRecordId,
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
          userRecordId,
        },
      })
      .returning();

    if (!record) {
      throw new Error("Failed to upsert record");
    }

    if (record.moderationStatus === "Flagged") {
      const userRecordRemoved = !!lastRecord?.userRecordId && !record.userRecordId;
      const userRecordAdded = !lastRecord?.userRecordId && !!record.userRecordId;
      const userRecordChanged =
        !!lastRecord?.userRecordId && !!record.userRecordId && lastRecord.userRecordId !== record.userRecordId;

      if (userRecordRemoved || userRecordChanged) {
        await tx
          .update(schema.userRecords)
          .set({
            flaggedRecordsCount: sql`${schema.userRecords.flaggedRecordsCount} - 1`,
          })
          .where(
            and(
              eq(schema.userRecords.organizationId, organizationId),
              eq(schema.userRecords.id, lastRecord.userRecordId!),
            ),
          );
      }

      if (userRecordAdded || userRecordChanged) {
        await tx
          .update(schema.userRecords)
          .set({
            flaggedRecordsCount: sql`${schema.userRecords.flaggedRecordsCount} + 1`,
          })
          .where(
            and(eq(schema.userRecords.organizationId, organizationId), eq(schema.userRecords.id, record.userRecordId!)),
          );
      }
    }

    return record;
  });

  return record;
}

export async function deleteRecord(organizationId: string, recordId: string) {
  return await db.transaction(async (tx) => {
    const [record] = await tx
      .update(schema.records)
      .set({
        deletedAt: new Date(),
      })
      .where(and(eq(schema.records.organizationId, organizationId), eq(schema.records.id, recordId)))
      .returning();

    if (!record) {
      throw new Error("Failed to delete record");
    }

    if (record.userRecordId && record.moderationStatus === "Flagged") {
      await tx
        .update(schema.userRecords)
        .set({
          flaggedRecordsCount: sql`${schema.userRecords.flaggedRecordsCount} - 1`,
        })
        .where(
          and(eq(schema.userRecords.organizationId, organizationId), eq(schema.userRecords.id, record.userRecordId)),
        );
    }

    try {
      await inngest.send({
        name: "record/deleted",
        data: { organizationId, id: record.id },
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
