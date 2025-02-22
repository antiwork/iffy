import { auth } from "@clerk/nextjs/server";
import { ModerationDetail } from "@/app/dashboard/moderations/[id]/moderation";
import { redirect, notFound } from "next/navigation";
import { RouterSheet } from "@/components/router-sheet";
import { Metadata } from "next";
import db from "@/db";
import * as schema from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const { orgId } = await auth();
  if (!orgId) {
    redirect("/");
  }

  const moderation = await db.query.moderations.findFirst({
    where: and(eq(schema.moderations.clerkOrganizationId, orgId), eq(schema.moderations.id, params.id)),
    with: {
      record: true,
    },
  });

  if (!moderation) {
    return notFound();
  }

  return {
    title: `${moderation.record.name} | Moderation | Iffy`,
  };
}

export default async function Page({ params }: { params: { id: string } }) {
  const { orgId } = await auth();
  if (!orgId) {
    redirect("/");
  }

  return (
    <RouterSheet title="Moderation">
      <ModerationDetail clerkOrganizationId={orgId} id={params.id} />
    </RouterSheet>
  );
}
