import { inngest } from "@/inngest/client";
import { addUserToAudience } from "@/services/audience";
import { z } from "zod";

export const addNewClerkUserToResendAudience = inngest.createFunction(
  { id: "add-new-clerk-user-to-resend-audience" },
  { event: "clerk/user.created" },
  async ({ event, step }) => {
    const { data } = event;

    // Find the primary or first email address
    const emailObj =
      data.email_addresses.find((email) => email.id === data.primary_email_address_id) || data.email_addresses[0];

    if (!emailObj) {
      console.log("No email address found for user:", data.id);
      return;
    }

    await step.run("add-to-resend-audience", async () => {
      return await addUserToAudience({
        email: emailObj.email_address,
        firstName: data.first_name ?? undefined,
        lastName: data.last_name ?? undefined,
      });
    });
  },
);

export default [addNewClerkUserToResendAudience];
