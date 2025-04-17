import { Separator } from "@/components/ui/separator";
import { formatUser, getUserSecondaryParts } from "@/lib/user";
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

export async function UserDetail({ authOrganizationId, id }: { authOrganizationId: string; id: string }) {
  const user = await db.query.endUsers.findFirst({
    where: and(eq(schema.endUsers.authOrganizationId, authOrganizationId), eq(schema.endUsers.id, id)),
    with: {
      actions: {
        orderBy: [desc(schema.userActions.createdAt)],
        with: {
          appeal: true,
        },
      },
    },
  });

  if (!user) {
    return notFound();
  }

  const metadata = user.metadata ? parseMetadata(user.metadata) : undefined;

  return (
    <div>
      <Header>
        <HeaderContent>
          <HeaderPrimary>{formatUser(user)}</HeaderPrimary>
          <HeaderSecondary>
            {getUserSecondaryParts(user).map((part) => (
              <div key={part}>{part}</div>
            ))}
          </HeaderSecondary>
        </HeaderContent>
        <HeaderActions className="flex items-center gap-4">
          {user.protected ? (
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
          {formatUserActionStatus({ status: user.actionStatus ?? "Compliant" })}
          <ActionMenu user={user} />
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
                <CodeInline>{user.clientId}</CodeInline>
                <CopyButton text={user.clientId} name="Client ID" />
              </dd>
            </div>
            {user.clientUrl && (
              <div className="grid grid-cols-2 gap-4">
                <dt className="text-stone-500 dark:text-zinc-500">Client URL</dt>
                <dd>
                  <Button asChild variant="link" className="text-md -mx-4 -my-2 font-normal">
                    <Link href={user.clientUrl} target="_blank" rel="noopener noreferrer">
                      {formatLink(user.clientUrl)} <ExternalLink className="h-4 w-4" />
                    </Link>
                  </Button>
                </dd>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <dt className="text-stone-500 dark:text-zinc-500">Created At</dt>
              <dd>
                <DateFull date={user.createdAt} />
              </dd>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <dt className="text-stone-500 dark:text-zinc-500">Updated At</dt>
              <dd>
                <DateFull date={user.updatedAt} />
              </dd>
            </div>
          </dl>
        </SectionContent>
      </Section>
      {user.stripeAccountId && (
        <>
          <Separator className="my-2" />
          <StripeAccount authOrganizationId={authOrganizationId} stripeAccountId={user.stripeAccountId} />
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
      {user.actions.length > 0 && (
        <>
          <Separator className="my-2" />
          <Section>
            <SectionTitle>Actions</SectionTitle>
            <SectionContent>
              <ActionsTable authOrganizationId={authOrganizationId} actions={user.actions} />
            </SectionContent>
          </Section>
        </>
      )}
      <Separator className="my-2" />
      <Section>
        <SectionTitle>Records</SectionTitle>
        <SectionContent>
          <RecordsTable authOrganizationId={authOrganizationId} endUserId={user.id} />
        </SectionContent>
      </Section>
    </div>
  );
}
