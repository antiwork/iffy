import { Separator } from "@/components/ui/separator";
import { formatUserRecord, getUserRecordSecondaryParts } from "@/lib/user-record";
import db from "@/db";
import * as schema from "@/db/schema";
import { formatUserActionStatus, formatVia } from "@/lib/badges";
import { ExternalLink, ShieldCheck, ShieldOff } from "lucide-react";
import { Header, HeaderActions, HeaderContent, HeaderPrimary, HeaderSecondary } from "@/components/sheet/header";
import { Section, SectionContent, SectionTitle } from "@/components/sheet/section";
import { CodeInline } from "@/components/code";
import { ActionMenu } from "../action-menu";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { DateFull } from "@/components/date";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ActionsTable } from "./actions-table";
import { RecordsTable } from "./records-table";
import { CopyButton } from "@/components/copy-button";
import { eq, and, desc } from "drizzle-orm";
import { StripeAccount } from "./stripe-account";
import { notFound } from "next/navigation";
import { parseMetadata } from "@/services/metadata";
import { formatLink } from "@/lib/url";

export async function UserRecordDetail({ clerkOrganizationId, id }: { clerkOrganizationId: string; id: string }) {
  const userRecord = await db.query.userRecords.findFirst({
    where: and(eq(schema.userRecords.clerkOrganizationId, clerkOrganizationId), eq(schema.userRecords.id, id)),
    with: {
      actions: {
        orderBy: [desc(schema.userActions.createdAt)],
        with: {
          appeal: true,
        },
      },
    },
  });

  if (!userRecord) {
    return notFound();
  }

  const metadata = userRecord.metadata ? parseMetadata(userRecord.metadata) : undefined;

  return (
    <div>
      <Header>
        <HeaderContent>
          <HeaderPrimary>{formatUserRecord(userRecord)}</HeaderPrimary>
          <HeaderSecondary>
            {getUserRecordSecondaryParts(userRecord).map((part) => (
              <div key={part}>{part}</div>
            ))}
          </HeaderSecondary>
        </HeaderContent>
        <HeaderActions className="flex items-center gap-4">
          {userRecord.protected ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <ShieldCheck className="h-4 w-4 text-stone-500 dark:text-zinc-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Protected</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <ShieldOff className="h-4 w-4 text-stone-300 dark:text-zinc-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Not Protected</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {formatUserActionStatus({ status: userRecord.actionStatus ?? "Compliant" })}
          <ActionMenu userRecord={userRecord} />
        </HeaderActions>
      </Header>
      <Separator className="my-2" />
      <Section>
        <SectionTitle>Details</SectionTitle>
        <SectionContent>
          <dl className="grid gap-3">
            <div className="grid grid-cols-2 gap-4">
              <dt className="text-stone-500 dark:text-zinc-500">Client ID</dt>
              <dd className="flex items-center gap-2 break-words">
                <CodeInline>{userRecord.clientId}</CodeInline>
                <CopyButton text={userRecord.clientId} name="Client ID" />
              </dd>
            </div>
            {userRecord.clientUrl && (
              <div className="grid grid-cols-2 gap-4">
                <dt className="text-stone-500 dark:text-zinc-500">Client URL</dt>
                <dd>
                  <Button asChild variant="link" className="text-md -mx-4 -my-2 font-normal">
                    <Link href={userRecord.clientUrl} target="_blank" rel="noopener noreferrer">
                      {formatLink(userRecord.clientUrl)} <ExternalLink className="h-4 w-4" />
                    </Link>
                  </Button>
                </dd>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <dt className="text-stone-500 dark:text-zinc-500">Created At</dt>
              <dd>
                <DateFull date={userRecord.createdAt} />
              </dd>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <dt className="text-stone-500 dark:text-zinc-500">Updated At</dt>
              <dd>
                <DateFull date={userRecord.updatedAt} />
              </dd>
            </div>
          </dl>
        </SectionContent>
      </Section>
      {userRecord.stripeAccountId && (
        <>
          <Separator className="my-2" />
          <StripeAccount clerkOrganizationId={clerkOrganizationId} stripeAccountId={userRecord.stripeAccountId} />
        </>
      )}
      {metadata && (
        <>
          <Separator className="my-2" />
          <Section>
            <SectionTitle>Metadata</SectionTitle>
            <SectionContent>
              <dl className="grid gap-3">
                {Object.entries(metadata).map(([key, value]) => (
                  <div key={key} className="grid grid-cols-2 gap-4">
                    <dt className="font-mono text-stone-500 dark:text-zinc-500">{key}</dt>
                    <dd>
                      <CodeInline>{value}</CodeInline>
                    </dd>
                  </div>
                ))}
              </dl>
            </SectionContent>
          </Section>
        </>
      )}
      {userRecord.actions.length > 0 && (
        <>
          <Separator className="my-2" />
          <Section>
            <SectionTitle>Actions</SectionTitle>
            <SectionContent>
              <ActionsTable clerkOrganizationId={clerkOrganizationId} actions={userRecord.actions} />
            </SectionContent>
          </Section>
        </>
      )}
      <Separator className="my-2" />
      <Section>
        <SectionTitle>Records</SectionTitle>
        <SectionContent>
          <RecordsTable clerkOrganizationId={clerkOrganizationId} userRecordId={userRecord.id} />
        </SectionContent>
      </Section>
    </div>
  );
}
