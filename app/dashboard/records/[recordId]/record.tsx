import { Separator } from "@/components/ui/separator";
import { formatModerationStatus, formatRecordStatus, formatUserStatus, formatVia } from "@/lib/badges";
import { ExternalLink, FlaskConical, FlaskConicalOff, ShieldCheck, ShieldOff } from "lucide-react";
import { RecordImages } from "./record-images";
import { Code, CodeInline } from "@/components/code";
import { Header, HeaderContent, HeaderPrimary, HeaderSecondary, HeaderActions } from "@/components/sheet/header";
import { Section, SectionContent, SectionTitle } from "@/components/sheet/section";
import { DateFull } from "@/components/date";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ActionMenu } from "../action-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatUserCompact } from "@/lib/user";
import { cn } from "@/lib/utils";
import { formatLink } from "@/lib/url";
import { ModerationsTable } from "./moderations-table";
import { CopyButton } from "@/components/copy-button";

import * as schema from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import db from "@/db";
import { parseMetadata } from "@/services/metadata";

export async function RecordDetail({ organizationId, id }: { organizationId: string; id: string }) {
  const record = await db.query.records.findFirst({
    where: and(eq(schema.records.organizationId, organizationId), eq(schema.records.id, id)),
    with: {
      moderations: {
        orderBy: [desc(schema.moderations.createdAt)],
        with: {
          moderationsToRules: {
            with: {
              rule: {
                with: {
                  preset: true,
                },
              },
            },
          },
        },
      },
      user: true,
    },
  });

  if (!record) {
    return null;
  }

  const metadata = record.metadata ? parseMetadata(record.metadata) : undefined;

  const rules = record.moderations[0]?.moderationsToRules.map((moderationToRule) => moderationToRule.rule);

  return (
    <div>
      <Header>
        <HeaderContent>
          <HeaderPrimary className={cn(record.deletedAt && "line-through")}>{record.name}</HeaderPrimary>
          <HeaderSecondary>{record.entity}</HeaderSecondary>
        </HeaderContent>
        <HeaderActions className="flex items-center gap-4">
          {record.protected ? (
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
          {record.moderations[0]?.testMode ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <FlaskConical className="h-4 w-4 text-stone-500 dark:text-zinc-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Test Mode On</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <FlaskConicalOff className="h-4 w-4 text-stone-300 dark:text-zinc-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Test Mode Off</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {formatRecordStatus(record)}
          {!record.deletedAt && <ActionMenu record={record} />}
        </HeaderActions>
      </Header>
      <Separator className="my-2" />
      <Section>
        <SectionTitle>Details</SectionTitle>
        <SectionContent>
          <dl className="grid gap-3">
            {record.user && (
              <div className="grid grid-cols-2 gap-4">
                <dt className="text-stone-500 dark:text-zinc-500">User</dt>
                <dd className="flex items-center gap-4">
                  <Button asChild variant="link" className="text-md -mx-4 -my-2 font-normal">
                    <Link href={`/dashboard/users/${record.user.id}`}>{formatUserCompact(record.user)}</Link>
                  </Button>
                  {formatUserStatus(record.user)}
                </dd>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <dt className="text-stone-500 dark:text-zinc-500">Client ID</dt>
              <dd className="flex items-center gap-2 break-words">
                <CodeInline>{record.clientId}</CodeInline>
                <CopyButton text={record.clientId} name="Client ID" />
              </dd>
            </div>
            {record.clientUrl && (
              <div className="grid grid-cols-2 gap-4">
                <dt className="text-stone-500 dark:text-zinc-500">Client URL</dt>
                <dd>
                  <Button asChild variant="link" className="text-md -mx-4 -my-2 font-normal">
                    <Link href={record.clientUrl} target="_blank" rel="noopener noreferrer">
                      {formatLink(record.clientUrl)} <ExternalLink className="h-4 w-4" />
                    </Link>
                  </Button>
                </dd>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <dt className="text-stone-500 dark:text-zinc-500">Created At</dt>
              <dd>
                <DateFull date={record.createdAt} />
              </dd>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <dt className="text-stone-500 dark:text-zinc-500">Updated At</dt>
              <dd>
                <DateFull date={record.updatedAt} />
              </dd>
            </div>
            {record.deletedAt && (
              <div className="grid grid-cols-2 gap-4">
                <dt className="text-stone-500 dark:text-zinc-500">Deleted At</dt>
                <dd>
                  <DateFull date={record.deletedAt} />
                </dd>
              </div>
            )}
          </dl>
        </SectionContent>
      </Section>
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
      <Separator className="my-2" />
      <Section>
        <SectionTitle>Content</SectionTitle>
        <SectionContent className="grid gap-3">
          <dl className="grid gap-3">
            {record.externalUrls && record.externalUrls.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                <dt className="text-stone-500 dark:text-zinc-500">External Links</dt>
                <dd>
                  {record.externalUrls.map((url, index) => (
                    <Button key={index} asChild variant="link" className="text-md -mx-4 -my-2 font-normal">
                      <Link href={url} target="_blank" rel="noopener noreferrer">
                        {formatLink(url)} <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  ))}
                </dd>
              </div>
            )}
          </dl>
          <Code>{record.text}</Code>
          {record.imageUrls.length > 0 ? <RecordImages imageUrls={record.imageUrls} /> : null}
        </SectionContent>
      </Section>
      {record.moderations.length > 0 && (
        <>
          <Separator className="my-2" />
          <Section>
            <SectionTitle>Moderations</SectionTitle>
            <SectionContent>
              <ModerationsTable moderations={record.moderations} />
            </SectionContent>
          </Section>
        </>
      )}
    </div>
  );
}
