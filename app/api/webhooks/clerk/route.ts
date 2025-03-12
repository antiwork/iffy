import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { WebhookEvent } from "@clerk/nextjs/server";
import { inngest } from "@/inngest/client";

export async function POST(req: NextRequest) {
  // Get the headers
  const svix_id = req.headers.get("svix-id") || "";
  const svix_timestamp = req.headers.get("svix-timestamp") || "";
  const svix_signature = req.headers.get("svix-signature") || "";

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new NextResponse("Error: Missing svix headers", { status: 400 });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your webhook secret
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("Error: Missing CLERK_WEBHOOK_SECRET");
    return new NextResponse("Error: Missing webhook secret", { status: 500 });
  }

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(webhookSecret);

  let evt: WebhookEvent;

  // Verify the webhook payload
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

  // Handle the webhook event
  const eventType = evt.type;

  if (eventType === "user.created") {
    // Send the event to Inngest for processing
    await inngest.send({
      name: "clerk/user.created",
      data: evt,
    });
  }

  return new NextResponse("Webhook received", { status: 200 });
}
