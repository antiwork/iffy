import { auth } from "@clerk/nextjs/server";
import { RecordUserDetail } from "./record-user";
import { notFound, redirect } from "next/navigation";
import { Metadata } from "next";
import db from "@/db";
import * as schema from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { formatRecordUserCompact } from "@/lib/record-user";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { orgId } = await auth();
  if (!orgId) {
    redirect("/");
  }

  const id = (await params).id;

  const recordUser = await db.query.recordUsers.findFirst({
    where: and(eq(schema.recordUsers.clerkOrganizationId, orgId), eq(schema.recordUsers.id, id)),
  });

  if (!recordUser) {
    return notFound();
  }

  return {
    title: `${formatRecordUserCompact(recordUser)} | Iffy`,
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { orgId } = await auth();
  if (!orgId) {
    redirect("/");
  }
  const id = (await params).id;
  return <RecordUserDetail clerkOrganizationId={orgId} id={id} />;
}
