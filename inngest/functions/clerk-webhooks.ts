import { inngest } from "@/inngest/client";
import { addContactToAudience } from "@/services/resend-audiences";
import { z } from "zod";

// Define the event schema for Clerk user creation
const clerkUserCreatedSchema = z.object({
  data: z.object({
    email_addresses: z.array(
      z.object({
        email_address: z.string().email(),
        id: z.string(),
        verification: z.object({
          status: z.string(),
        }),
      }),
    ),
    first_name: z.string().nullable(),
    last_name: z.string().nullable(),
    id: z.string(),
  }),
});

export const processClerkUserCreated = inngest.createFunction(
  { id: "process-clerk-user-created" },
  { event: "clerk/user.created" },
  async ({ event, step }) => {
    const { data } = event;

    // Validate the event data
    const parsedData = clerkUserCreatedSchema.parse(data);

    // Find the primary or first verified email
    const emailObj =
      parsedData.data.email_addresses.find((email) => email.verification.status === "verified") ||
      parsedData.data.email_addresses[0];

    if (!emailObj) {
      console.log("No email address found for user:", parsedData.data.id);
      return;
    }

    // Add the user to the Resend audience
    await step.run("add-to-resend-audience", async () => {
      return await addContactToAudience({
        email: emailObj.email_address,
        firstName: parsedData.data.first_name || undefined,
        lastName: parsedData.data.last_name || undefined,
      });
    });

    return { success: true };
  },
);

export default [processClerkUserCreated];
