import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";

import db from "@/db";
import * as schema from "@/db/schema";
import { validateApiKey } from "@/services/api-keys";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: { message: "Invalid API key" } }, { status: 401 });
  }
  const apiKey = authHeader.split(" ")[1];
  const clerkOrganizationId = await validateApiKey(apiKey);
  if (!clerkOrganizationId) {
    return NextResponse.json({ error: { message: "Invalid API key" } }, { status: 401 });
  }

  const record = await db.query.records.findFirst({
    where: and(
      eq(schema.records.clerkOrganizationId, clerkOrganizationId),
      eq(schema.records.id, params.id),
      isNull(schema.records.deletedAt),
    ),
    columns: {
      id: true,
      clientId: true,
      clientUrl: true,
      name: true,
      entity: true,
      metadata: true,
      createdAt: true,
      updatedAt: true,
      moderationStatus: true,
      moderationStatusCreatedAt: true,
      moderationPending: true,
      moderationPendingCreatedAt: true,
      userId: true,
    },
  });

  if (!record) {
    return NextResponse.json({ error: { message: "Record not found" } }, { status: 404 });
  }

  const { userId, ...rest } = record;
  return NextResponse.json({
    data: {
      ...rest,
      user: userId,
    },
  });
}
