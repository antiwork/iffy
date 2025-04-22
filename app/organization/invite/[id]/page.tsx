import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { notFound, redirect } from "next/navigation";
import db from "@/db";
import { and, eq } from "drizzle-orm";
import { invitations } from "@/db/tables";
import { auth } from "@/services/auth";
import { env } from "@/lib/env";
import { acceptInvitation } from "../actions";

export default async function InvitePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();

  if (!session.userId) {
    redirect("/sign-in?redirect_url=" + env.NEXT_PUBLIC_BETTER_AUTH_URL + "/organization/invite/" + (await params).id);
  }

  const invitation = await db.query.invitations.findFirst({
    where: and(eq(invitations.id, (await params).id), eq(invitations.email, session.userEmail)),
    with: {
      organization: true,
      inviter: true,
    },
  });

  if (!invitation) {
    notFound();
  }

  const { organization, inviter } = invitation;

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={organization.logo ?? undefined} alt={organization.name} />
              <AvatarFallback>{organization.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{organization.name}</CardTitle>
              <CardDescription>Invited by {inviter.name}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-stone-500">You&apos;ve been invited to join as:</p>
            <Badge variant="secondary" className="text-sm">
              {invitation.role}
            </Badge>
          </div>
          <p className="text-sm text-stone-500">
            By accepting this invitation, you&apos;ll gain access to {organization.name}&apos;s workspace on Iffy.
          </p>
        </CardContent>
        <CardFooter>
          <form
            className="w-full"
            action={async (formData: FormData) => {
              "use server";
              await acceptInvitation({ invitationId: formData.get("invitationId") as string });
            }}
          >
            <input type="hidden" name="invitationId" value={invitation.id} />
            <Button type="submit" className="w-full">
              Accept invitation
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
