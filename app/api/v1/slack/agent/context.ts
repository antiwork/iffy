"use server";
import * as schema from "@/db/schema";
import db from "@/db";
import { eq } from "drizzle-orm";
import { SlackEventPayload, SupportedSlackEvents } from "./types";
import { LogLevel, WebClient } from "@slack/web-api";
import { decrypt } from "@/services/encrypt";

class BaseSlackContext<T extends SupportedSlackEvents> {
  eventName: T;
  protected _client: WebClient | null = null;
  payload: SlackEventPayload<T>;
  request: Request;

  constructor(event: SlackEventPayload<T>, request: Request) {
    this.payload = this._transformToSlackEvent(event);
    this.request = request;
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
    if (!payload.teamId) {
      throw new Error("Missing team ID in payload");
    }
    if (!payload.appId) {
      throw new Error("Missing app ID in payload");
    }

    const orgDetails = await this.getOrganizationDetails(payload.teamId);
    if (!orgDetails) {
      throw new Error("No organization found for this team ID");
    }
    const { organization, inbox } = orgDetails;
    if (!organization) {
      throw new Error("No organization found for this inbox");
    }
    if (!inbox) {
      throw new Error("No inbox found for this organization");
    }
    this.payload.inbox = inbox;
    this.payload.organization = organization;

    this._client = new WebClient(decrypt(inbox.inboxAccessToken), {
      logLevel: LogLevel.ERROR,
    });
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

  private _formatAgentUserId(userId: string): {
    clientId?: string | null;
    iffyId?: string | null;
    email?: string | null;
    slackId?: string | null;
    orgId?: string | null;
  } {
    if (userId.startsWith("user_")) {
      return { clientId: userId };
    }

    if (userId.includes("@")) {
      return { email: userId };
    }

    if (userId.startsWith("U")) {
      return { slackId: userId };
    }

    if (userId.startsWith("org_")) {
      return { orgId: userId };
    }

    return { iffyId: userId };
  }

  async findUserById(userId: string) {
    const { clientId, iffyId, email /**orgId , slackId */ } = this._formatAgentUserId(userId);

    if (clientId) {
      return db.query.users.findFirst({ where: eq(schema.users.clientId, clientId) });
    }

    if (email) {
      return db.query.users.findFirst({ where: eq(schema.users.email, email) });
    }

    if (iffyId) {
      return db.query.users.findFirst({ where: eq(schema.users.id, iffyId) });
    }

    // if (orgId) {
    //   return db.query.organizations.findFirst({ where: eq(schema.organizations.id, orgId) });
    // }

    // TODO:??
    // if (slackId) {
    //   return db.query.users.findFirst({ where: eq(schema.users.slackId, slackId) });
    // }

    return null;
  }
}

export default SlackContext;
