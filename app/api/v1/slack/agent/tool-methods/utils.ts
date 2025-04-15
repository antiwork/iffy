"use server";
import * as schema from "@/db/schema";
import db from "@/db";
import { eq } from "drizzle-orm";

async function findUserById(userId: string) {
  if (userId.includes("@")) {
    return await db.query.users.findFirst({ where: eq(schema.users.email, userId) });
  }

  try {
    const user = await db.query.users.findFirst({ where: eq(schema.users.clientId, userId) });
    if (user) {
      return user;
    }
  } catch (e) {
    console.error("Error in findUserById:", e);
  }

  try {
    const user = await db.query.users.findFirst({ where: eq(schema.users.id, userId) });
    if (user) {
      return user;
    }
  } catch (e) {
    console.error("Error in findUserById:", e);
  }

  // if (orgId) {
  //   return db.query.organizations.findFirst({ where: eq(schema.organizations.id, orgId) });
  // }

  // TODO:??
  // if (slackId) {
  //   return db.query.users.findFirst({ where: eq(schema.users.slackId, slackId) });
  // }

  return null;
}

export default findUserById;
