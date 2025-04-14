import { validateApiKey } from "@/services/api-keys";
import { NextRequest } from "next/server";

export async function authenticateRequest(
  req: NextRequest,
): Promise<[isValid: false, organizationId: null] | [isValid: true, organizationId: string]> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return [false, null];
  }
  const apiKey = authHeader.split(" ")[1];
  const organizationId = await validateApiKey(apiKey);
  if (!organizationId) {
    return [false, null];
  }
  return [true, organizationId];
}
