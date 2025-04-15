import { createUserAction } from "@/services/user-actions";
import findUserById from "./utils";

/**
 * Unsuspend one or more users
 */
async function unsuspendUsers({ reasoning, userIds }: { userIds: string[]; reasoning: string }) {
  const results = await Promise.allSettled(
    userIds.map(async (userId) => {
      const user = await findUserById(userId);

      if (!user) {
        throw new Error(`User ${userId} not found`);
      }

      // Check if user is already unsuspended or compliant
      if (user.actionStatus === "Compliant") {
        return { id: userId, status: "already compliant" };
      }

      if (user.actionStatus === "Banned") {
        return { id: userId, status: "banned (cannot unsuspend)" };
      }

      // Unsuspend the user
      await createUserAction({
        clerkOrganizationId: user.clerkOrganizationId,
        clerkUserId: user.clientId,
        userId: user.id,
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
