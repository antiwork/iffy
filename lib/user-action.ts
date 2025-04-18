"use server";

import db from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";

export async function formatUserWithUserId(userId: string) {
  const user = await db.query.users.findFirst({
    where: eq(schema.users.id, userId),
  });
  let primary = userId;
  if (user && user.email) primary = user.email;
  if (user && user.name) primary = `${user.name} (${primary})`;
  return primary;
}
