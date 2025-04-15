import SlackContext from "@/app/api/v1/slack/agent/context";

/**
 * Get information about a user
 */
async function getUserInfo({ userId, ctx }: { userId: string; ctx: SlackContext<"app_mention"> }) {
  const user = await ctx.findUserById(userId);
  if (!user) {
    return { result: `User with ID ${userId} not found` };
  }

  return {
    result: JSON.stringify({
      username: user.username,
      name: user.name,
      email: user.email,
      iffyId: user.id,
      clientId: user.clientId,
      orgId: user.clerkOrganizationId,
      protected: user.protected,
      actionStatus: user.actionStatus,
      actionStatusCreatedAt: user.actionStatusCreatedAt,
      // slackId: user.slackId, // TODO:??
    }),
  };
}

export default getUserInfo;
