import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { Metadata } from "next";
import { UserActionDetail } from "./user-action";
import db from "@/db";
import * as schema from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { formatUser } from "@/lib/record-user";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const { orgId } = await auth();
  if (!orgId) {
    redirect("/");
  }

  const userAction = await db.query.userActions.findFirst({
    where: and(eq(schema.userActions.clerkOrganizationId, orgId), eq(schema.userActions.id, params.id)),
    with: {
      user: true,
    },
  });

  if (!userAction) {
    return notFound();
  }

  return {
    title: `${formatUser(userAction.user)} | User action | Iffy`,
  };
}

export default async function UserActionPage({ params }: { params: { id: string } }) {
  const { orgId } = await auth();
  if (!orgId) {
    redirect("/");
  }

  return <UserActionDetail clerkOrganizationId={orgId} id={params.id} />;
}
