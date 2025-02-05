import { auth } from "@clerk/nextjs/server";
import { UserDetail } from "./record-user";
import { notFound, redirect } from "next/navigation";
import { Metadata } from "next";
import db from "@/db";
import * as schema from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { formatUserCompact } from "@/lib/record-user";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { orgId } = await auth();
  if (!orgId) {
    redirect("/");
  }

  const id = (await params).id;

  const user = await db.query.users.findFirst({
    where: and(eq(schema.users.clerkOrganizationId, orgId), eq(schema.users.id, id)),
  });

  if (!user) {
    return notFound();
  }

  return {
    title: `${formatUserCompact(user)} | Iffy`,
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { orgId } = await auth();
  if (!orgId) {
    redirect("/");
  }
  const id = (await params).id;
  return <UserDetail clerkOrganizationId={orgId} id={id} />;
}
