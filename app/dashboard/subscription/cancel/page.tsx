import { authWithOrg } from "@/app/dashboard/auth";
import { env } from "@/lib/env";
import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Subscription Cancelled | Iffy",
};

export default async function SubscriptionCancelPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  if (!env.ENABLE_BILLING) {
    notFound();
  }

  await authWithOrg();

  redirect("/dashboard/subscription");
}
