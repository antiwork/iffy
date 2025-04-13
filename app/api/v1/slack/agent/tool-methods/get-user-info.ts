import SlackContext from "@/app/api/v1/slack/agent/context";
import db, { schema } from "@/db";
import { and, eq } from "drizzle-orm";

/**
 * Get information about a user
 */
async function getUserInfo({ userId, ctx }: { userId: string; ctx: SlackContext<"app_mention"> }) {
  const { payload } = ctx;
  const { team } = payload.event;
  if (!team) {
    throw new Error("No team ID found in the payload");
  }
  const orgDetails = await ctx.getOrganizationDetails(team);
  if (!orgDetails) {
    throw new Error("No organization found");
  }
  const {
    organization: { clerkOrganizationId },
  } = orgDetails;

  // // Find the user by clientId
  const user = await db.query.users.findFirst({
    where: and(eq(schema.users.clerkOrganizationId, clerkOrganizationId), eq(schema.users.clientId, userId)),
    with: {
      records: true,
    },
  });

  if (!user) {
    return { text: `User with ID ${userId} not found` };
  }

  // Format user information
  const userInfo = [
    `*User ID*: ${user.clientId}`,
    `*Status*: ${user.actionStatus || "Compliant"}`,
    `*Protected*: ${user.protected ? "Yes" : "No"}`,
    `*Email*: ${user.email || "Not provided"}`,
    `*Name*: ${user.name || "Not provided"}`,
    `*Username*: ${user.username || "Not provided"}`,
    `*Created At*: ${user.createdAt.toISOString().split("T")[0]}`,
    `*Flagged Records Count*: ${user.flaggedRecordsCount}`,
  ];

  // Add recent flagged records if any
  if (user.records.length > 0) {
    userInfo.push("\n*Recent Flagged Records*:");
    user.records.forEach((record) => {
      userInfo.push(
        `• ${record.name || record.id}: ${record.entity} ${record.clientUrl ? `- <${record.clientUrl}|Link>` : ""}`,
      );
    });
  }

  // Add metadata if available
  if (user.metadata) {
    userInfo.push("\n*Metadata*:");
    for (const [key, value] of Object.entries(user.metadata)) {
      userInfo.push(`• ${key}: ${value}`);
    }
  }

  return { result: userInfo.join("\n") };
}

export default getUserInfo;
