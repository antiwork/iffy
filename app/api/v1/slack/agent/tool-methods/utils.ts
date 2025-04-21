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
    return await db.query.userRecords.findFirst({ where: eq(schema.userRecords.email, userId) });
  }

  try {
    const user = await db.query.userRecords.findFirst({ where: eq(schema.userRecords.clientId, userId) });
    if (user) {
      return user;
    }
  } catch {}

  try {
    const user = await db.query.userRecords.findFirst({ where: eq(schema.userRecords.id, userId) });
    if (user) {
      return user;
    }
  } catch {}

  try {
    const user = await db.query.userRecords.findFirst({ where: eq(schema.userRecords.id, userId) });
    if (user) {
      return user;
    }
  } catch {}

  return null;
}

export default findThirdPartyUserById;
