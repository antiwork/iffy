import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Date, DateFull } from "@/components/date";
import type { Record } from "../types";
import { formatModerationStatus, formatVia } from "@/lib/badges";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function ModerationsTable({ moderations }: { moderations: Record["moderations"] }) {
  if (!moderations?.length) return null;

  const latestModeration = moderations[0]!;
  const otherModerations = moderations.slice(1);

  const latestRules = latestModeration.moderationsToRules.map((moderationToRule) => moderationToRule.rule);
  const latestRuleNames = latestRules.map((rule) => (rule.preset ? rule.preset.name : rule.name)).join(", ");
  return (
    <div>
      <div className="mb-4">
        <div className="mb-2 text-sm font-medium text-stone-500 dark:text-zinc-500">Latest moderation</div>
        <div className="rounded-lg border p-4">
          <dl className="grid gap-3">
            <div className="grid grid-cols-2 gap-4">
              <dt className="text-stone-500 dark:text-zinc-500">Status</dt>
              <dd>{formatModerationStatus(latestModeration)}</dd>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <dt className="text-stone-500 dark:text-zinc-500">Via</dt>
              <dd>{formatVia(latestModeration)}</dd>
            </div>
            {latestRuleNames && (
              <div className="grid grid-cols-2 gap-4">
                <dt className="text-stone-500 dark:text-zinc-500">Rules</dt>
                <dd>{latestRuleNames}</dd>
              </div>
            )}
            {latestModeration.reasoning && (
              <div className="grid grid-cols-2 gap-4">
                <dt className="text-stone-500 dark:text-zinc-500">Reasoning</dt>
                <dd>{latestModeration.reasoning}</dd>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <dt className="text-stone-500 dark:text-zinc-500">Created at</dt>
              <dd>
                <DateFull date={latestModeration.createdAt} />
              </dd>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <dt></dt>
              <dd>
                <Button asChild variant="link" className="h-6 p-0 text-sm">
                  <Link href={`/dashboard/moderations/${latestModeration.id}`}>View details</Link>
                </Button>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {otherModerations.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-2 py-1">Status</TableHead>
              <TableHead className="px-2 py-1">Via</TableHead>
              <TableHead className="px-2 py-1">Rules</TableHead>
              <TableHead className="px-2 py-1">Created at</TableHead>
              <TableHead className="px-2 py-1"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {otherModerations.map((moderation) => {
              const rules = moderation.moderationsToRules.map((moderationToRule) => moderationToRule.rule);
              const names = rules.map((rule) => (rule.preset ? rule.preset.name : rule.name)).join(", ");

              return (
                <TableRow key={moderation.id}>
                  <TableCell className="px-2 py-1">
                    <div className="py-1">{formatModerationStatus(moderation)}</div>
                  </TableCell>
                  <TableCell className="px-2 py-1">
                    <div className="py-1">{formatVia(moderation)}</div>
                  </TableCell>
                  <TableCell className="px-2 py-1">
                    <div className="py-1">{names}</div>
                  </TableCell>
                  <TableCell className="px-2 py-1">
                    <div className="py-1">
                      <Date date={moderation.createdAt} />
                    </div>
                  </TableCell>
                  <TableCell className="px-2 py-1">
                    <Button asChild variant="link" className="text-md -mx-4 -my-2 block w-full truncate font-normal">
                      <Link href={`/dashboard/moderations/${moderation.id}`}>View details</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
