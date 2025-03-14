import { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { env } from "@/lib/env";
import Stripe from "stripe";
import { redirect } from "next/navigation";
import { updateOrganization } from "@/services/organizations";
import { auth } from "@clerk/nextjs/server";

const stripe = new Stripe(env.STRIPE_API_KEY);

export const metadata: Metadata = {
  title: "Subscription Success | Iffy",
};

export default async function SubscriptionSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { orgId } = await auth();

  if (!orgId) {
    redirect("/");
  }

  const { session_id } = await searchParams;

  if (!session_id) {
    redirect("/dashboard/subscribe");
  }

  const session = await stripe.checkout.sessions.retrieve(session_id);

  if (!session || session.status !== "complete" || !session.subscription || typeof session.subscription !== "string") {
    redirect("/dashboard/subscribe");
  }

  await updateOrganization(orgId, {
    stripeSubscriptionId: session.subscription,
  });

  return (
    <div className="container flex h-[calc(100vh-4rem)] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Subscription successful</CardTitle>
          <CardDescription>Your subscription has been activated</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button asChild>
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
