import crypto from "crypto";

/**
 * Derives a secret key from a main key using a specific context
 * @param mainKey The main secret key to derive from
 * @param context The context string to use for derivation
 * @returns A base64 encoded derived secret
 */
export function deriveSecret(mainKey: string, context: string): string {
  // Use hkdfSync with sha256 algorithm and no salt
  const derivedKey = crypto.hkdfSync(
    "sha256",     // Hash algorithm
    mainKey,      // Input key material
    "",           // No salt
    context,      // Context info
    32            // Output key length in bytes
  );
  
  // Convert the derived key to base64 string
  return Buffer.from(derivedKey).toString("base64");
}
