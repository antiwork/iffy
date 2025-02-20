import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { UserDetail } from "../types";
import { formatUserActionStatus, formatVia } from "@/lib/badges";
import { Date } from "@/components/date";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function ActionsTable({ actions }: Pick<UserDetail, "actions">) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="px-2 py-1">Status</TableHead>
          <TableHead className="px-2 py-1">Via</TableHead>
          <TableHead className="px-2 py-1">Appeal</TableHead>
          <TableHead className="px-2 py-1">Created At</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {actions.map((action) => {
          return (
            <TableRow key={action.id}>
              <TableCell className="px-2 py-1">
                <div className="py-1">{formatUserActionStatus(action)}</div>
              </TableCell>
              <TableCell className="px-2 py-1">
                <div className="py-1">{formatVia(action)}</div>
              </TableCell>
              <TableCell className="px-2 py-1">
                <div className="py-1">
                  {action.appeal ? (
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
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
