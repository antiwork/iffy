"use server";

import { Resend } from "resend";
import { env } from "@/lib/env";

export async function addUserToAudience({
  email,
  firstName,
  lastName,
}: {
  email: string;
  firstName?: string;
  lastName?: string;
}) {
  if (!env.RESEND_API_KEY || !env.RESEND_AUDIENCE_ID) {
    console.log(`Skipping audience addition for ${email} - Resend not configured`);
    return;
  }

  const resend = new Resend(env.RESEND_API_KEY);

  try {
    const { data, error } = await resend.contacts.create({
      email,
      firstName,
      lastName,
      audienceId: env.RESEND_AUDIENCE_ID,
    });

    if (error) {
      console.error("Error adding contact to audience:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error adding contact to audience:", error);
    throw error;
  }
}
