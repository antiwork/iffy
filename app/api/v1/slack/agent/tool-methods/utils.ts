"use server";
import * as schema from "@/db/schema";
import db from "@/db";
import { eq } from "drizzle-orm";

/**
 * Optimistically finds a third-party user by their ID which can be one of the following:
 * - email address
 * - clientId
 * - id
 */
async function findThirdPartyUserById(userId: string) {
  if (userId.includes("@")) {
    return await db.query.users.findFirst({ where: eq(schema.users.email, userId) });
  }

  try {
    const user = await db.query.users.findFirst({ where: eq(schema.users.clientId, userId) });
    if (user) {
      return user;
    }
  } catch {}

  try {
    const user = await db.query.users.findFirst({ where: eq(schema.users.id, userId) });
    if (user) {
      return user;
    }
  } catch {}

  return null;
}

export default findThirdPartyUserById;
