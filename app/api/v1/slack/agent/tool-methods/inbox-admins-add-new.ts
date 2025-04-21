import SlackContext from "@/app/api/v1/slack/agent/context";
import db, { schema } from "@/db";
import { eq } from "drizzle-orm";

/**
 * Adds the provided user as an admin to the inbox.
 * This grants the user authorization to use all tools, provided they
 * have completed the Iffy OAuth setup.
 *
 * Initially, the only admin will be the user who created the inbox
 * i.e. the user who installed the bot via OAuth.
 */
async function addNewInboxAdmin(this: SlackContext<"message">, { userSlackId }: { userSlackId: string }) {
  const isAuthorized = await this.checkPayloadUserIsAdmin();
  if (!isAuthorized) {
    return {
      result: "You are not authorized to perform this action.",
    };
  }

  // Pull the user email from Slack
  const { profile } = await this.client.users.profile.get({ user: userSlackId });
  if (!profile || !profile.email) {
    return {
      result: `No ${profile?.email ? "profile" : "email"} found (with ID ${userSlackId}) unable to correlate with Iffy user`,
    };
  }
  try {
    const existingAdmin = this.inbox.adminSlackUserIds.find((id: string) => id === userSlackId);
    if (existingAdmin) {
      return { result: `User with ID ${userSlackId} is already an admin` };
    }

    const updatedAdminSlackUserIds = [...this.inbox.adminSlackUserIds, userSlackId];
    const res = await db
      .update(schema.slackInboxes)
      .set({ adminSlackUserIds: updatedAdminSlackUserIds })
      .where(eq(schema.slackInboxes.id, this.inbox.id))
      .returning();

    if (!res.length || !res.some((r) => r.adminSlackUserIds.includes(userSlackId))) {
      return { result: `Failed to add user with ID ${userSlackId} as an admin` };
    }

    return {
      result: `User with ID ${userSlackId} has been added as an admin`,
    };
  } catch (error) {
    console.error("Error adding admin:", error);
    return { result: `Failed to add user with ID ${userSlackId} as an admin.` };
  }
}
export default addNewInboxAdmin;
