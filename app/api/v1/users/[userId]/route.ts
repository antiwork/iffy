import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import db from "@/db";
import * as schema from "@/db/schema";
import { validateApiKey } from "@/services/api-keys";
import { findOrCreateOrganizationSettings } from "@/services/organization-settings";
import { generateLegacyAppealToken } from "@/services/appeals";
import { getAbsoluteUrl } from "@/lib/url";

export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: { message: "Invalid API key" } }, { status: 401 });
  }
  const apiKey = authHeader.split(" ")[1];
  const clerkOrganizationId = await validateApiKey(apiKey);
  if (!clerkOrganizationId) {
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

  const organizationSettings = await findOrCreateOrganizationSettings(clerkOrganizationId);

  const appealUrl =
    organizationSettings.appealsEnabled && user.actionStatus === "Suspended"
      ? getAbsoluteUrl(`/appeal?token=${generateLegacyAppealToken(user.id)}`)
      : null;

  return NextResponse.json({ data: { ...user, appealUrl } });
}
