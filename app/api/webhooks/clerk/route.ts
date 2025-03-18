import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { WebhookEvent } from "@clerk/nextjs/server";
import { inngest } from "@/inngest/client";
import { env } from "@/lib/env";

export async function POST(req: NextRequest) {
  const svix_id = req.headers.get("svix-id");
  const svix_timestamp = req.headers.get("svix-timestamp");
  const svix_signature = req.headers.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new NextResponse("Error: Missing svix headers", { status: 400 });
  }

  if (!env.CLERK_WEBHOOK_SECRET) {
    return new NextResponse("Error: Missing CLERK_WEBHOOK_SECRET", { status: 500 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(env.CLERK_WEBHOOK_SECRET);

  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new NextResponse("Error verifying webhook", { status: 400 });
  }

  const eventType = evt.type;

  if (eventType === "user.created") {
    await inngest.send({
      name: "clerk/user.created",
      data: evt.data,
    });
  }

  return new NextResponse("Webhook received", { status: 200 });
}
