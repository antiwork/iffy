import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import db from "@/db";
import * as schema from "@/db/schema";
import { createAppeal, generateAppealToken } from "@/services/appeals";
import { findOrCreateOrganization } from "@/services/organizations";
import { getAbsoluteUrl } from "@/lib/url";
import { authenticateRequest } from "@/app/api/auth";
import { CreateAppealRequestData } from "./schema";
import { parseRequestBody } from "@/app/api/parse";

export async function POST(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const [isValid, organizationId] = await authenticateRequest(req);
  if (!isValid) {
    return NextResponse.json({ error: { message: "Invalid API key" } }, { status: 401 });
  }

  const { appealsEnabled } = await findOrCreateOrganization(organizationId);
  if (!appealsEnabled) {
    return NextResponse.json({ error: { message: "Appeals are not enabled" } }, { status: 400 });
  }

  const { userId: id } = await params;

  const { data, error } = await parseRequestBody(req, CreateAppealRequestData);
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  const user = await db.query.endUsers.findFirst({
    where: and(eq(schema.endUsers.authOrganizationId, organizationId), eq(schema.endUsers.id, id)),
  });

  if (!user) {
    return NextResponse.json({ error: { message: "User not found" } }, { status: 404 });
  }

  try {
    const appeal = await createAppeal({ userId: user.id, text: data.text });

    const organization = await findOrCreateOrganization(organizationId);

    const appealUrl = organization.appealsEnabled
      ? getAbsoluteUrl(`/appeal?token=${generateAppealToken(user.id)}`)
      : null;

    return NextResponse.json({
      data: {
        id: appeal.id,
        actionStatus: appeal.actionStatus,
        actionStatusCreatedAt: appeal.actionStatusCreatedAt,
        createdAt: appeal.createdAt,
        updatedAt: appeal.updatedAt,
        appealUrl,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message === "User is not suspended" ||
        error.message === "Banned users may not appeal" ||
        error.message === "Appeal already exists"
      ) {
        return NextResponse.json({ error: { message: error.message } }, { status: 409 });
      }
    }
    return NextResponse.json({ error: { message: "Failed to create appeal" } }, { status: 500 });
  }
}
