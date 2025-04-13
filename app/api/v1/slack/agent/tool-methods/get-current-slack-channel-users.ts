import SlackContext from "@/app/api/v1/slack/agent/context";

/**
 * Get the list of users in the current Slack channel
 */
async function getCurrentSlackChannelUsers({ ctx }: { ctx: SlackContext<"app_mention"> }) {
  const { payload, client } = ctx;
  const inboxName = payload.inbox?.inboxName;
  const { channel: channelId } = payload.event;

  const response = await client.conversations.members({ channel: channelId });
  if (!response.ok) {
    throw new Error(`Failed to retrieve users from Slack channel: ${response.error}`);
  }

  const users = response.members || [];
  return {
    result: `Users in the current Slack channel (${inboxName}):\n${users.join(", ")}`,
  };
}

export default getCurrentSlackChannelUsers;
