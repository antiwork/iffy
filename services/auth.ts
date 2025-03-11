import { auth } from "@clerk/nextjs/server";

export async function hasAdminRole() {
  const { has } = await auth();

  return has({ role: "org:admin" });
}
