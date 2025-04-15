import findUserById from "./utils";

/**
 * Get information about a user
 */
async function getUserInfo({ userId }: { userId: string }) {
  const user = await findUserById(userId);
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
