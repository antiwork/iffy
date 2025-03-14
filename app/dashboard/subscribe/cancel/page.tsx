import { auth } from "@clerk/nextjs/server";
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
  const { orgId } = await auth();

  if (!orgId) {
    redirect("/");
  }
  redirect("/dashboard/subscribe");
}
