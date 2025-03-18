import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import db from "@/db";
import * as schema from "@/db/schema";
import { findOrCreateOrganization } from "@/services/organizations";
import { generateAppealToken } from "@/services/appeals";
import { getAbsoluteUrl } from "@/lib/url";
import { authenticateRequest } from "@/app/api/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const [isValid, clerkOrganizationId] = await authenticateRequest(req);
  if (!isValid) {
    return NextResponse.json({ error: { message: "Invalid API key" } }, { status: 401 });
  }

  const { userId: id } = await params;

  const user = await db.query.users.findFirst({
    where: and(eq(schema.users.clerkOrganizationId, clerkOrganizationId), eq(schema.users.id, id)),
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

  if (!user) {
    return NextResponse.json({ error: { message: "User not found" } }, { status: 404 });
  }

  const organization = await findOrCreateOrganization(clerkOrganizationId);

  const appealUrl =
    organization.appealsEnabled && user.actionStatus === "Suspended"
      ? getAbsoluteUrl(`/appeal?token=${generateAppealToken(user.id)}`)
      : null;

  return NextResponse.json({ data: { ...user, appealUrl } });
}
