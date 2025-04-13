"use server";

import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import SlackContext from "./agent/context";
import SlackEventHandler from "./agent/slack-event-handler";
import { SlackEventPayload, SupportedSlackEvents } from "./agent/types";

// Slack Events API endpoint
export async function POST(req: NextRequest) {
  if (!env.SLACK_SIGNING_SECRET) {
    console.error("Missing SLACK_SIGNING_SECRET environment variable");
    return new NextResponse(JSON.stringify({ error: "Configuration error" }), {
      status: 500,
    });
  }

  const body = await req.text();
  const payload = JSON.parse(body) as SlackEventPayload<SupportedSlackEvents>;

  if (!verifyRequest(req, body, env.SLACK_SIGNING_SECRET)) {
    console.error("Invalid request signature");
    return new NextResponse(JSON.stringify({ error: "Invalid request signature" }), {
      status: 400,
    });
  }

  const ctx = new SlackContext(payload, req);
  await ctx.initialize();
  const handler = new SlackEventHandler(ctx);
  return await handler.handleEvents();
}

/**
 * Verifies the request signature from Slack with the provided signing secret.
 */
function verifyRequest(req: Request, body: string, secret: string): boolean {
  const requestTimestamp = req.headers.get("x-slack-request-timestamp") || "";
  const signature = req.headers.get("x-slack-signature") || "";

  if (!secret) {
    throw new Error("Slack signing secret is not configured");
  }

  const version = "v0";
  const basestring = `${version}:${requestTimestamp}:${body}`;
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(basestring, "utf8");
  const digest = hmac.digest("hex");

  // Prepend the version to the digest to create the full signature
  const computedSignature = `${version}=${digest}`;

  // Use a secure comparison function to prevent timing attacks
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computedSignature));
}
