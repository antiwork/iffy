"use server";
import * as schema from "@/db/schema";
import db from "@/db";
import { eq } from "drizzle-orm";
import { LogLevel, WebClient } from "@slack/web-api";
import { CoreMessage, generateText } from "ai";

import { SlackEventPayload, SupportedSlackEvents } from "./types";
import { decrypt } from "@/services/encrypt";
import { getAuthorizedAgentTools } from "./tools";
import { loadModelFromConfig } from "@/services/ai";
import { clerkClient } from "@clerk/nextjs/server";

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

class SlackContext<T extends SupportedSlackEvents = SupportedSlackEvents> extends BaseSlackContext<T> {
  senderDetails: { clerkUserId: string | null; slackUserId: string } | null = null;
  userInfoCache: Map<string, any>;
  adminStatusCache: Map<string, boolean>;

  constructor(event: SlackEventPayload<T>) {
    super(event);
    this.userInfoCache = new Map();
    this.adminStatusCache = new Map();
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

  async initialize() {
    const orgDetails = await this._getOrganizationDetails(this.payload.teamId);

    if (orgDetails) {
      this.payload.inbox = orgDetails.inbox;
      this.payload.organization = orgDetails.organization;
      this._client = new WebClient(decrypt(this.payload.inbox.inboxAccessToken), {
        logLevel: LogLevel.ERROR,
      });

      // Pulls the clerkUserId using the slackUserId from the event
      // This is used to identify the user in the Iffy system for agent tool authorization
      this.senderDetails = await this.getIffyUserFromSlackId(
        "user" in this.payload.event && this.payload.event.user
          ? typeof this.payload.event.user === "string"
            ? this.payload.event.user
            : this.payload.event.user.id
          : "user_id" in this.payload.event
            ? this.payload.event.user_id
            : "",
      );
    } else {
      console.log("No organization found for this inbox:", this.payload.teamId);
      throw new Error("No organization found for this inbox");
    }
  }

  /**
   * Retrieves the Iffy user details using the Slack user ID.
   *
   * Currently, we're pulling the email from the Slack user profile and using it to find the corresponding Iffy user.
   *
   * This method assumes that the email in the Slack profile is the same as the one used in Iffy.
   * If the email is not found or if the user is not part of the organization, it returns null.
   *
   * - We could base this on the user's admin status in the Slack workspace instead but is less flexible.
   */
  async getIffyUserFromSlackId(slackUserId: string) {
    const userSlackInfo = await this.client.users.info({ user: slackUserId });
    const organization = await db.query.organizations.findFirst({
      where: eq(schema.organizations.clerkOrganizationId, this.inbox.clerkOrganizationId),
    });

    const userEmail = userSlackInfo.user?.profile?.email;

    if (!userEmail || !organization) {
      return {
        clerkUserId: null,
        slackUserId: slackUserId,
      };
    }

    // Use the email to find the corresponding Iffy user in the Clerk system
    const {
      data: [clerkAuthedUser],
    } = await (
      await clerkClient()
    ).users.getUserList({
      emailAddress: [userEmail],
      limit: 1,
    });

    const { data: clerkOrgUsers } = await (
      await clerkClient()
    ).organizations.getOrganizationMembershipList({
      organizationId: organization.clerkOrganizationId,
    });

    if (!clerkAuthedUser?.id) {
      return {
        clerkUserId: null,
        slackUserId: slackUserId,
      };
    }

    const isUserInOrg = clerkOrgUsers.some((user) => user.publicUserData?.userId === clerkAuthedUser.id);

    return {
      clerkUserId: isUserInOrg ? clerkAuthedUser.id : null,
      slackUserId: slackUserId,
    };
  }

  /**
   * Creates a response using the LLM based on the Slack message and chat history.
   *
   * If tool calls are present, it will recursively call itself with the updated chat history until no tool calls are left.
   */
  async createLlmResponse({
    slackMessage,
    chatHistory,
    username,
    isAdmin,
  }: {
    slackMessage: string;
    username?: string;
    chatHistory?: CoreMessage[];
    isAdmin?: boolean;
  }): Promise<string> {
    const messages: CoreMessage[] = chatHistory || [
      {
        role: "system",
        content: this._createSlackSystemMessage(isAdmin),
      },
      {
        role: "user",
        content: slackMessage,
      },
    ];

    if (!messages.length) {
      return "No messages to process";
    }

    if (!messages.find((msg) => msg.role === "system")) {
      messages.unshift({
        role: "system",
        content: this._createSlackSystemMessage(isAdmin),
      });
    }

    const { response, toolResults, text } = await generateText({
      model: await loadModelFromConfig((config) => config.strategies.prompt.defaultModel || "gpt-4o-mini"),
      tools: getAuthorizedAgentTools(this, isAdmin),
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
  private async _getOrganizationDetails(teamId: string) {
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

  private _createSlackSystemMessage(isAdmin?: boolean) {
    const userName = "username" in this.payload.event ? `User Name: ${this.payload.event.username}\n` : "";
    const botId = "bot_id" in this.payload.event ? `Your User ID: ${this.payload.event.bot_id}\n` : "";

    return `You are Iffy's Slack bot assistant helping users with actions in ${this.inbox.slackTeamName}.

  ## Role and Context
  - Inbox: ${this.inbox.inboxName}
  - ${isAdmin ? "User is an admin with expanded permissions." : "User is a regular member with standard permissions."}
  - ${userName}
  - ${botId}

  ## Communication Style
  - Be friendly, helpful, professional and concise
  - Use conversational but straightforward tone
  - Respond directly to requests without unnecessary confirmations

  ## Tools Usage
  - Admin-only tools are restricted based on user permissions
  - Administrative actions require proper Clerk OAuth authentication

  ## Important Guidelines
  - Execute requested actions promptly when authorized
  - Ask for clarification when needed
  - Never mention/tag users unless explicitly requested
  - Maintain privacy and discretion with user and organization information
  - The user will follow up with you if they need to, do not ask if they need anything else`;
  }

  /**
   * Checks if the user is an admin in the Slack workspace.
   *
   * This method first checks the cache for the user's admin status. If not found,
   * it fetches the user info from Slack and checks against the list of admin Slack user IDs for the inbox.
   */
  async checkPayloadUserIsAdmin() {
    const userId: string | null =
      "user" in this.payload.event
        ? String(this.payload.event.user)
        : "user_id" in this.payload.event
          ? String(this.payload.event.user_id)
          : null;

    if (!userId) {
      return false;
    }

    // Check cache first
    if (this.adminStatusCache.has(userId)) {
      const isAdmin = this.adminStatusCache.get(userId);
      return isAdmin;
    }

    const { adminSlackUserIds } = this.inbox;

    // Get user info and store it in the request-specific cache
    let userInfo;
    if (this.userInfoCache.has(userId)) {
      userInfo = this.userInfoCache.get(userId);
    } else {
      userInfo = await this.client.users.info({ user: userId });
      this.userInfoCache.set(userId, userInfo);
    }

    const userSlackId = userInfo.user?.id || "";
    const isAdmin = adminSlackUserIds.some((id: string) => id === userSlackId);

    this.adminStatusCache.set(userId, isAdmin);
    return isAdmin;
  }
}

export default SlackContext;
