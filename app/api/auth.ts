import { validateApiKey } from "@/services/api-keys";
import { NextRequest } from "next/server";

export async function authenticateRequest(
  req: NextRequest,
): Promise<[isValid: false, clerkOrganizationId: null] | [isValid: true, clerkOrganizationId: string]> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return [false, null];
  }
  const apiKey = authHeader.split(" ")[1];
  const clerkOrganizationId = await validateApiKey(apiKey);
  if (!clerkOrganizationId) {
    return [false, null];
  }
  return [true, clerkOrganizationId];
}
