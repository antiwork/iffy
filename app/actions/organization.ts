"use server";

import { auth } from "@/lib/auth";

export async function checkSlugAvailability(slug: string): Promise<boolean> {
  try {
    const { status } = await auth.api.checkOrganizationSlug({ body: { slug } });
    return status;
  } catch {
    return false;
  }
}
