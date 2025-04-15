"use server";
import * as schema from "@/db/schema";
import db from "@/db";
import { eq } from "drizzle-orm";

function formatAgentUserId(userId: string): {
  clientId?: string | null;
  iffyId?: string | null;
  email?: string | null;
  slackId?: string | null;
  orgId?: string | null;
} {
  if (userId.startsWith("user_")) {
    return { clientId: userId };
  }

  if (userId.includes("@")) {
    return { email: userId };
  }

  if (userId.startsWith("U")) {
    return { slackId: userId };
  }

  if (userId.startsWith("org_")) {
    return { orgId: userId };
  }

  return { iffyId: userId };
}

async function findUserById(userId: string) {
  const { clientId, iffyId, email /**orgId , slackId */ } = formatAgentUserId(userId);

  if (clientId) {
    return db.query.users.findFirst({ where: eq(schema.users.clientId, clientId) });
  }

  if (email) {
    return db.query.users.findFirst({ where: eq(schema.users.email, email) });
  }

  if (iffyId) {
    return db.query.users.findFirst({ where: eq(schema.users.id, iffyId) });
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
