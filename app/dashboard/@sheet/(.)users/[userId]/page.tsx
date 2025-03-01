import { auth } from "@clerk/nextjs/server";
import { UserDetail } from "@/app/dashboard/users/[userId]/user";
import { notFound, redirect } from "next/navigation";
import { RouterSheet } from "@/components/router-sheet";
import db from "@/db";
import { formatUserCompact } from "@/lib/record-user";
import * as schema from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ userId: string }> }): Promise<Metadata> {
  const { orgId } = await auth();
  if (!orgId) {
    redirect("/");
  }

  const id = (await params).userId;

  const user = await db.query.users.findFirst({
    where: and(eq(schema.users.clerkOrganizationId, orgId), eq(schema.users.id, id)),
  });

  if (!user) {
    return notFound();
  }

  return {
    title: `User ${formatUserCompact(user)} | Iffy`,
  };
}

export default async function Page({ params }: { params: Promise<{ userId: string }> }) {
  const { orgId } = await auth();
  if (!orgId) {
    redirect("/");
  }
  const id = (await params).userId;
  return (
    <RouterSheet title="User">
      <UserDetail clerkOrganizationId={orgId} id={id} />
    </RouterSheet>
  );
}
