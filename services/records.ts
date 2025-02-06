import db, { transaction, type DB } from "@/db";
import { inngest } from "@/inngest/client";
import * as schema from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { findUrlsInText } from "@/services/url-moderation";

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
}) {
  return transaction(async (tx) => {
    const lastRecord = await tx.query.records.findFirst({
      where: and(eq(schema.records.clerkOrganizationId, clerkOrganizationId), eq(schema.records.clientId, clientId)),
      columns: {
        userId: true,
      },
    });

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
        userId,
        createdAt,
      })
      .onConflictDoUpdate({
        target: schema.records.clientId,
        set: {
          name,
          entity,
          text,
          imageUrls,
          externalUrls,
          clientUrl,
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
          .update(schema.users)
          .set({
            flaggedRecordsCount: sql`${schema.users.flaggedRecordsCount} - 1`,
          })
          .where(
            and(eq(schema.users.clerkOrganizationId, clerkOrganizationId), eq(schema.users.id, lastRecord.userId!)),
          );
      }

      if (userAdded || userChanged) {
        await tx
          .update(schema.users)
          .set({
            flaggedRecordsCount: sql`${schema.users.flaggedRecordsCount} + 1`,
          })
          .where(and(eq(schema.users.clerkOrganizationId, clerkOrganizationId), eq(schema.users.id, record.userId!)));
      }
    }

    return record;
  });
}

export async function deleteRecord(clerkOrganizationId: string, recordId: string) {
  return transaction(async (tx) => {
    const [record] = await tx
      .update(schema.records)
      .set({
        deletedAt: new Date(),
      })
      .where(and(eq(schema.records.clerkOrganizationId, clerkOrganizationId), eq(schema.records.id, recordId)))
      .returning();

    if (!record) {
      throw new Error("Failed to delete record");
    }

    if (record.userId && record.moderationStatus === "Flagged") {
      await tx
        .update(schema.users)
        .set({
          flaggedRecordsCount: sql`${schema.users.flaggedRecordsCount} - 1`,
        })
        .where(and(eq(schema.users.clerkOrganizationId, clerkOrganizationId), eq(schema.users.id, record.userId)));
    }

    // Keep Inngest event outside transaction
    try {
      await inngest.send({
        name: "record/deleted",
        data: { clerkOrganizationId, id: recordId },
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
