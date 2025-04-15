import { NextResponse } from "next/server";
import { CoreMessage, generateText } from "ai";
import { Organization, SlackInbox } from "@/db/tables";
import SlackContext from "../agent/context";
import { SLACK_AGENT_TOOLS } from "../agent/tools";
import { loadModelFromConfig } from "@/services/ai";

const SlackAgentSystemMessage = ({
  inboxName,
  slackTeamName,
  username,
  botUserId,
}: {
  inboxName: string;
  slackTeamName: string;
  username?: string;
  botUserId?: string;
}) => String.raw`
You are Iffy's Slack bot assistant. You'll be performing user actions on behalf of channel members.

# Context:
${username ? `- Message Sender: ${username}` : ""}
- Slack Team Name: ${slackTeamName}
- Slack Inbox Name: ${inboxName}
- Current Time: ${new Date().toISOString()}
${botUserId ? `- Your User ID: ${botUserId}` : ""}

# Instructions:
- Ensure that all responses are appropriate and respectful.
- If the user asks you to perform an action, do it without asking for confirmation.
- If you don't understand the request, ask for clarification.

# Constraints:
- NEVER tag or mention any users in the channel unless explicitly requested by the user.
- Use discretion when providing information about users or teams, provide only the necessary details.
- Do not share any sensitive information about the organization or its members.
`;

export async function handleAppMention(ctx: SlackContext<"app_mention">): Promise<NextResponse> {
  const team = ctx.payload.event.team;
  if (!team) {
    return NextResponse.json({ error: "No team ID found in the payload" }, { status: 400 });
  }

  const orgDetails = await ctx.getOrganizationDetails(team);
  if (!orgDetails) {
    return NextResponse.json({ error: "No organization found" }, { status: 400 });
  }
  return iffyAgent({ ctx, ...orgDetails });
}

async function iffyAgent({
  ctx,
  inbox,
}: {
  ctx: SlackContext<"app_mention">;
  organization: Organization;
  inbox: SlackInbox;
}) {
  const { payload } = ctx;
  const { text, username, channel } = payload.event;

  const iffyBotIdRegex = /<@([A-Z0-9]+)>/;
  const iffyBotId = text.match(iffyBotIdRegex)?.[1];

  payload.event.bot_id = iffyBotId;
  payload.event.text = text.replace(iffyBotIdRegex, "").trim();

  const response = await createLlmResponse({
    ctx,
    slackMessage: payload.event.text,
    inbox,
    username,
  });

  if (!response) {
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 });
  }

  await ctx.deliverSlackMessage({
    channelId: channel,
    message: response,
    thread_ts: payload.event.thread_ts || payload.event.ts,
  });

  return NextResponse.json({ success: true }, { status: 200 });
}

async function createLlmResponse({
  ctx,
  slackMessage,
  inbox,
  chatHistory,
  username,
}: {
  ctx: SlackContext<"app_mention">;
  slackMessage: string;
  inbox: SlackInbox;
  username?: string;
  chatHistory?: CoreMessage[];
}) {
  const { inboxName, slackTeamName } = inbox;
  const {
    payload: {
      event: { bot_id },
    },
  } = ctx;
  const sysMsg = SlackAgentSystemMessage({ inboxName, slackTeamName, username, botUserId: bot_id });

  const messages: CoreMessage[] = chatHistory || [
    {
      role: "system",
      content: sysMsg,
    },
    {
      role: "user",
      content: slackMessage,
    },
  ];

  /**
   * Binding ctx so methods can access it without declaring it in the function signature.
   *
   * The `ai` sdk doesn't support passing context directly to the tool methods or it needs
   * defined as part of the tool `parameters` which the agent will try to produce a value for.
   */
  Object.values(SLACK_AGENT_TOOLS).forEach((tool) => {
    tool.execute = tool.execute?.bind(ctx);
  });

  const { response, usage, toolCalls, toolResults, text } = await generateText({
    model: await loadModelFromConfig((config) => config.strategies.prompt.defaultModel || "gpt-4o-mini"),
    tools: SLACK_AGENT_TOOLS,
    temperature: 0.2,
    messages,
  });

  if (toolResults?.length) {
    messages.push(...response.messages);
    return createLlmResponse({
      ctx,
      inbox,
      slackMessage,
      chatHistory: messages,
      username,
    });
  }

  return text || "No response generated";
}
