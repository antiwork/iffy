import { WebhookEvent } from "@clerk/nextjs/server";
import { Webhook } from "svix";
import { env } from "@/lib/env";
import { createOrganisation } from "@/services/organisations";
import * as stripeService from "@/services/stripe";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = env.CLERK_WEBHOOK_SECRET;

  let evt: WebhookEvent;
  try {
    evt = await constructEvent(req, WEBHOOK_SECRET);
  } catch (error) {
    return new Response(error instanceof Error ? error.message : "Error occurred", {
      status: 400,
    });
  }

  if (evt.type === "organization.created") {
    let stripeCustomer;
    try {
      const { id: clerkOrgId, name } = evt.data;

      // Create Stripe customer assosiated with Clerk org
      stripeCustomer = await stripeService.createCustomer({
        clerkOrgId,
        name,
      });

      // Initiate new db record, linking organisation with Stripe customer
      const organization = await createOrganisation(clerkOrgId, stripeCustomer.id);

      if (!organization) {
        throw new Error("Failed to create organization");
      }

      // Create Trial subscription for Stripe customer
      // This will automatically update database via webhook
      await stripeService.createTrialSubscription(stripeCustomer.id);

      return new Response("Organization created successfully", { status: 200 });
    } catch (error) {
      // Roll back
      if (stripeCustomer?.id) {
        await stripeService.deleteCustomer(stripeCustomer.id);
      }

      console.error("Error processing organization creation:", error);
      return new Response("Error processing organization creation", { status: 500 });
    }
  }

  return new Response("Webhook received", { status: 200 });
}

async function constructEvent(req: Request, webhookSecret: string): Promise<WebhookEvent> {
  const svix_id = req.headers.get("svix-id") ?? "";
  const svix_timestamp = req.headers.get("svix-timestamp") ?? "";
  const svix_signature = req.headers.get("svix-signature") ?? "";

  if (!svix_id || !svix_timestamp || !svix_signature) {
    throw new Error("Missing required Svix headers");
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(webhookSecret);

  try {
    return wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    throw new Error("Invalid webhook signature");
  }
}
