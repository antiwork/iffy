import db from "@/db";

export async function getActiveOrganization(endUserId: string) {
  // Query the database to find the user's active organization
  const userMember = await db.query.member.findFirst({
    where: {
      endUserId
    },
    with: {
      organization: true,
    },
  });

  if (!userMember?.organization) {
    throw new Error("No active organization found");
  }

  return userMember.organization;
}
