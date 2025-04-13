import SlackContext from "@/app/api/v1/slack/agent/context";
import db, { schema } from "@/db";
import { and, eq } from "drizzle-orm";
import { createUserAction } from "@/services/user-actions";

/**
 * Suspend one or more users
 */
async function suspendUsers({
  userIds,
  reasoning,
  ctx,
}: {
  userIds: string[];
  reasoning: string;
  ctx: SlackContext<"app_mention">;
}) {
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

  const results = await Promise.allSettled(
    userIds.map(async (clientId) => {
      // Find the user by clientId
      const user = await db.query.users.findFirst({
        where: and(eq(schema.users.clerkOrganizationId, clerkOrganizationId), eq(schema.users.clientId, clientId)),
      });

      if (!user) {
        throw new Error(`User with ID ${clientId} not found`);
      }

      // Check if user is already suspended or banned
      if (user.actionStatus === "Suspended") {
        return { id: clientId, status: "already suspended" };
      }

      if (user.actionStatus === "Banned") {
        return { id: clientId, status: "banned (cannot suspend)" };
      }

      // Check if user is protected
      if (user.protected) {
        return { id: clientId, status: "protected (cannot suspend)" };
      }

      // Suspend the user
      await createUserAction({
        clerkOrganizationId,
        clerkUserId: clientId,
        userId: user.id,
        status: "Suspended",
        via: "Manual",
        reasoning,
      });

      return { id: clientId, status: "suspended" };
    }),
  );

  const formatted = results
    .map((result, index) => {
      if (result.status === "fulfilled") {
        return `• ${result.value.id}: ${result.value.status}`;
      } else {
        return `• ${userIds[index]}: failed (${result.reason.message})`;
      }
    })
    .join("\n");

  return {
    result: `Suspension results for ${userIds.length} user(s):\n${formatted}`,
  };
}

export default suspendUsers;
