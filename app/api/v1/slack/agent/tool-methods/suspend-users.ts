import { createUserAction } from "@/services/user-actions";
import findUserById from "./utils";

/**
 * Suspend one or more users
 */
async function suspendUsers({ userIds, reasoning }: { userIds: string[]; reasoning: string }) {
  const results = await Promise.allSettled(
    userIds.map(async (userId) => {
      const user = await findUserById(userId);

      if (!user) {
        throw new Error(`User with ID ${userId} not found`);
      }

      // Check if user is already suspended or banned
      if (user.actionStatus === "Suspended") {
        return { id: userId, status: "already suspended" };
      }

      if (user.actionStatus === "Banned") {
        return { id: userId, status: "banned (cannot suspend)" };
      }

      // Check if user is protected
      if (user.protected) {
        return { id: userId, status: "protected (cannot suspend)" };
      }

      // Suspend the user
      await createUserAction({
        clerkOrganizationId: user.clerkOrganizationId,
        clerkUserId: user.clientId,
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
