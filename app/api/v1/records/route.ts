import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, desc, eq, gt, isNull, lt } from "drizzle-orm";
import { SQL } from "drizzle-orm";

import db from "@/db";
import * as schema from "@/db/schema";
import { parseQueryParams } from "@/app/api/parse";
import { parseMetadata } from "@/services/metadata";
import { authenticateRequest } from "../../auth";

const ListRecordsRequestData = z.object({
  limit: z.coerce.number().min(1).max(100).default(10),
  starting_after: z.string().optional(),
  ending_before: z.string().optional(),
  clientId: z.string().optional(),
  user: z.string().optional(),
  entity: z.string().optional(),
  status: z.enum(["Compliant", "Flagged"]).optional(),
});

export async function GET(req: NextRequest) {
  const [isValid, clerkOrganizationId] = await authenticateRequest(req);
  if (!isValid) {
    return NextResponse.json({ error: { message: "Invalid API key" } }, { status: 401 });
  }

  const { data, error } = await parseQueryParams(req, ListRecordsRequestData);
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  const { limit, starting_after, ending_before, user, entity, clientId, status } = data;

  let conditions: SQL<unknown>[] = [
    eq(schema.records.clerkOrganizationId, clerkOrganizationId),
    isNull(schema.records.deletedAt),
  ];

  if (user) {
    const userRecordExists = await db.query.userRecords.findFirst({
      where: and(eq(schema.userRecords.clerkOrganizationId, clerkOrganizationId), eq(schema.userRecords.id, user)),
      columns: { id: true },
    });
    if (!userRecordExists) {
      return NextResponse.json({ error: { message: "Invalid user ID" } }, { status: 400 });
    }
    conditions.push(eq(schema.records.userRecordId, user));
  }

  if (entity) {
    conditions.push(eq(schema.records.entity, entity));
  }

  if (clientId) {
    conditions.push(eq(schema.records.clientId, clientId));
  }

  if (status) {
    conditions.push(eq(schema.records.moderationStatus, status));
  }

  if (starting_after) {
    const cursor = await db.query.records.findFirst({
      where: eq(schema.records.id, starting_after),
      columns: { sort: true },
    });
    if (!cursor) {
      return NextResponse.json({ error: { message: "Invalid starting_after cursor" } }, { status: 400 });
    }
    conditions.push(gt(schema.records.sort, cursor.sort));
  } else if (ending_before) {
    const cursor = await db.query.records.findFirst({
      where: eq(schema.records.id, ending_before),
      columns: { sort: true },
    });
    if (!cursor) {
      return NextResponse.json({ error: { message: "Invalid ending_before cursor" } }, { status: 400 });
    }
    conditions.push(lt(schema.records.sort, cursor.sort));
  }

  const records = await db
    .select({
      id: schema.records.id,
      clientId: schema.records.clientId,
      clientUrl: schema.records.clientUrl,
      name: schema.records.name,
      entity: schema.records.entity,
      protected: schema.records.protected,
      metadata: schema.records.metadata,
      createdAt: schema.records.createdAt,
      updatedAt: schema.records.updatedAt,
      moderationStatus: schema.records.moderationStatus,
      moderationStatusCreatedAt: schema.records.moderationStatusCreatedAt,
      moderationPending: schema.records.moderationPending,
      moderationPendingCreatedAt: schema.records.moderationPendingCreatedAt,
      userRecordId: schema.records.userRecordId,
    })
    .from(schema.records)
    .where(and(...conditions))
    .orderBy(ending_before ? desc(schema.records.sort) : schema.records.sort)
    .limit(limit + 1);

  const hasMore = records.length > limit;
  if (hasMore) {
    records.pop();
  }

  if (ending_before) {
    records.reverse();
  }

  return NextResponse.json({
    data: records.map(({ userRecordId, metadata, ...record }) => ({
      ...record,
      user: userRecordId,
      metadata: metadata ? parseMetadata(metadata) : undefined,
    })),
    has_more: hasMore,
  });
}
