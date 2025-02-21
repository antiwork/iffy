import { Separator } from "@/components/ui/separator";
import { formatUser, getUserSecondaryParts } from "@/lib/record-user";
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
import { formatDateFull } from "@/lib/date";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ActionsTable } from "./actions-table";
import { RecordsTable } from "./records-table";
import { CopyButton } from "@/components/copy-button";
import { eq, and, desc } from "drizzle-orm";
import { StripeAccount } from "./stripe-account";
import { notFound } from "next/navigation";
import { UsersCollectionNavigation } from "./users-collection-navigation";

export async function UserDetail({
  clerkOrganizationId,
  id,
  isModal = false,
}: {
  clerkOrganizationId: string;
  id: string;
  isModal: boolean;
}) {
  const user = await db.query.users.findFirst({
    where: and(eq(schema.users.clerkOrganizationId, clerkOrganizationId), eq(schema.users.id, id)),
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

  return (
    <div className="relative">
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
                  <p>Protected User</p>
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
                  <p>Test Mode</p>
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
                      Link <ExternalLink className="h-4 w-4" />
                    </Link>
                  </Button>
                </dd>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <dt className="text-stone-500 dark:text-zinc-500">Created At</dt>
              <dd>{formatDateFull(user.createdAt)}</dd>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <dt className="text-stone-500 dark:text-zinc-500">Updated At</dt>
              <dd>{formatDateFull(user.updatedAt)}</dd>
            </div>
          </dl>
        </SectionContent>
      </Section>
      {user.stripeAccountId && (
        <>
          <Separator className="my-2" />
          <StripeAccount clerkOrganizationId={clerkOrganizationId} stripeAccountId={user.stripeAccountId} />
        </>
      )}
      {user.actions[0] && (
        <>
          <Separator className="my-2" />
          <Section>
            <SectionTitle>Latest User Action</SectionTitle>
            <SectionContent>
              <dl className="grid gap-3">
                <div className="grid grid-cols-2 gap-4">
                  <dt className="text-stone-500 dark:text-zinc-500">Status</dt>
                  <dd>{formatUserActionStatus(user.actions[0])}</dd>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <dt className="text-stone-500 dark:text-zinc-500">Via</dt>
                  <dd>{formatVia(user.actions[0])}</dd>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <dt className="text-stone-500 dark:text-zinc-500">Created At</dt>
                  <dd>{formatDateFull(user.actions[0].createdAt)}</dd>
                </div>
                {user.actions[0].appeal && (
                  <div className="grid grid-cols-2 gap-4">
                    <dt className="text-stone-500 dark:text-zinc-500">Appeal</dt>
                    <dd>
                      <Button asChild variant="link" className="text-md -mx-4 -my-2 block w-full truncate font-normal">
                        <Link href={`/dashboard/inbox/${user.actions[0].appeal.id}`}>Appeal</Link>
                      </Button>
                    </dd>
                  </div>
                )}
              </dl>
            </SectionContent>
          </Section>
        </>
      )}
      {user.actions.length > 1 && (
        <>
          <Separator className="my-2" />
          <Section>
            <SectionTitle>All Actions</SectionTitle>
            <SectionContent>
              <ActionsTable actions={user.actions} />
            </SectionContent>
          </Section>
        </>
      )}
      <Separator className="my-2" />
      <Section>
        <SectionTitle>Records</SectionTitle>
        <SectionContent>
          <RecordsTable clerkOrganizationId={clerkOrganizationId} userId={user.id} />
        </SectionContent>
      </Section>
      {isModal && <UsersCollectionNavigation currentUserId={id} />}
    </div>
  );
}
