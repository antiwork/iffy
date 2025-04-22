import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import db from "@/db";
import * as schema from "@/db/schema";
import { findOrganization } from "@/services/organizations";
import { generateAppealToken } from "@/services/appeals";
import { getAbsoluteUrl } from "@/lib/url";
import { authenticateRequest } from "@/app/api/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const [isValid, organizationId] = await authenticateRequest(req);
  if (!isValid) {
    return NextResponse.json({ error: { message: "Invalid API key" } }, { status: 401 });
  }

  const { userId: id } = await params;

  const userRecord = await db.query.userRecords.findFirst({
    where: and(eq(schema.userRecords.organizationId, organizationId), eq(schema.userRecords.id, id)),
    columns: {
      id: true,
      clientId: true,
      clientUrl: true,
      email: true,
      name: true,
      username: true,
      protected: true,
      metadata: true,
      createdAt: true,
      updatedAt: true,
      actionStatus: true,
      actionStatusCreatedAt: true,
    },
  });

  if (!userRecord) {
    return NextResponse.json({ error: { message: "User not found" } }, { status: 404 });
  }

  const organization = await findOrganization(organizationId);

  const appealUrl =
    organization.appealsEnabled && userRecord.actionStatus === "Suspended"
      ? getAbsoluteUrl(`/appeal?token=${generateAppealToken(userRecord.id)}`)
      : null;

  return NextResponse.json({ data: { ...userRecord, appealUrl } });
}
