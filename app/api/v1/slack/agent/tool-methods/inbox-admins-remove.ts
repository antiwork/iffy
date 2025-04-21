import SlackContext from "@/app/api/v1/slack/agent/context";
import db, { schema } from "@/db";
import { eq } from "drizzle-orm";

/**
 * Removes the provided user as an admin from the inbox.
 * This will revoke their authorization to use all tools.
 */
async function removeInboxAdmin(this: SlackContext<"message">, { userSlackId }: { userSlackId: string }) {
  if (!(await this.checkPayloadUserIsAdmin())) {
    return {
      result: "You are not authorized to perform this action.",
    };
  }

  try {
    const updatedAdminSlackUserIds = this.inbox.adminSlackUserIds.filter((id) => id !== userSlackId);
    await db
      .update(schema.slackInboxes)
      .set({ adminSlackUserIds: updatedAdminSlackUserIds })
      .where(eq(schema.slackInboxes.id, this.inbox.id))
      .returning();

    return { result: `User with ID ${userSlackId} has been removed as an admin.` };
  } catch (error) {
    console.error("Error removing admin:", error);
    return { result: `Failed to remove user with ID ${userSlackId} as an admin.` };
  }
}
export default removeInboxAdmin;
