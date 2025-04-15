"use server";

import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { SlackEventPayload, SupportedSlackEvents } from "./agent/types";
import { inngest } from "@/inngest/client";
import { handleUrlVerification } from "./events/url-verification";
import SlackContext from "./agent/context";

// Slack Events API endpoint
export async function POST(req: NextRequest) {
  if (!env.SLACK_SIGNING_SECRET) {
    console.error("Missing SLACK_SIGNING_SECRET environment variable");
    return new NextResponse(JSON.stringify({ error: "Configuration error" }), {
      status: 500,
    });
  }

  const body = await req.text();
  const payload = JSON.parse(body) as SlackEventPayload<SupportedSlackEvents> & {
    event_id?: string;
  };

  if (!verifyRequest(req, body, env.SLACK_SIGNING_SECRET)) {
    console.error("Invalid request signature");
    return new NextResponse(JSON.stringify({ error: "Invalid request signature" }), {
      status: 400,
    });
  }

  if (payload.type === "url_verification") {
    return handleUrlVerification(
      new SlackContext<"url_verification">(payload as SlackEventPayload<"url_verification">),
    );
  }

  if (!payload.event_id) {
    console.error("Missing event_id in payload");
    return new NextResponse(JSON.stringify({ error: "Missing event_id" }), {
      status: 400,
    });
  }

  await inngest.send({
    name: "slack/event",
    id: payload.event_id,
    data: payload,
  });

  return NextResponse.json({ success: true }, { status: 200 });
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

  if (signature.length !== computedSignature.length) {
    return false;
  }

  // Use a secure comparison function to prevent timing attacks
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computedSignature));
}
