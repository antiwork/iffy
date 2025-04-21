import SlackContext from "../context";
import findThirdPartyUserById from "./utils";

/**
 * Get information about a user
 */
async function getUserInfo(this: SlackContext<"message">, { userId }: { userId: string }) {
  const isAuthorized = await this.checkPayloadUserIsAdmin();
  if (!isAuthorized) {
    return {
      result: "You are not authorized to perform this action.",
    };
  }

  const user = await findThirdPartyUserById(userId);
  if (!user) {
    console.log(`User with ID ${userId} not found.`);
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
    }),
  };
}

export default getUserInfo;
