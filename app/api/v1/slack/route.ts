import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import SlackEventHandler from "./slack-event-handler";

// Slack Events API endpoint
export async function POST(req: NextRequest) {
  if (!env.SLACK_SIGNING_SECRET) {
    console.error("Missing SLACK_SIGNING_SECRET environment variable");
    return new NextResponse(JSON.stringify({ error: "Configuration error" }), {
      status: 500,
    });
  }

  const handler = new SlackEventHandler(env.SLACK_SIGNING_SECRET);
  return handler.handleEvent(req);
}
