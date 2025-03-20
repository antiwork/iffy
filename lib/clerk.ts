import { clerkClient } from "@clerk/nextjs/server";

export async function formatClerkUser(clerkUserId: string) {
  const clerkUser = await (await clerkClient()).users.getUser(clerkUserId);
  let output = clerkUserId;
  try {
    const email = clerkUser.emailAddresses.find((email) => email.id === clerkUser.primaryEmailAddressId)?.emailAddress;
    if (email) {
      output = email;
    }
    if (email && clerkUser.firstName && clerkUser.lastName) {
      output = `${clerkUser.firstName} ${clerkUser.lastName} (${email})`;
    }
  } catch (error) {}
  return output;
}
