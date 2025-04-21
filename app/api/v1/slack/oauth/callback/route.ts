import db, { schema } from "@/db";
import { env } from "@/lib/env";
import { getAbsoluteUrl } from "@/lib/url";
import { encrypt } from "@/services/encrypt";
import { createSlackInbox } from "@/services/organizations";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const slackOauthResponse = z.object({
  ok: z.boolean(),
  app_id: z.string(),
  authed_user: z.object({
    id: z.string(),
  }),
  scope: z.string(),
  token_type: z.string(),
  access_token: z.string(),
  bot_user_id: z.string(),
  team: z.object({
    id: z.string(),
    name: z.string(),
  }),
  enterprise: z.null(),
  is_enterprise_install: z.boolean(),
  incoming_webhook: z.object({
    channel: z.string(),
    channel_id: z.string(),
    configuration_url: z.string(),
    url: z.string(),
  }),
});

class SlackOAuthHandler {
  /**
   * Exchange the authorization code for an access token
   */
  private async exchangeCodeForToken(code: string, redirectUri: string) {
    const clientId = env.NEXT_PUBLIC_SLACK_CLIENT_ID;
    const clientSecret = env.SLACK_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("Slack credentials not configured");
    }

    const response = await fetch("https://slack.com/api/oauth.v2.access", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri || "",
      }),
    });

    const data = await response.json();

    if (!data.ok) {
      throw new Error(`Slack OAuth error: ${data.error}`);
    }

    return data;
  }

  /**
   * Generate the appropriate redirect URI based on environment
   */
  private getRedirectUri(): string {
    let redirectUri = `${getAbsoluteUrl()}/dashboard/settings`;

    // Slack doesn't support localhost redirect URIs, so this is for ngrok (or similar)
    if (redirectUri.includes("localhost") && env.LOCAL_HOST_PROXY_URL) {
      redirectUri = env.LOCAL_HOST_PROXY_URL + "/dashboard/settings";
    }

    return redirectUri;
  }

  /**
   * Update organization with Slack integration details
   */
  private async storeSlackIntegration({
    inbox,
  }: {
    inbox: Omit<typeof schema.slackInboxes.$inferSelect, "id" | "createdAt" | "updatedAt">;
  }) {
    return await createSlackInbox(inbox.clerkOrganizationId, {
      ...inbox,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Handle POST request for Slack OAuth
   */
  async handlePost(req: NextRequest): Promise<NextResponse> {
    try {
      const { code, clerkOrganizationId } = await req.json();

      if (!code) {
        return NextResponse.json({ error: "Missing authorization code" }, { status: 400 });
      }

      if (!clerkOrganizationId) {
        return NextResponse.json({ error: "Missing organization ID" }, { status: 400 });
      }

      const redirectUri = this.getRedirectUri();

      // Exchange code for token
      const oauthResponseData = await this.exchangeCodeForToken(code, redirectUri);

      // Validate the response
      const parsedData = slackOauthResponse.safeParse(oauthResponseData);

      if (!parsedData.success) {
        console.error("Invalid Slack OAuth response:", parsedData.error.format());
        return NextResponse.json({ error: "Invalid Slack OAuth response" }, { status: 400 });
      }

      const {
        data: { access_token, team, incoming_webhook, authed_user },
      } = parsedData;

      // Find the organization
      const [organization] = await db
        .select()
        .from(schema.organizations)
        .where(eq(schema.organizations.clerkOrganizationId, clerkOrganizationId));

      if (!organization) {
        console.error("Organization not found for Slack team ID:", team.id);
        return NextResponse.json({ error: "Organization not found" }, { status: 404 });
      }

      const inbox = await this.storeSlackIntegration({
        inbox: {
          clerkOrganizationId,
          inboxName: incoming_webhook.channel,
          channelId: incoming_webhook.channel_id,
          inboxAccessToken: encrypt(access_token),
          slackTeamName: team.name,
          slackTeamId: team.id,
          botUserId: parsedData.data.bot_user_id,
          adminSlackUserIds: [authed_user.id],
        },
      });

      if (!inbox) {
        return NextResponse.json({ error: "Failed to store Slack integration" }, { status: 500 });
      }

      return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
      console.error("Slack OAuth error:", error);
      const message = error instanceof Error ? error.message : "Failed to process OAuth request";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }
}

export async function POST(req: NextRequest) {
  const handler = new SlackOAuthHandler();
  const isAuthed = await handler.handlePost(req);

  if (!isAuthed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
