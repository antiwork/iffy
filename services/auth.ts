import db from "@/db";
import * as schema from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const ORGANIZATION_ADMIN_ROLE = "admin";

export async function hasAdminRole(organizationId: string): Promise<boolean> {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.session?.userId;

  if (!userId) {
    console.warn("No user ID found in session.");
    return false;
  }

  if (!organizationId) {
    console.warn("Organization ID is required to check role.");
    return false;
  }

  try {
    const membership = await db
      .select({
        role: schema.member.role,
      })
      .from(schema.member)
      .where(
        and(
          eq(schema.member.organizationId, organizationId),
          eq(schema.member.userId, userId)
        )
      )
      .limit(1);

    if (membership.length > 0) {
      return membership[0].role === ORGANIZATION_ADMIN_ROLE;
    }

    return false;

  } catch (error) {
    console.error("Error checking organization admin role:", error);
    return false;
  }
}

