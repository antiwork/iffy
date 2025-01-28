import { auth } from "@clerk/nextjs/server";
import { RecordUserDetail } from "@/app/dashboard/users/[id]/record-user";
import { notFound, redirect } from "next/navigation";
import { RouterSheet } from "@/components/router-sheet";
import db from "@/db";
import { formatRecordUserCompact } from "@/lib/record-user";
import * as schema from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { Metadata } from "next";

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
    title: `User ${formatRecordUserCompact(recordUser)} | Iffy`,
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { orgId } = await auth();
  if (!orgId) {
    redirect("/");
  }
  const id = (await params).id;
  return (
    <RouterSheet title="User">
      <RecordUserDetail clerkOrganizationId={orgId} id={id} />
    </RouterSheet>
  );
}
