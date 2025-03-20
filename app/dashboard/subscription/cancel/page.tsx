import { authWithOrg } from "@/app/dashboard/auth";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Subscription Cancelled | Iffy",
};

export default async function SubscriptionCancelPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  await authWithOrg();

  redirect("/dashboard/subscription");
}
