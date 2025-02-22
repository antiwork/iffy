import { Separator } from "@/components/ui/separator";
import { formatUserActionStatus, formatVia } from "@/lib/badges";
import { DateFull } from "@/components/date";
import { Header, HeaderContent, HeaderPrimary, HeaderSecondary } from "@/components/sheet/header";
import { Section, SectionContent, SectionTitle } from "@/components/sheet/section";
import Link from "next/link";
import { formatUser, getUserSecondaryParts } from "@/lib/record-user";
import { Button } from "@/components/ui/button";

import * as schema from "@/db/schema";
import { eq, and } from "drizzle-orm";
import db from "@/db";

export async function UserActionDetail({ clerkOrganizationId, id }: { clerkOrganizationId: string; id: string }) {
  const userAction = await db.query.userActions.findFirst({
    where: and(eq(schema.userActions.clerkOrganizationId, clerkOrganizationId), eq(schema.userActions.id, id)),
    with: {
      user: true,
      appeal: true,
    },
  });

  if (!userAction) {
    return null;
  }

  return (
    <div>
      <Header>
        <HeaderContent>
          <HeaderPrimary>
            <Link href={`/dashboard/users/${userAction.user.id}`} className="hover:underline">
              {formatUser(userAction.user)}
            </Link>
          </HeaderPrimary>
          <HeaderSecondary>
            {getUserSecondaryParts(userAction.user).map((part) => (
              <div key={part}>{part}</div>
            ))}
          </HeaderSecondary>
        </HeaderContent>
      </Header>
      <Separator className="my-2" />
      <Section>
        <SectionTitle>User action details</SectionTitle>
        <SectionContent>
          <dl className="grid gap-3">
            <div className="grid grid-cols-2 gap-4">
              <dt className="text-stone-500 dark:text-zinc-500">Status</dt>
              <dd>{formatUserActionStatus(userAction)}</dd>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <dt className="text-stone-500 dark:text-zinc-500">Via</dt>
              <dd>{formatVia(userAction)}</dd>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <dt className="text-stone-500 dark:text-zinc-500">Created at</dt>
              <dd>
                <DateFull date={userAction.createdAt} />
              </dd>
            </div>
            {userAction.appeal && (
              <div className="grid grid-cols-2 gap-4">
                <dt className="text-stone-500 dark:text-zinc-500">Appeal</dt>
                <dd>
                  <Button asChild variant="link" className="text-md -ml-3 h-6 p-0">
                    <Link href={`/dashboard/inbox/${userAction.appeal.id}`}>View appeal</Link>
                  </Button>
                </dd>
              </div>
            )}
          </dl>
        </SectionContent>
      </Section>
    </div>
  );
}
