"use server";

import crypto from "crypto";
import db from "@/db";
import * as schema from "@/db/schema";
import { formatClerkUser } from "@/lib/clerk";
import { eq, and, isNull } from "drizzle-orm";
import { decrypt, encrypt, generateHash } from "@/services/encrypt";

const KEY_PREFIX = "iffy_";
const KEY_LENGTH = 32;

function createVisualKey(key: string) {
  const prefix = key.slice(0, KEY_PREFIX.length + 2);
  const suffix = key.slice(-4);
  const masked = "*".repeat(key.length - prefix.length - suffix.length);
  return prefix + masked + suffix;
}

export async function getApiKeys({ organizationId }: { organizationId: string }) {
  const keys = await db.query.apiKeys.findMany({
    where: and(eq(schema.apiKeys.organizationId, organizationId), isNull(schema.apiKeys.deletedAt)),
    orderBy: (apiKeys, { desc }) => [desc(apiKeys.createdAt)],
  });

  const records = await Promise.all(
    keys.map(async ({ encryptedKey, ...key }) => ({
      ...key,
      previewKey: createVisualKey(decrypt(encryptedKey)),
      createdBy: await formatClerkUser(key.clerkUserId),
    })),
  );

  return records;
}

export async function createApiKey({
  organizationId,
  clerkUserId,
  name,
}: {
  organizationId: string;
  clerkUserId: string;
  name: string;
}) {
  const generatedKey = KEY_PREFIX + crypto.randomBytes(KEY_LENGTH).toString("hex");
  const [newKey] = await db
    .insert(schema.apiKeys)
    .values({
      organizationId,
      clerkUserId,
      name,
      encryptedKey: encrypt(generatedKey),
      encryptedKeyHash: generateHash(generatedKey),
    })
    .returning();

  if (!newKey) {
    throw new Error("Failed to create API key");
  }

  return {
    key: {
      ...newKey,
      previewKey: createVisualKey(generatedKey),
      createdBy: await formatClerkUser(clerkUserId),
    },
    decryptedKey: generatedKey,
  };
}

export async function deleteApiKey({ organizationId, id }: { organizationId: string; id: string }) {
  await db
    .update(schema.apiKeys)
    .set({ deletedAt: new Date() })
    .where(and(eq(schema.apiKeys.organizationId, organizationId), eq(schema.apiKeys.id, id)));
}

export async function validateApiKey(apiKey?: string) {
  if (!apiKey) return null;

  const [key] = await db
    .update(schema.apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(and(eq(schema.apiKeys.encryptedKeyHash, generateHash(apiKey)), isNull(schema.apiKeys.deletedAt)))
    .returning({ organizationId: schema.apiKeys.organizationId });

  return key?.organizationId ?? null;
}
