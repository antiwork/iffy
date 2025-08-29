import { validateAppealToken } from "@/services/appeals";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Date } from "@/components/date";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import db from "@/db";
import * as schema from "@/db/schema";
import { AppealForm } from "./form";
import { Separator } from "@/components/ui/separator";
import { findOrCreateOrganization } from "@/services/organizations";
import { formatRecordStatus, formatUserActionStatus } from "@/lib/badges";
import { desc, eq, and, isNull } from "drizzle-orm";
import { formatRecord } from "@/lib/record";

// Ensure page is never cached
export const dynamic = "force-dynamic";

export default async function Page(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams;
  const { token } = searchParams;
  if (!token || typeof token !== "string") {
    return redirect("/");
  }

  const [isValid, userRecordId] = validateAppealToken(token);
  if (!isValid) {
    return redirect("/");
  }

  const userRecord = await db.query.userRecords.findFirst({
    where: eq(schema.userRecords.id, userRecordId),
    with: {
      actions: {
        orderBy: [desc(schema.userActions.createdAt)],
        limit: 1,
        with: {
          appeal: true,
        },
      },
    },
  });

  if (!userRecord) {
    return redirect("/");
  }

  const latestAction = userRecord.actions[0];
  const latestAppeal = latestAction?.appeal;

  const { clerkOrganizationId } = userRecord;
  const { appealsEnabled } = await findOrCreateOrganization(clerkOrganizationId);
  if (!appealsEnabled) {
    return redirect("/");
  }

  if (latestAction?.status === "Banned") {
    return (
      <div className="flex min-h-screen w-full items-center justify-center p-16">
        <Card className="w-full max-w-(--breakpoint-sm)">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="text-lg lowercase">{userRecord.email}</CardTitle>
              <CardDescription>Your account has been banned from Gumroad.</CardDescription>
            </div>
            <div>{formatUserActionStatus({ status: "Banned" })}</div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (latestAction?.status === "Compliant") {
    return (
      <div className="flex min-h-screen w-full items-center justify-center p-16">
        <Card className="w-full max-w-(--breakpoint-sm)">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="text-lg lowercase">{userRecord.email}</CardTitle>
              <CardDescription>Your account is compliant with Gumroad&apos;s terms of service.</CardDescription>
            </div>
            <div>{formatUserActionStatus({ status: "Compliant" })}</div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (latestAppeal) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center p-16">
        <Card className="w-full max-w-(--breakpoint-sm)">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="text-lg lowercase">{userRecord.email}</CardTitle>
              <CardDescription>Your appeal has been submitted.</CardDescription>
            </div>
            <div>{formatUserActionStatus({ status: "Suspended" })}</div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const records = await db.query.records.findMany({
    where: and(
      eq(schema.records.clerkOrganizationId, clerkOrganizationId),
      eq(schema.records.userRecordId, userRecord.id),
      isNull(schema.records.deletedAt),
    ),
    with: {
      moderations: {
        limit: 1,
        orderBy: [desc(schema.moderations.createdAt)],
      },
    },
  });

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-16">
      <Card className="w-full max-w-(--breakpoint-sm)">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-lg lowercase">{userRecord.email}</CardTitle>
            <CardDescription>
              Please update the following products to be compliant with Gumroad&apos;s terms of service.
            </CardDescription>
          </div>
          <div>{formatUserActionStatus({ status: "Suspended" })}</div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableBody>
              {records.map((record) => {
                const badge = formatRecordStatus(record);
                const latestModeration = record.moderations[0];
                return (
                  <>
                    <TableRow key={record.id}>
                      <TableCell>
                        <div className="font-medium">{formatRecord(record)}</div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="secondary">
                          <span>{record.entity}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>{badge}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Date date={record.updatedAt} />
                      </TableCell>
                    </TableRow>
                    {latestModeration?.reasoning && (
                      <TableRow key={`${record.id}-reasoning`}>
                        <TableCell colSpan={4} className="pt-0 pb-3">
                          <div className="text-sm text-stone-600 dark:text-zinc-400">
                            <span className="font-medium">Reason: </span>
                            {latestModeration.reasoning}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
        <Separator />
        <CardFooter className="block px-6 py-4">
          <AppealForm token={token} />
        </CardFooter>
      </Card>
    </div>
  );
}
