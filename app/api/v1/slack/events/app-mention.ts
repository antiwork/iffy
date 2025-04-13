import { NextResponse } from "next/server";
import OpenAI from "openai";
import { env } from "@/lib/env";
import { Organization, SlackInbox } from "@/db/tables";
import SlackContext from "../agent/context";
import { SLACK_AGENT_TOOLS, SlackAgentToolMethods, SlackToolMethod, SlackToolMethodArgHelper } from "../agent/tools";

const openAi = new OpenAI({ apiKey: env.OPENAI_API_KEY });

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
You are Iffy's Slack bot assistant. Your job is to assist users with their inquiries and provide relevant information based on the context of the conversation. 

# Context:
${username ? `- Message Sender: ${username}` : ""}
- Slack Team Name: ${slackTeamName}
- Slack Inbox Name: ${inboxName}
- Current Time: ${new Date().toISOString()}
${botUserId ? `- Your User ID: ${botUserId}` : ""}

# Instructions:
- Always respond in a friendly and helpful manner.
- Always identify as "Iffy" when necessary.
- Do not disclose any sensitive information about the organization or its members.
- Always respect the privacy of users and their data.
- If you are unsure about something, ask for clarification instead of making assumptions.
- If you encounter an error or unexpected behavior, report it to the user and suggest possible solutions.

# Constraints:
- Ensure that all responses are appropriate and respectful.
- If a request is outside your capabilities, inform the user politely.
- Maintain a professional tone in all interactions.
- Avoid using slang or informal language unless it is appropriate for the context.
- Ensure that all responses are clear and concise.
- NEVER tag or mention any users in the channel unless explicitly requested by the user.
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

  const { organization, inbox } = orgDetails;
  if (!organization) {
    return NextResponse.json({ error: "No organization found" }, { status: 400 });
  }

  return iffyAgent({ ctx, organization, inbox });
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

  const iffyBotId = /^(<@U[0-9A-Z]+>)$/.test(text) ? text : null;
  if (iffyBotId) {
    payload.event.bot_id = iffyBotId;
    payload.event.text = text.replace(iffyBotId, "@Iffy").trim();
  }

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
    teamId: payload.teamId,
    thread_ts: payload.event.thread_ts || payload.event.ts,
  });

  return NextResponse.json({ status: "success" }, { status: 200 });
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
  chatHistory?: OpenAI.Chat.Completions.ChatCompletionMessageParam[];
}) {
  const { inboxName, slackTeamName } = inbox;
  const {
    payload: {
      event: { bot_id },
    },
  } = ctx;
  const sysMsg = SlackAgentSystemMessage({ inboxName, slackTeamName, username, botUserId: bot_id });

  const messages = chatHistory || [
    {
      role: "system",
      content: sysMsg,
    },
    {
      role: "user",
      content: slackMessage,
    },
  ];

  const response = await openAi.chat.completions.create({
    model: "gpt-4o-mini",
    tool_choice: "auto",
    tools: SLACK_AGENT_TOOLS,
    temperature: 0.2,
    messages,
  });

  if (!response.choices[0]?.message) {
    console.error("No message found in response:", response);
    return null;
  }

  const message = response.choices[0].message;
  messages.push(message);

  if (message.tool_calls && message.tool_calls.length > 0) {
    const toolCallResponses = await handleToolCallResponse(ctx, response);
    if (toolCallResponses?.length) {
      for (const toolCallResponse of toolCallResponses) {
        messages.push(toolCallResponse);
      }

      return createLlmResponse({
        ctx,
        slackMessage,
        inbox,
        username,
        chatHistory: messages,
      });
    }
  } else {
    return response.choices[0]?.message.content || null;
  }
}

async function handleToolCallResponse(
  ctx: SlackContext<"app_mention">,
  completeion: OpenAI.Chat.Completions.ChatCompletion,
) {
  const { choices } = completeion;
  if (!choices || choices.length === 0) {
    return null;
  }

  const buildToolCallRespone = (
    toolId: string,
    content: string,
  ): OpenAI.Chat.Completions.ChatCompletionMessageParam => {
    return {
      role: "tool",
      tool_call_id: toolId,
      content: content,
    };
  };

  const choice = choices[0];
  if (choice?.message?.tool_calls?.length) {
    const toolCallResults = await Promise.all(
      choice.message.tool_calls.map(async (toolCall) => {
        const { function: funcDetails } = toolCall;
        const { name, arguments: funcArgs } = funcDetails;
        let args: SlackToolMethodArgHelper | null = null;

        try {
          args = JSON.parse(funcArgs) satisfies SlackToolMethodArgHelper;
        } catch (e) {
          console.error("Failed to parse function arguments", e);
          return null;
        }

        const method = SlackAgentToolMethods[name as keyof typeof SlackAgentToolMethods] as SlackToolMethod<
          keyof typeof SlackAgentToolMethods
        >;

        console.debug("Executing tool call:", { name, args });

        if (!method) {
          console.error("No method found for tool call:", name);
          return null;
        }

        const { result } = await method({
          ...(args ? args : {}), // null may be valid for some methods
          ctx,
        });

        return buildToolCallRespone(toolCall.id, result);
      }),
    );

    return toolCallResults.filter((result): result is OpenAI.Chat.Completions.ChatCompletionMessageParam => !!result);
  }

  return null;
}
