import { Separator } from "@/components/ui/separator";
import { formatModerationStatus, formatVia } from "@/lib/badges";
import { DateFull } from "@/components/date";
import { Header, HeaderContent, HeaderPrimary, HeaderSecondary } from "@/components/sheet/header";
import { Section, SectionContent, SectionTitle } from "@/components/sheet/section";
import Link from "next/link";
import { FlaskConical } from "lucide-react";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { formatClerkUser } from "@/lib/clerk";
import * as schema from "@/db/schema";
import { eq, and } from "drizzle-orm";
import db from "@/db";
import { notFound } from "next/navigation";

export async function ModerationDetail({ organizationId, id }: { organizationId: string; id: string }) {
  const moderation = await db.query.moderations.findFirst({
    where: and(eq(schema.moderations.organizationId, organizationId), eq(schema.moderations.id, id)),
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
      record: true,
    },
  });

  if (!moderation) {
    return notFound();
  }

  const rules = moderation.moderationsToRules.map((moderationToRule) => moderationToRule.rule);

  return (
    <div>
      <Header>
        <HeaderContent>
          <HeaderPrimary>
            <Link href={`/dashboard/records/${moderation.record.id}`} className="hover:underline">
              {moderation.record.name}
            </Link>
          </HeaderPrimary>
          <HeaderSecondary>{moderation.record.entity}</HeaderSecondary>
        </HeaderContent>
      </Header>
      <Separator className="my-2" />
      <Section>
        <SectionTitle>Moderation details</SectionTitle>
        <SectionContent>
          <dl className="grid gap-3">
            <div className="grid grid-cols-2 gap-4">
              <dt className="text-stone-500 dark:text-zinc-500">Status</dt>
              <dd className="flex items-center gap-2">
                {formatModerationStatus(moderation)}
                {moderation.testMode && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <FlaskConical className="h-4 w-4 text-stone-500 dark:text-zinc-500" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Test mode</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </dd>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <dt className="text-stone-500 dark:text-zinc-500">Via</dt>
              <dd>{formatVia(moderation)}</dd>
            </div>
            {moderation.clerkUserId && (
              <div className="grid grid-cols-2 gap-4">
                <dt className="text-stone-500 dark:text-zinc-500">By</dt>
                <dd>{await formatClerkUser(moderation.clerkUserId)}</dd>
              </div>
            )}
            {rules && rules.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                <dt className="text-stone-500 dark:text-zinc-500">Rules</dt>
                <dd>{rules.map((rule) => (rule.preset ? rule.preset.name : rule.name)).join(", ")}</dd>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <dt className="text-stone-500 dark:text-zinc-500">Reasoning</dt>
              <dd>{moderation.reasoning}</dd>
            </div>
            {moderation.tokens > 0 && (
              <div className="grid grid-cols-2 gap-4">
                <dt className="text-stone-500 dark:text-zinc-500"># of Tokens</dt>
                <dd>{moderation.tokens}</dd>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <dt className="text-stone-500 dark:text-zinc-500">Created at</dt>
              <dd>
                <DateFull date={moderation.createdAt} />
              </dd>
            </div>
          </dl>
        </SectionContent>
      </Section>
    </div>
  );
}
