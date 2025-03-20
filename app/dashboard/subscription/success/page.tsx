import { Metadata } from "next";
import { env } from "@/lib/env";
import Stripe from "stripe";
import { redirect } from "next/navigation";
import { authWithOrg } from "@/app/dashboard/auth";
import { createSubscription } from "@/services/stripe/subscriptions";

const stripe = new Stripe(env.STRIPE_API_KEY);

export const metadata: Metadata = {
  title: "Subscription Success | Iffy",
};

export default async function SubscriptionSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { orgId } = await authWithOrg();

  const { session_id } = await searchParams;

  if (!session_id) {
    redirect("/dashboard/subscription");
  }

  const session = await stripe.checkout.sessions.retrieve(session_id);

  if (!session || session.status !== "complete" || !session.subscription || typeof session.subscription !== "string") {
    redirect("/dashboard/subscription");
  }

  await createSubscription(orgId, session.subscription);

  redirect("/dashboard");
}
