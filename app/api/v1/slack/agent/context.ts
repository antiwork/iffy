"use server";
import * as schema from "@/db/schema";
import db from "@/db";
import { eq } from "drizzle-orm";
import { SlackEventPayload, SupportedSlackEvents } from "./types";
import { LogLevel, WebClient } from "@slack/web-api";
import { decrypt } from "@/services/encrypt";
import { SLACK_AGENT_TOOLS } from "./tools";
import { loadModelFromConfig } from "@/services/ai";
import { CoreMessage, generateText } from "ai";

class BaseSlackContext<T extends SupportedSlackEvents> {
  eventName: T;
  protected _client: WebClient | null = null;
  payload: SlackEventPayload<T>;

  constructor(event: SlackEventPayload<T>) {
    this.payload = this._transformToSlackEvent(event);
    this.eventName = this.payload.type as T;
  }

  get client() {
    if (!this._client) {
      throw new Error("Slack client is not initialized. Call initialize() first.");
    }
    return this._client;
  }

  /**
   * Transforms the incoming event to a standard Slack event format.
   * This ensures that all events have a consistent structure for easier handling.
   */
  protected _transformToSlackEvent(
    payload: SlackEventPayload<T> & { team_id?: string; api_app_id?: string },
  ): SlackEventPayload<T> {
    if (!payload.type) {
      throw new Error("Event type is missing");
    }

    if ("event" in payload && payload.event && "type" in payload.event && payload.event.type) {
      return {
        type: payload.event.type as T,
        teamId: payload?.team_id || payload?.teamId,
        appId: payload?.api_app_id || payload?.appId,
        event: {
          ...payload.event,
        },
      };
    }

    return {
      type: payload.type as T,
      teamId: payload?.team_id || payload?.teamId,
      appId: payload?.api_app_id || payload?.appId,
      event: {
        ...("event" in payload && payload.event ? payload.event : payload),
      } as SlackEventPayload<T>["event"],
    };
  }
}

class SlackContext<T extends SupportedSlackEvents> extends BaseSlackContext<T> {
  async initialize() {
    const { payload } = this;
    const orgDetails = await this.getOrganizationDetails(payload.teamId);

    if (orgDetails) {
      this.payload.inbox = orgDetails.inbox;
      this.payload.organization = orgDetails.organization;
      this._client = new WebClient(decrypt(this.payload.inbox.inboxAccessToken), {
        logLevel: LogLevel.ERROR,
      });
    }
  }

  get inbox() {
    if (!this.payload.inbox) {
      throw new Error("Inbox is not set in the payload");
    }
    return this.payload.inbox;
  }

  get organization() {
    if (!this.payload.organization) {
      throw new Error("Organization is not set in the payload");
    }
    return this.payload.organization;
  }

  async createLlmResponse({
    slackMessage,
    chatHistory,
    username,
  }: {
    slackMessage: string;
    username?: string;
    chatHistory?: CoreMessage[];
  }): Promise<string> {
    const messages: CoreMessage[] = chatHistory || [
      {
        role: "system",
        content: this.createSlackSystemMessage(),
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
      tool.execute = tool.execute?.bind(this);
    });

    const { response, toolResults, text } = await generateText({
      model: await loadModelFromConfig((config) => config.strategies.prompt.defaultModel || "gpt-4o-mini"),
      tools: SLACK_AGENT_TOOLS,
      temperature: 0.2,
      messages,
    });

    if (toolResults?.length) {
      messages.push(...response.messages);
      return this.createLlmResponse({
        slackMessage,
        chatHistory: messages,
        username,
      });
    }

    return text || "No response generated";
  }

  /**
   * Sends a message to a Slack channel with an authenticated client.
   */
  async deliverSlackMessage({
    message,
    channelId,
    thread_ts,
  }: {
    message: string;
    channelId: string;
    thread_ts?: string;
  }) {
    await this.client.chat.postMessage({
      channel: channelId,
      text: message,
      thread_ts,
      token: decrypt(this.inbox.inboxAccessToken),
    });
  }

  /**
   * Retrieves the organization details using the Slack team ID.
   */
  async getOrganizationDetails(teamId: string) {
    const inbox = await db.query.slackInboxes.findFirst({
      where: eq(schema.slackInboxes.slackTeamId, teamId),
    });

    if (!inbox) {
      console.log("No inbox found for this Slack team:", teamId);
      return null;
    }

    const organization = await db.query.organizations.findFirst({
      where: eq(schema.organizations.clerkOrganizationId, inbox.clerkOrganizationId),
    });
    if (!organization) {
      console.log("No organization found for this inbox:", inbox.id);
      return null;
    }

    return {
      inbox,
      organization,
    };
  }

  createSlackSystemMessage() {
    return String.raw`
    You are Iffy's Slack bot assistant. You'll be performing user actions on behalf of channel members.
    
    # Context:
    ${"username" in this.payload.event ? `- User Name: ${this.payload.event.username}` : ""}
    - Slack Team Name: ${this.inbox.slackTeamName}
    - Slack Inbox Name: ${this.inbox.inboxName}
    - Current Time: ${new Date().toISOString()}
    ${"bot_id" in this.payload.event ? `- Your User ID: ${this.payload.event.bot_id}` : ""} 
    
    # Instructions:
    - Ensure that all responses are appropriate and respectful.
    - If the user asks you to perform an action, do it without asking for confirmation.
    - If you don't understand the request, ask for clarification.
    
    # Constraints:
    - NEVER tag or mention any users in the channel unless explicitly requested by the user.
    - Use discretion when providing information about users or teams, provide only the necessary details.
    - Do not share any sensitive information about the organization or its members.
    `;
  }
}

export default SlackContext;
