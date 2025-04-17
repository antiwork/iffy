import db from "@/db";
import * as schema from "@/db/schema";
import { authWithOrgSubscription } from "@/app/dashboard/auth";
import { notFound, redirect } from "next/navigation";
import { Appeal } from "../appeal";
import { subDays } from "date-fns";
import { and, desc, eq, gte, inArray } from "drizzle-orm";
import { formatUserCompact } from "@/lib/user";

const HISTORY_DAYS = 7;

export async function generateMetadata({ params }: { params: Promise<{ appealId: string }> }) {
  const { orgId } = await authWithOrgSubscription();

  const id = (await params).appealId;

  const appeal = await db.query.appeals.findFirst({
    where: and(eq(schema.appeals.authOrganizationId, orgId), eq(schema.appeals.id, id)),
    with: {
      userAction: {
        with: {
          user: true,
        },
      },
    },
  });

  if (!appeal) {
    return notFound();
  }

  return {
    title: `Appeal from ${formatUserCompact(appeal.userAction.user)} | Iffy`,
  };
}

export default async function Page({ params }: { params: Promise<{ appealId: string }> }) {
  const { orgId } = await authWithOrgSubscription();

  const id = (await params).appealId;

  const appealWithMessages = await db.query.appeals.findFirst({
    where: and(eq(schema.appeals.authOrganizationId, orgId), eq(schema.appeals.id, id)),
    with: {
      userAction: {
        with: {
          user: true,
        },
      },
      actions: {
        orderBy: [desc(schema.appealActions.createdAt)],
      },
      messages: {
        orderBy: [desc(schema.messages.createdAt)],
        with: {
          from: true,
        },
      },
    },
  });

  if (!appealWithMessages) {
    return notFound();
  }

  const { messages, actions, ...appeal } = appealWithMessages;

  const endUserId = appeal.userAction.user.id;

  const records = await db.query.records.findMany({
    where: and(eq(schema.records.authOrganizationId, orgId), eq(schema.records.endUserId, endUserId)),
  });

  const moderations = await db.query.moderations.findMany({
    where: and(
      eq(schema.moderations.authOrganizationId, orgId),
      gte(schema.moderations.createdAt, subDays(appeal.createdAt, HISTORY_DAYS)),
      inArray(
        schema.moderations.recordId,
        records.map((r) => r.id),
      ),
    ),
    orderBy: [desc(schema.moderations.createdAt)],
    with: {
      record: true,
    },
  });

  const userActions = await db.query.userActions.findMany({
    where: and(
      eq(schema.userActions.authOrganizationId, orgId),
      eq(schema.userActions.endUserId, endUserId),
      gte(schema.userActions.createdAt, subDays(appeal.createdAt, HISTORY_DAYS)),
    ),
    orderBy: [desc(schema.userActions.createdAt)],
  });

  return (
    <Appeal
      appeal={appeal}
      actions={actions}
      messages={messages}
      records={records}
      moderations={moderations}
      userActions={userActions}
    />
  );
}
