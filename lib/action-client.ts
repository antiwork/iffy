import { createSafeActionClient } from "next-safe-action";
import { auth } from "@/services/auth";

export const actionClient = createSafeActionClient({
  handleServerError(e) {
    console.error("Action error:", e.message);
    throw e;
  },
}).use(async ({ next }) => {
  const { userId, orgId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized: User not found.");
  }
  if (!orgId) {
    throw new Error("Unauthorized: Organization not found.");
  }

  return next({ ctx: { organizationId: orgId, userId: userId } });
});
