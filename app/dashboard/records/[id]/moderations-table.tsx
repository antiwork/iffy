import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Date } from "@/components/date";
import { formatModerationStatus, formatVia } from "@/lib/badges";
import type { Record } from "../types";

export function ModerationsTable({ moderations }: { moderations: Record["moderations"] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="px-2 py-1">Status</TableHead>
          <TableHead className="px-2 py-1">Via</TableHead>
          <TableHead className="px-2 py-1">Rules</TableHead>
          <TableHead className="px-2 py-1">Created At</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {moderations.map((moderation) => {
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
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
