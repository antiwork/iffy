import crypto from "crypto";

export function deriveSecret(mainKey: string, context: string): string {
  const derivedKey = crypto.hkdfSync("sha256", mainKey, "", context, 32);

  return Buffer.from(derivedKey).toString("base64");
}
