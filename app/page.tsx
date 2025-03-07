import { Logo } from "@/components/logo";
import { BuyMeACoffee } from "@/components/logos/buy-me-a-coffee";
import { Gumroad } from "@/components/logos/gumroad";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import dashboard from "./dashboard-moderations.png";
import dashboardUsers from "./dashboard-users.png";
import dashboardRules from "./dashboard-rules.png";
import { LayoutDashboard, Mail, RefreshCw, Tag, Users, Shield } from "lucide-react";
import * as schema from "@/db/schema";
import db from "@/db";
import { count, gte } from "drizzle-orm";
import { cache } from "@/lib/cache";
import { IffyImage } from "./iffy-image";
import { CountLazy } from "./count-lazy";
import AntiworkFooter from "@/components/antiwork-footer";
import { DashboardTabs } from "@/components/dashboard-tabs";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { enablePublicSignupFlag } from "@/flags";

const getCount = cache(
  async () => {
    const monthAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30); // 30 days ago
    const hourAgo = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago

    const [monthCount] = await db
      .select({ count: count() })
      .from(schema.moderations)
      .where(gte(schema.moderations.createdAt, monthAgo));

    const [hourCount] = await db
      .select({ count: count() })
      .from(schema.moderations)
      .where(gte(schema.moderations.createdAt, hourAgo));

    if (typeof monthCount === "undefined" || typeof hourCount === "undefined") {
      throw new Error("Failed to get moderation count");
    }

    return {
      count: Number(monthCount.count),
      ratePerHour: Number(hourCount.count),
      countAt: new Date(),
    };
  },
  ["count"],
  { revalidate: 60 * 60 },
);

export default async function Page() {
  const { count, countAt, ratePerHour } = await getCount();
  const enablePublicSignup = await enablePublicSignupFlag();

  return (
    <div className="min-h-screen space-y-12 bg-white pt-6 font-sans text-black sm:space-y-24 sm:pt-12">
      <main className="container mx-auto space-y-12">
        <div className="flex items-center justify-between">
          <div>
            <Logo className="dark:text-black" />
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="https://docs.iffy.com">Docs</Link>
            </Button>
            <SignedIn>
              <Button asChild variant="secondary" size="sm">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            </SignedIn>
            <SignedOut>
              {enablePublicSignup ? (
                <>
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/sign-in">Sign in</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href="/sign-up">Sign up</Link>
                  </Button>
                </>
              ) : (
                <Button asChild size="sm">
                  <Link href="/sign-in">Sign in</Link>
                </Button>
              )}
            </SignedOut>
          </div>
        </div>
        <div className="space-y-12 sm:space-y-24">
          <div className="flex flex-col gap-12 lg:flex-row lg:items-center">
            <div className="flex-1 space-y-12">
              <div className="space-y-4">
                <div className="w-full sm:w-auto">
                  <span className="mr-2 rounded-md bg-gray-100 px-2 py-1 font-sans leading-6 font-normal text-gray-500">
                    <CountLazy count={count} countAt={countAt} ratePerHour={ratePerHour} />
                  </span>
                  <span className="text-gray-500">moderations in the last 30 days</span>
                </div>
                <h1 className="max-w-3xl text-5xl leading-none font-medium tracking-[-0.02em] sm:text-[60px]">
                  Intelligent content moderation at scale
                </h1>
                <div className="flex flex-col items-start justify-between gap-8 md:gap-16 lg:flex-row">
                  <p className="max-w-2xl text-lg text-balance">
                    Keep unwanted content off your platform without managing a team of moderators.{" "}
                  </p>
                </div>
                {enablePublicSignup ? (
                  <Button asChild className="rounded-full px-5 py-2.5 text-lg">
                    <Link href="/sign-up">Start for free</Link>
                  </Button>
                ) : (
                  <Button asChild className="rounded-full px-5 py-2.5 text-lg">
                    <Link href="/sign-in">Sign in</Link>
                  </Button>
                )}
              </div>
              <div className="shrink-0 space-y-4">
                <h2 className="font-sans text-sm font-normal text-balance text-gray-500">
                  Trusted by leading companies to help keep the Internet clean and safe.
                </h2>
                <div className="flex flex-col space-y-4 space-x-0 opacity-50 grayscale sm:flex-row sm:space-y-0 sm:space-x-8">
                  <Gumroad />
                  <BuyMeACoffee />
                </div>
              </div>
            </div>
            <div className="flex-1">
              <div className="relative">
                <div className="decoration-skip-ink-none gap-2 rounded-lg border border-gray-200 bg-white p-4 font-mono text-sm leading-[1.05] font-normal tracking-[-0.02em] text-gray-500 underline-offset-[from-font] shadow-lg">
                  <div className="mb-2">Profile image</div>
                  <IffyImage />
                </div>
                <div className="decoration-skip-ink-none absolute top-8 -right-8 gap-2 rounded-lg border border-gray-200 bg-white p-4 font-mono text-sm leading-[1.05] font-normal tracking-[-0.02em] text-gray-500 underline-offset-[from-font] shadow-lg">
                  <div>Chat message</div>
                  <div className="my-4 text-2xl">
                    <span className="rounded-md border border-red-500 px-2 py-1 text-red-500">f***</span> all of you
                  </div>
                  <div className="mt-2 text-gray-800 uppercase">Unnecessary profanity</div>
                  <div className="mt-2 text-red-500 uppercase">Suspended</div>
                </div>
              </div>
            </div>
          </div>
          <DashboardTabs moderationsImage={dashboard} usersImage={dashboardUsers} rulesImage={dashboardRules} />
          <div className="space-y-12">
            <h2 className="font-sans text-3xl leading-tight font-normal">
              We handle the entire lifecycle of moderation, so you don&apos;t have to.
            </h2>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="space-y-4">
                <LayoutDashboard className="h-8 w-8" />
                <h3 className="font-sans text-xl">Moderation Dashboard</h3>
                <p className="text-base leading-relaxed">
                  Efficiently manage and review content with our intuitive dashboard. Streamline your moderation process
                  and take quick actions to maintain platform integrity.
                </p>
              </div>
              <div className="space-y-4">
                <Mail className="h-8 w-8" />
                <h3 className="font-sans text-xl">Appeals Management</h3>
                <p className="text-base leading-relaxed">
                  Handle user appeals efficiently through email notifications and a user-friendly web form. Streamline
                  the review process and maintain open communication with your users.
                </p>
              </div>
              <div className="space-y-4">
                <Tag className="h-8 w-8" />
                <h3 className="font-sans text-xl">Powerful Rules & Presets</h3>
                <p className="text-base leading-relaxed">
                  Use Iffy&apos;s powerful presets and define your own moderation guidelines to tailor content filtering
                  to your platform&apos;s specific needs and community standards.
                </p>
              </div>
              <div className="space-y-4">
                <RefreshCw className="h-8 w-8" />
                <h3 className="font-sans text-xl">User Lifecycle</h3>
                <p className="text-base leading-relaxed">
                  Automatically suspend users with flagged content (and handle automatic compliance when moderated
                  content is removed).
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <AntiworkFooter />
    </div>
  );
}
