import { authWithOrgSubscription } from "@/app/dashboard/auth";
import { UserDetail } from "./user";
import { notFound, redirect } from "next/navigation";
import { Metadata } from "next";
import db from "@/db";
import * as schema from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { formatUserCompact } from "@/lib/user";

export async function generateMetadata({ params }: { params: Promise<{ endUserId: string }> }): Promise<Metadata> {
  const { orgId } = await authWithOrgSubscription();

  const id = (await params).endUserId;

  const user = await db.query.endUsers.findFirst({
    where: and(eq(schema.endUsers.authOrganizationId, orgId), eq(schema.endUsers.id, id)),
  });

  if (!user) {
    return notFound();
  }

  return {
    title: `${formatUserCompact(user)} | Iffy`,
  };
}

export default async function Page({ params }: { params: Promise<{ endUserId: string }> }) {
  const { orgId } = await authWithOrgSubscription();
  const id = (await params).endUserId;
  return <UserDetail authOrganizationId={orgId} id={id} />;
}
