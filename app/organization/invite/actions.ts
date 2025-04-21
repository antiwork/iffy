"use server";

import db from "@/db";
import { and, eq } from "drizzle-orm";
import { invitations, users } from "@/db/tables";
import { auth } from "@/services/auth";
import { auth as authApi } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

interface AcceptInvitationInput {
  invitationId: string;
}

export const acceptInvitation = async ({ invitationId }: AcceptInvitationInput) => {
  const session = await auth();
  if (!session.userId) {
    throw new Error("Not authenticated");
  }

  const invitation = await db.query.invitations.findFirst({
    where: and(eq(invitations.id, invitationId), eq(invitations.email, session.userEmail)),
    with: {
      organization: true,
      inviter: true,
    },
  });

  if (!invitation) {
    throw new Error("Invitation not found");
  }

  if (invitation.status !== "pending") {
    throw new Error("Invitation has already been accepted or expired");
  }

  await authApi.api.acceptInvitation({ body: { invitationId }, headers: await headers() });

  redirect("/dashboard");
};
