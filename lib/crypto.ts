import * as crypto from "crypto";

export function deriveSecret(mainKey: string, context: string): string {
  // Use hkdfSync with sha256 algorithm and no salt
  const derivedKey = crypto.hkdfSync(
    "sha256", // Hash algorithm
    mainKey, // Input key material
    "", // No salt
    context, // Context info
    32, // Output key length in bytes
  );

  // Convert the derived key to base64 string
  return Buffer.from(derivedKey).toString("base64");
}
