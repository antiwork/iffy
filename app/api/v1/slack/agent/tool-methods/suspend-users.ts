import { createUserAction } from "@/services/user-actions";
import findThirdPartyUserById from "./utils";
import SlackContext from "../context";

/**
 * Suspend one or more users
 */
async function suspendUsers(
  this: SlackContext<"message">,
  { userIds, reasoning }: { userIds: string[]; reasoning: string },
) {
  if (!(await this.checkPayloadUserIsAdmin())) {
    return {
      result: "You are not authorized to perform this action.",
    };
  }

  const senderClerkId = this.senderDetails?.clerkUserId;
  if (!senderClerkId) {
    return {
      result: "Admin Clerk User ID Not Found: Please complete the Iffy OAuth setup.",
    };
  }

  if (!userIds || userIds.length === 0) {
    return {
      result: "No user IDs provided.",
    };
  }

  if (!reasoning) {
    return {
      result: "No reasoning provided.",
    };
  }

  const results = await Promise.allSettled(
    userIds.map(async (userId) => {
      const user = await findThirdPartyUserById(userId);

      if (!user) {
        throw new Error(`User with ID ${userId} not found`);
      }

      if (user.actionStatus === "Suspended") {
        return { id: userId, status: "already suspended" };
      }

      if (user.actionStatus === "Banned") {
        return { id: userId, status: "banned (cannot suspend)" };
      }

      if (user.protected) {
        return { id: userId, status: "protected (cannot suspend)" };
      }

      await createUserAction({
        clerkOrganizationId: this.organization.clerkOrganizationId,
        clerkUserId: senderClerkId,
        userId: user.id,
        status: "Suspended",
        via: "Manual",
        reasoning,
      });

      return { id: userId, status: "suspended" };
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
