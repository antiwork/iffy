import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { UserDetail } from "../types";
import { formatUserActionStatus, formatVia } from "@/lib/badges";
import { Date, DateFull } from "@/components/date";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { findOrCreateOrganization } from "@/services/organizations";

export async function ActionsTable({
  clerkOrganizationId,
  actions,
}: {
  clerkOrganizationId: string;
  actions: UserDetail["actions"];
}) {
  const latestAction = actions[0];
  const organization = await findOrCreateOrganization(clerkOrganizationId);
  const appealsEnabled = organization.appealsEnabled;

  return (
    <div>
      {latestAction && (
        <div className="mb-4">
          <div className="mb-2 text-sm font-medium text-stone-500 dark:text-zinc-500">Latest action</div>
          <div className="rounded-lg border p-4">
            <dl className="grid gap-3">
              <div className="grid grid-cols-2 gap-4">
                <dt className="text-stone-500 dark:text-zinc-500">Status</dt>
                <dd>{formatUserActionStatus({ status: latestAction.status })}</dd>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <dt className="text-stone-500 dark:text-zinc-500">Via</dt>
                <dd>{formatVia(latestAction)}</dd>
              </div>
              {latestAction.reasoning && (
                <div className="grid grid-cols-2 gap-4">
                  <dt className="text-stone-500 dark:text-zinc-500">Reasoning</dt>
                  <dd>{latestAction.reasoning}</dd>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <dt className="text-stone-500 dark:text-zinc-500">Created at</dt>
                <dd>
                  <DateFull date={latestAction.createdAt} />
                </dd>
              </div>
              {latestAction.appeal && appealsEnabled && (
                <div className="grid grid-cols-2 gap-4">
                  <dt className="text-stone-500 dark:text-zinc-500">Appeal</dt>
                  <dd>
                    <Button asChild variant="link" className="h-6 p-0 text-sm">
                      <Link href={`/dashboard/inbox/${latestAction.appeal.id}`}>View appeal</Link>
                    </Button>
                  </dd>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <dt></dt>
                <dd>
                  <Button asChild variant="link" className="h-6 p-0 text-sm">
                    <Link href={`/dashboard/users/${latestAction.userId}/actions/${latestAction.id}`}>
                      View action details
                    </Link>
                  </Button>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      )}

      {actions.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-2 py-1">Status</TableHead>
              <TableHead className="px-2 py-1">Via</TableHead>
              <TableHead className="px-2 py-1">Appeal</TableHead>
              <TableHead className="px-2 py-1">Created at</TableHead>
              <TableHead className="px-2 py-1"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {actions.map((action) => (
              <TableRow key={action.id}>
                <TableCell className="px-2 py-1">
                  <div className="py-1">{formatUserActionStatus({ status: action.status })}</div>
                </TableCell>
                <TableCell className="px-2 py-1">
                  <div className="py-1">{formatVia(action)}</div>
                </TableCell>
                <TableCell className="px-2 py-1">
                  <div className="py-1">
                    {action.appeal && appealsEnabled ? (
                      <Button asChild variant="link" className="text-md -mx-4 -my-2 block w-full truncate font-normal">
                        <Link href={`/dashboard/inbox/${action.appeal.id}`}>Appeal</Link>
                      </Button>
                    ) : (
                      "—"
                    )}
                  </div>
                </TableCell>
                <TableCell className="px-2 py-1">
                  <div className="py-1">
                    <Date date={action.createdAt} />
                  </div>
                </TableCell>
                <TableCell className="px-2 py-1">
                  <Button asChild variant="link" className="text-md -mx-4 -my-2 block w-full truncate font-normal">
                    <Link href={`/dashboard/users/${action.userRecordId}/actions/${action.id}`}>View details</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
