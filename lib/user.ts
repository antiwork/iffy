"use server";

import db from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";

export async function formatUser(userId: string) {
  const user = await db.query.users.findFirst({
    where: eq(schema.users.id, userId),
  });
  if (!user) {
    throw new Error("User not found");
  }
  return `${user.name} (${user.email})`;
}
