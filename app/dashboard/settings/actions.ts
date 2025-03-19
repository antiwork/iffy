"use server";

import { actionClient } from "@/lib/action-client";
import { createCustomerPortalSession } from "@/services/stripe/subscriptions";
import { redirect } from "next/navigation";

export const createPortalSession = actionClient.action(async ({ ctx: { clerkOrganizationId } }) => {
  const url = await createCustomerPortalSession(clerkOrganizationId);
  if (!url) {
    throw new Error("Failed to create portal session");
  }
  redirect(url);
});
