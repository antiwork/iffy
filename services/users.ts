"use server";

import db from "@/db";
import { and, desc, isNull, eq } from "drizzle-orm";
import * as schema from "@/db/schema";

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
      eq(schema.records.userId, id),
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
