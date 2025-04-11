"use server";

import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { handleSlackCommand, parseSlackCommand } from "@/services/slack";
import * as schema from "@/db/schema";
import db from "@/db";
import { eq } from "drizzle-orm";
import { decrypt } from "@/services/encrypt";

export class SlackEventHandler {
  private readonly signingSecret: string; // Obtained from your Slack app settings

  constructor(signingSecret: string) {
    this.signingSecret = signingSecret;
  }

  /**
   * Handles incoming Slack events and verifies the request signature.
   */
  async handleEvent(req: NextRequest): Promise<NextResponse> {
    try {
      const body = await req.text();
      const payload = JSON.parse(body);

      if (!(await this.verifyRequest(req, body))) {
        console.error("Invalid Slack signature");
        return new NextResponse(JSON.stringify({ error: "Invalid signature" }), {
          status: 403,
        });
      }

      // Webhook setup verification
      if (payload.type === "url_verification") {
        return await this.handleUrlVerification(payload);
      }

      // when someone calls @iffy
      if (payload.event && payload.event.type === "app_mention") {
        console.log("Received app_mention event:", payload.event);
        return await this.handleAppMention(payload);
      }

      return NextResponse.json({
        text: "This event type is not supported.",
      });
    } catch (error) {
      console.error("Error processing Slack event:", error);
      return NextResponse.json(
        {
          text: "Sorry, something went wrong while processing your request.",
          error: error instanceof Error ? error.message : "Unknown error",
        },
        {
          status: 500,
        },
      );
    }
  }

  /**
   * Verifies the request signature from Slack with the provided signing secret.
   */
  async verifyRequest(req: NextRequest, body: string): Promise<boolean> {
    const requestTimestamp = req.headers.get("x-slack-request-timestamp") || "";
    const signature = req.headers.get("x-slack-signature") || "";

    if (!this.signingSecret) {
      throw new Error("Slack signing secret is not configured");
    }

    const version = "v0";
    const basestring = `${version}:${requestTimestamp}:${body}`;
    const hmac = crypto.createHmac("sha256", this.signingSecret);
    hmac.update(basestring, "utf8");
    const digest = hmac.digest("hex");

    // Prepend the version to the digest to create the full signature
    const computedSignature = `${version}=${digest}`;

    // Use a secure comparison function to prevent timing attacks
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computedSignature));
  }

  /**
   * Sends a message to Slack using the captured webhook URL and access token during OAuth flow.
   */
  async deliverSlackMessage({
    accessToken,
    message,
    webhookUrl,
  }: {
    webhookUrl: string;
    message: string;
    accessToken: string | null;
  }) {
    if (!webhookUrl) {
      throw new Error("Missing webhook URL for Slack API");
    }

    if (!accessToken) {
      throw new Error("Missing access token for Slack API");
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ text: message }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send message to Slack: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return response.json();
    }

    return response.text();
  }

  /**
   * Handles the URL verification challenge from Slack during webhook setup.
   */
  async handleUrlVerification(payload: any): Promise<NextResponse> {
    return NextResponse.json({ challenge: payload.challenge });
  }

  /**
   * Retrieves the organization details using the Slack team ID.
   */
  async getOrganizationDetails(teamId: string) {
    const organization = await db.query.organizations.findFirst({
      where: eq(schema.organizations.slackTeamId, teamId),
    });

    if (!organization) {
      console.log("No organization found for this Slack team:", teamId);
      return null;
    }

    const webhookDetails = await db.query.organizationSlackWebhooks.findFirst({
      where: eq(schema.organizationSlackWebhooks.clerkOrganizationId, organization.clerkOrganizationId),
    });

    if (!webhookDetails || !organization.slackAccessToken) {
      console.error("Missing webhook details or access token for organization:", organization.clerkOrganizationId);
      return null;
    }

    const accessToken = decrypt(organization.slackAccessToken);
    const responseUrl = decrypt(webhookDetails.webhookUrl);

    return {
      organization,
      accessToken,
      responseUrl,
    };
  }

  /**
   * Handles app mention events from Slack.
   */
  async handleAppMention(payload: any): Promise<NextResponse> {
    const event = payload.event;
    const text = event.text;
    const teamId = payload.team_id;

    const orgDetails = await this.getOrganizationDetails(teamId);

    if (!orgDetails) {
      return new NextResponse(
        JSON.stringify({
          text: "This Slack workspace is not connected to an Iffy account. Please set up the integration first.",
        }),
        { status: 200 },
      );
    }

    const { organization, accessToken, responseUrl } = orgDetails;

    const command = await parseSlackCommand(text);
    let responseText = "";

    if (!command) {
      responseText =
        "Sorry, I didn't understand that command. Try: `@iffy suspend user_id1, user_id2`, `@iffy unsuspend user_id`, or `@iffy info user_id`";
      await this.deliverSlackMessage({
        accessToken,
        message: responseText,
        webhookUrl: responseUrl,
      });
      return new NextResponse(JSON.stringify({ text: responseText }), { status: 200 });
    }

    if (!["suspend", "unsuspend", "info"].includes(command.type)) {
      responseText = "Invalid command type. Supported commands are: suspend, unsuspend, info.";
      await this.deliverSlackMessage({
        accessToken,
        message: responseText,
        webhookUrl: responseUrl,
      });
      return new NextResponse(JSON.stringify({ text: responseText }), { status: 200 });
    }

    const response = await handleSlackCommand(organization.clerkOrganizationId, command);

    if (!response) {
      responseText = "Sorry, I couldn't process your request. Please try again.";
      await this.deliverSlackMessage({
        accessToken,
        message: responseText,
        webhookUrl: responseUrl,
      });
      return new NextResponse(JSON.stringify({ text: responseText }), { status: 200 });
    }

    if (response.text) {
      await this.deliverSlackMessage({
        accessToken,
        message: response.text,
        webhookUrl: responseUrl,
      });
    }

    return NextResponse.json(response, { status: 200 });
  }
}
