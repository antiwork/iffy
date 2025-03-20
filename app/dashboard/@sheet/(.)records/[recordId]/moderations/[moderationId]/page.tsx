import { authWithOrgSubscription } from "@/app/dashboard/auth";
import { ModerationDetail } from "@/app/dashboard/records/[recordId]/moderations/[moderationId]/moderation";
import { redirect, notFound } from "next/navigation";
import { RouterSheet } from "@/components/router-sheet";
import { Metadata } from "next";
import db from "@/db";
import * as schema from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function generateMetadata({ params }: { params: Promise<{ moderationId: string }> }): Promise<Metadata> {
  const { orgId } = await authWithOrgSubscription();

  const id = (await params).moderationId;

  const moderation = await db.query.moderations.findFirst({
    where: and(eq(schema.moderations.clerkOrganizationId, orgId), eq(schema.moderations.id, id)),
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

export default async function Page({ params }: { params: Promise<{ moderationId: string }> }) {
  const { orgId } = await authWithOrgSubscription();

  const id = (await params).moderationId;

  return (
    <RouterSheet title="Moderation">
      <ModerationDetail clerkOrganizationId={orgId} id={id} />
    </RouterSheet>
  );
}
