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

  const organization = await findOrCreateOrganization(organizationId);

  const { limit, starting_after, ending_before, email, clientId, status, user } = data;

  let conditions: SQL<unknown>[] = [eq(schema.endUsers.organizationId, organizationId)];

  if (email) {
    conditions.push(eq(schema.endUsers.email, email));
  }

  if (clientId) {
    conditions.push(eq(schema.endUsers.clientId, clientId));
  }

  if (status) {
    conditions.push(eq(schema.endUsers.actionStatus, status));
  }

  if (user) {
    const userExists = await db.query.endUsers.findFirst({
      where: eq(schema.endUsers.id, user),
    });
    if (!userExists) {
      return NextResponse.json({ error: { message: "Invalid user" } }, { status: 400 });
    }
    conditions.push(eq(schema.endUsers.id, user));
  }

  if (starting_after) {
    const cursor = await db.query.endUsers.findFirst({
      where: eq(schema.endUsers.id, starting_after),
      columns: { sort: true },
    });
    if (!cursor) {
      return NextResponse.json({ error: { message: "Invalid starting_after cursor" } }, { status: 400 });
    }
    conditions.push(gt(schema.endUsers.sort, cursor.sort));
  } else if (ending_before) {
    const cursor = await db.query.endUsers.findFirst({
      where: eq(schema.endUsers.id, ending_before),
      columns: { sort: true },
    });
    if (!cursor) {
      return NextResponse.json({ error: { message: "Invalid ending_before cursor" } }, { status: 400 });
    }
    conditions.push(lt(schema.endUsers.sort, cursor.sort));
  }

  const users = await db
    .select({
      id: schema.endUsers.id,
      clientId: schema.endUsers.clientId,
      clientUrl: schema.endUsers.clientUrl,
      email: schema.endUsers.email,
      name: schema.endUsers.name,
      username: schema.endUsers.username,
      protected: schema.endUsers.protected,
      metadata: schema.endUsers.metadata,
      createdAt: schema.endUsers.createdAt,
      updatedAt: schema.endUsers.updatedAt,
      actionStatus: schema.endUsers.actionStatus,
      actionStatusCreatedAt: schema.endUsers.actionStatusCreatedAt,
    })
    .from(schema.endUsers)
    .where(and(...conditions))
    .orderBy(ending_before ? desc(schema.endUsers.sort) : schema.endUsers.sort)
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
