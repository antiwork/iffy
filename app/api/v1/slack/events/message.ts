import { NextResponse } from "next/server";
import { CoreMessage } from "ai";
import SlackContext from "../agent/context";
import { MessageElement } from "@slack/web-api/dist/types/response/ConversationsHistoryResponse";

async function handleMessage(ctx: SlackContext<"message">): Promise<NextResponse> {
  const { payload, client } = ctx;
  const {
    event: { channel, ts },
  } = payload;

  // ignore messages from the bot itself
  const { botUserId } = ctx.inbox;
  if (
    ("user" in payload.event && payload.event.user === botUserId) ||
    ("bot_id" in payload.event && payload.event.bot_id === botUserId) ||
    ("subtype" in payload.event && payload.event.subtype === "bot_message")
  ) {
    console.log("Ignoring message from bot itself");
    return NextResponse.json({}, { status: 200 });
  }

  const threadTs = "thread_ts" in payload.event && (payload.event.thread_ts as string);
  // pull the thread messages to check if the bot has been mentioned
  const threadMessages = await client.conversations.replies({
    channel,
    ts: threadTs || ts,
    limit: 100,
  });
  const threadMessagesList = threadMessages.messages || [];
  const botHasBeenMentioned = threadMessagesList.some((message) => {
    return message.text?.includes(`<@${botUserId}>`) || message.user === botUserId;
  });

  if (!botHasBeenMentioned) {
    console.log("Bot has not been mentioned in the thread.");
    return NextResponse.json({}, { status: 200 });
  }
  const isAdmin = await ctx.checkPayloadUserIsAdmin();
  const chatHistory = buildChatHistory(threadMessagesList);
  const llmResponse = await ctx.createLlmResponse({
    slackMessage: chatHistory[chatHistory.length - 1]?.content as string,
    chatHistory,
    isAdmin,
  });

  if (!llmResponse) {
    await ctx.deliverSlackMessage({
      channelId: channel,
      message: "Failed to generate response",
      thread_ts: ts,
    });
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 });
  }

  await ctx.deliverSlackMessage({
    channelId: channel,
    message: llmResponse,
    thread_ts: ts,
  });

  return NextResponse.json({ success: true }, { status: 200 });
}

function buildChatHistory(messages?: MessageElement[]): CoreMessage[] {
  if (!messages) return [];
  const chatHistory: CoreMessage[] = [];

  messages
    .sort((a, b) => {
      return (a.ts || "").localeCompare(b.ts || "");
    })
    .forEach((message) => {
      chatHistory.push({
        role: message.subtype === "bot_message" ? "assistant" : "user",
        content: message.text || "",
      });
    });

  return chatHistory;
}

export default handleMessage;
