import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, desc, eq, gt, lt } from "drizzle-orm";
import { SQL } from "drizzle-orm";

import db from "@/db";
import * as schema from "@/db/schema";
import { parseQueryParams } from "@/app/api/parse";
import { findOrCreateOrganization } from "@/services/organizations";
import { getAbsoluteUrl } from "@/lib/url";
import { generateAppealToken } from "@/services/appeals";
import { authenticateRequest } from "../../auth";

const ListUsersRequestData = z.object({
  limit: z.coerce.number().min(1).max(100).default(10),
  starting_after: z.string().optional(),
  ending_before: z.string().optional(),
  clientId: z.string().optional(),
  email: z.string().optional(),
  status: z.enum(["Compliant", "Suspended", "Banned"]).optional(),
  user: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const [isValid, organizationId] = await authenticateRequest(req);
  if (!isValid) {
    return NextResponse.json({ error: { message: "Invalid API key" } }, { status: 401 });
  }

  const { data, error } = await parseQueryParams(req, ListUsersRequestData);
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  const organization = await findOrCreateOrganization({ id: organizationId });

  const { limit, starting_after, ending_before, email, clientId, status, user } = data;

  let conditions: SQL<unknown>[] = [eq(schema.userRecords.organizationId, organizationId)];

  if (email) {
    conditions.push(eq(schema.userRecords.email, email));
  }

  if (clientId) {
    conditions.push(eq(schema.userRecords.clientId, clientId));
  }

  if (status) {
    conditions.push(eq(schema.userRecords.actionStatus, status));
  }

  if (user) {
    const userRecordExists = await db.query.userRecords.findFirst({
      where: eq(schema.userRecords.id, user),
    });
    if (!userRecordExists) {
      return NextResponse.json({ error: { message: "Invalid user" } }, { status: 400 });
    }
    conditions.push(eq(schema.userRecords.id, user));
  }

  if (starting_after) {
    const cursor = await db.query.userRecords.findFirst({
      where: eq(schema.userRecords.id, starting_after),
      columns: { sort: true },
    });
    if (!cursor) {
      return NextResponse.json({ error: { message: "Invalid starting_after cursor" } }, { status: 400 });
    }
    conditions.push(gt(schema.userRecords.sort, cursor.sort));
  } else if (ending_before) {
    const cursor = await db.query.userRecords.findFirst({
      where: eq(schema.userRecords.id, ending_before),
      columns: { sort: true },
    });
    if (!cursor) {
      return NextResponse.json({ error: { message: "Invalid ending_before cursor" } }, { status: 400 });
    }
    conditions.push(lt(schema.userRecords.sort, cursor.sort));
  }

  const users = await db
    .select({
      id: schema.userRecords.id,
      clientId: schema.userRecords.clientId,
      clientUrl: schema.userRecords.clientUrl,
      email: schema.userRecords.email,
      name: schema.userRecords.name,
      username: schema.userRecords.username,
      protected: schema.userRecords.protected,
      metadata: schema.userRecords.metadata,
      createdAt: schema.userRecords.createdAt,
      updatedAt: schema.userRecords.updatedAt,
      actionStatus: schema.userRecords.actionStatus,
      actionStatusCreatedAt: schema.userRecords.actionStatusCreatedAt,
    })
    .from(schema.userRecords)
    .where(and(...conditions))
    .orderBy(ending_before ? desc(schema.userRecords.sort) : schema.userRecords.sort)
    .limit(limit + 1);

  const hasMore = users.length > limit;
  if (hasMore) {
    users.pop();
  }

  if (ending_before) {
    users.reverse();
  }

  return NextResponse.json({
    data: users.map((user) => {
      const appealUrl =
        organization.appealsEnabled && user.actionStatus === "Suspended"
          ? getAbsoluteUrl(`/appeal?token=${generateAppealToken(user.id)}`)
          : null;
      return { ...user, appealUrl };
    }),
    has_more: hasMore,
  });
}
