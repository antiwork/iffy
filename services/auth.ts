"use server";

import { auth as betterAuth, Session } from "@/lib/auth";
import { headers } from "next/headers";
import db from "@/db";
import { and, eq } from "drizzle-orm";
import { members } from "@/db/tables";

export async function hasAdminRole() {
  const { userId, orgRole } = await auth();

  if (!userId) return false;

  return orgRole === "admin" || orgRole === "owner";
}

interface SignedInWithActiveOrgAuth {
  sessionId: string;
  userId: string;
  orgId: string;
  orgRole: string;
  orgSlug: string;
}

interface SignedInWithoutActiveOrgAuth {
  sessionId: string;
  userId: string;
  orgId: null;
  orgRole: null;
  orgSlug: null;
}

interface SignedOutAuth {
  sessionId: null;
  userId: null;
  orgId: null;
  orgRole: null;
  orgSlug: null;
}

type SignedInAuth = SignedInWithActiveOrgAuth | SignedInWithoutActiveOrgAuth;
type Auth = SignedInAuth | SignedOutAuth;

export async function auth(): Promise<Auth> {
  const response = (await betterAuth.api.getSession({ headers: await headers() })) as Session;

  if (!response || !response.session) {
    return {
      sessionId: null,
      userId: null,
      orgId: null,
      orgRole: null,
      orgSlug: null,
    };
  }

  if (!response.session.activeOrganizationId) {
    return {
      sessionId: response.session.id,
      userId: response.session.userId,
      orgId: null,
      orgRole: null,
      orgSlug: null,
    };
  }

  return {
    sessionId: response.session.id,
    userId: response.session.userId,
    orgId: response.session.activeOrganizationId,
    orgRole: response.session.activeOrganizationRole,
    orgSlug: response.session.activeOrganizationSlug,
  };
}

interface MemberMeta {
  isMember: boolean;
  role: string | null;
}

export async function getMemberMeta(userId: string, organizationId: string): Promise<MemberMeta> {
  const member = await db.query.members.findFirst({
    where: and(eq(members.id, userId), eq(members.organizationId, organizationId)),
  });

  if (!member) return { isMember: false, role: null };

  return { isMember: true, role: member.role };
}
