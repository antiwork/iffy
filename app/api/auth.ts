import { validateApiKey } from "@/services/api-keys";
import { NextRequest } from "next/server";

export async function authenticateRequest(
  req: NextRequest,
): Promise<[isValid: false, authOrganizationId: null] | [isValid: true, authOrganizationId: string]> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return [false, null];
  }
  const apiKey = authHeader.split(" ")[1];
  const authOrganizationId = await validateApiKey(apiKey);
  if (!authOrganizationId) {
    return [false, null];
  }
  return [true, authOrganizationId];
}
