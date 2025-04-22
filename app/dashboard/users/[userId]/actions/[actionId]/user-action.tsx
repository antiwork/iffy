import { Separator } from "@/components/ui/separator";
import { formatUserActionStatus, formatVia } from "@/lib/badges";
import { DateFull } from "@/components/date";
import { Header, HeaderContent, HeaderPrimary, HeaderSecondary } from "@/components/sheet/header";
import { Section, SectionContent, SectionTitle } from "@/components/sheet/section";
import Link from "next/link";
import { formatUserRecord, getUserRecordSecondaryParts } from "@/lib/user-record";
import { Button } from "@/components/ui/button";

import * as schema from "@/db/schema";
import { eq, and } from "drizzle-orm";
import db from "@/db";
import { formatUserWithUserId } from "@/lib/user-action";
import { notFound } from "next/navigation";
import { findOrCreateOrganization } from "@/services/organizations";

export async function UserActionDetail({ organizationId, id }: { organizationId: string; id: string }) {
  const userAction = await db.query.userActions.findFirst({
    where: and(eq(schema.userActions.organizationId, organizationId), eq(schema.userActions.id, id)),
    with: {
      userRecord: true,
      appeal: true,
    },
  });

  if (!userAction || !userAction.userRecord) {
    return notFound();
  }

  const organization = await findOrCreateOrganization({ id: organizationId });
  const appealsEnabled = organization.appealsEnabled;

  return (
    <div>
      <Header>
        <HeaderContent>
          <HeaderPrimary>
            <Link href={`/dashboard/users/${userAction.userRecord.id}`} className="hover:underline">
              {formatUserRecord(userAction.userRecord)}
            </Link>
          </HeaderPrimary>
          <HeaderSecondary>
            {getUserRecordSecondaryParts(userAction.userRecord).map((part) => (
              <div key={part}>{part}</div>
            ))}
          </HeaderSecondary>
        </HeaderContent>
      </Header>
      <Separator className="my-2" />
      <Section>
        <SectionTitle>Action details</SectionTitle>
        <SectionContent>
          <dl className="grid gap-3">
            <div className="grid grid-cols-2 gap-4">
              <dt className="text-stone-500 dark:text-zinc-500">Status</dt>
              <dd>{formatUserActionStatus(userAction)}</dd>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <dt className="text-stone-500 dark:text-zinc-500">Via</dt>
              <dd className="grid gap-3">
                <div>{formatVia(userAction)}</div>
                {userAction.via === "Automation Flagged Record" && (
                  <div className="grid gap-2">
                    <div>Action triggered by record being flagged</div>
                    {userAction.viaRecordId && (
                      <div>
                        <Button asChild variant="link" className="h-6 p-0 text-sm">
                          <Link href={`/dashboard/records/${userAction.viaRecordId}`}>View record</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                )}
                {userAction.via === "Automation All Compliant" && (
                  <div className="grid gap-2">
                    <div>Action triggered by all records being marked compliant</div>
                  </div>
                )}
                {userAction.via === "Automation Appeal Approved" && (
                  <div className="grid gap-2">
                    <div>Action triggered by appeal being approved</div>
                    {userAction.viaAppealId && appealsEnabled && (
                      <div>
                        <Button asChild variant="link" className="h-6 p-0 text-sm">
                          <Link href={`/dashboard/inbox/${userAction.viaAppealId}`}>View appeal</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                )}
                {userAction.via === "Manual" && (
                  <div className="grid gap-2">
                    <div>Action created manually</div>
                    {userAction.userId && <div>{await formatUserWithUserId(userAction.userId)}</div>}
                  </div>
                )}
              </dd>
            </div>

            {userAction.reasoning && (
              <div className="grid grid-cols-2 gap-4">
                <dt className="text-stone-500 dark:text-zinc-500">Reasoning</dt>
                <dd>{userAction.reasoning}</dd>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <dt className="text-stone-500 dark:text-zinc-500">Created at</dt>
              <dd>
                <DateFull date={userAction.createdAt} />
              </dd>
            </div>
            {userAction.appeal && appealsEnabled && (
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
