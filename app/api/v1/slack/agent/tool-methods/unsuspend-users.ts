import { createUserAction } from "@/services/user-actions";
import findThirdPartyUserById from "./utils";
import SlackContext from "../context";

/**
 * Unsuspend one or more users
 */
async function unsuspendUsers(
  this: SlackContext<"message">,
  { reasoning, userIds }: { userIds: string[]; reasoning: string },
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
        throw new Error(`User ${userId} not found`);
      }

      if (user.actionStatus === "Compliant") {
        return { id: userId, status: "already compliant" };
      }

      if (user.actionStatus === "Banned") {
        return { id: userId, status: "banned (cannot unsuspend)" };
      }

      await createUserAction({
        clerkOrganizationId: this.organization.clerkOrganizationId,
        clerkUserId: senderClerkId,
        userRecordId: user.id,
        status: "Compliant",
        via: "Manual",
        reasoning,
      });

      return { id: userId, status: "unsuspended" };
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
    result: `Unsuspension results for ${userIds.length} user(s):\n${formatted}`,
  };
}

export default unsuspendUsers;
