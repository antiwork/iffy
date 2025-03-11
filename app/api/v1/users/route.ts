import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, desc, eq, gt, lt } from "drizzle-orm";
import { SQL } from "drizzle-orm";

import db from "@/db";
import * as schema from "@/db/schema";
import { validateApiKey } from "@/services/api-keys";
import { parseQueryParams } from "@/app/api/parse";
import { findOrCreateOrganization } from "@/services/organizations";
import { getAbsoluteUrl } from "@/lib/url";
import { generateAppealToken } from "@/services/appeals";

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
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: { message: "Invalid API key" } }, { status: 401 });
  }
  const apiKey = authHeader.split(" ")[1];
  const clerkOrganizationId = await validateApiKey(apiKey);
  if (!clerkOrganizationId) {
    return NextResponse.json({ error: { message: "Invalid API key" } }, { status: 401 });
  }

  const { data, error } = await parseQueryParams(req, ListUsersRequestData);
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  const organization = await findOrCreateOrganization(clerkOrganizationId);

  const { limit, starting_after, ending_before, email, clientId, status, user } = data;

  let conditions: SQL<unknown>[] = [eq(schema.users.clerkOrganizationId, clerkOrganizationId)];

  if (email) {
    conditions.push(eq(schema.users.email, email));
  }

  if (clientId) {
    conditions.push(eq(schema.users.clientId, clientId));
  }

  if (status) {
    conditions.push(eq(schema.users.actionStatus, status));
  }

  if (user) {
    const userExists = await db.query.users.findFirst({
      where: eq(schema.users.id, user),
    });
    if (!userExists) {
      return NextResponse.json({ error: { message: "Invalid user" } }, { status: 400 });
    }
    conditions.push(eq(schema.users.id, user));
  }

  if (starting_after) {
    const cursor = await db.query.users.findFirst({
      where: eq(schema.users.id, starting_after),
      columns: { sort: true },
    });
    if (!cursor) {
      return NextResponse.json({ error: { message: "Invalid starting_after cursor" } }, { status: 400 });
    }
    conditions.push(gt(schema.users.sort, cursor.sort));
  } else if (ending_before) {
    const cursor = await db.query.users.findFirst({
      where: eq(schema.users.id, ending_before),
      columns: { sort: true },
    });
    if (!cursor) {
      return NextResponse.json({ error: { message: "Invalid ending_before cursor" } }, { status: 400 });
    }
    conditions.push(lt(schema.users.sort, cursor.sort));
  }

  const users = await db
    .select({
      id: schema.users.id,
      clientId: schema.users.clientId,
      clientUrl: schema.users.clientUrl,
      email: schema.users.email,
      name: schema.users.name,
      username: schema.users.username,
      protected: schema.users.protected,
      metadata: schema.users.metadata,
      createdAt: schema.users.createdAt,
      updatedAt: schema.users.updatedAt,
      actionStatus: schema.users.actionStatus,
      actionStatusCreatedAt: schema.users.actionStatusCreatedAt,
    })
    .from(schema.users)
    .where(and(...conditions))
    .orderBy(ending_before ? desc(schema.users.sort) : schema.users.sort)
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
