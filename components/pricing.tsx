"use client";

import { useState, useEffect } from "react";
import { Check, Shield } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ProductsCatalog, isFixedFeeAndOverage, isPayAsYouGo } from "@/products/types";
import { motion } from "framer-motion";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Separator } from "@/components/ui/separator";

type PricingTierExtras = {
  features: string[];
  moderationsPerMonth: number | string;
  cta: string;
  ctaDetails: string;
};

const PRODUCTS_FEATURES: Record<keyof ProductsCatalog, PricingTierExtras> = {
  free: {
    features: ["2 moderation presets", "User suspension lifecycle", "Webhook events", "Easy integration"],
    moderationsPerMonth: 0,
    cta: "Start for free",
    ctaDetails: "Start for free. Upgrade anytime.",
  },
  growth: {
    features: [
      "6 moderation presets",
      "Appeals inbox",
      "Email notifications to users",
      "User suspension lifecycle",
      "Webhook events",
      "Easy integration",
    ],
    moderationsPerMonth: 10000,
    cta: "Start free trial",
    ctaDetails: "Start free trial. Upgrade anytime.",
  },
  pro: {
    features: [
      "6 moderation presets",
      "Appeals inbox",
      "Email notifications to users",
      "User suspension lifecycle",
      "Webhook events",
      "Easy integration",
    ],
    moderationsPerMonth: 100000,
    cta: "Start free trial",
    ctaDetails: "Start free trial. Upgrade anytime.",
  },
  enterprise: {
    features: [
      "6 moderation presets",
      "Appeals inbox",
      "Email notifications to users",
      "User suspension lifecycle",
      "Webhook events",
      "Easy integration",
    ],
    moderationsPerMonth: "Unlimited",
    cta: "Contact sales",
    ctaDetails: "Contact sales for a custom plan.",
  },
} as const;

function PlanPrice({
  prices,
  term,
}: {
  prices: ProductsCatalog[keyof ProductsCatalog]["prices"];
  term: "monthly" | "yearly";
}) {
  const termFormatted = term === "monthly" ? "month" : "year";
  if (isPayAsYouGo(prices)) {
    return (
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold">$0</span>
        <span className="text-gray-500">/ {termFormatted}</span>
      </div>
    );
  }

  if (isFixedFeeAndOverage(prices)) {
    const flatKey = term === "monthly" ? "flat_monthly" : "flat_yearly";
    return (
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold">${((prices[flatKey].unit_amount ?? 0) / 100).toFixed(2)}</span>
        <span className="text-gray-500">/ {termFormatted}</span>
      </div>
    );
  }

  return (
    <div className="flex items-baseline gap-1">
      <span className="text-2xl font-bold">Custom</span>
    </div>
  );
}

function ModerationsPrice({
  prices,
  moderationsPerMonth,
}: {
  prices: ProductsCatalog[keyof ProductsCatalog]["prices"];
  moderationsPerMonth: number | string;
}) {
  if (isPayAsYouGo(prices)) {
    return (
      <div className="flex items-baseline gap-1">
        <span className="text-gray-500">+</span>
        <span className="font-bold">${((prices.metered.unit_amount ?? 0) / 100).toFixed(2)}</span>
        <span className="text-gray-500">/ moderation</span>
      </div>
    );
  }

  if (isFixedFeeAndOverage(prices)) {
    return (
      <div className="flex items-baseline gap-1">
        <span className="font-bold">{moderationsPerMonth.toLocaleString()}</span>
        <span className="text-gray-500">moderations / month</span>
      </div>
    );
  }

  return (
    <div className="flex items-baseline gap-1">
      <span className="font-bold">{moderationsPerMonth.toLocaleString()}</span>
      <span className="text-gray-500">moderations / month</span>
    </div>
  );
}

export function Pricing({
  products,
  onSelect,
}: {
  products: ProductsCatalog;
  onSelect?: (tier: keyof ProductsCatalog) => void;
}) {
  const [tick, setTick] = useState(2);
  const [recommendedTier, setRecommendedTier] = useState("Growth");
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");

  const steps = [
    { tick: 0, volume: 0, label: "0" },
    { tick: 1, volume: 1000, label: "1k" },
    { tick: 2, volume: 5000, label: "5k" },
    { tick: 3, volume: 10000, label: "10k" },
    { tick: 4, volume: 50000, label: "50k" },
    { tick: 5, volume: 100000, label: "100k" },
    { tick: 6, volume: 1000000, label: "1M+" },
  ] as const;

  function tickToVolume(tick: number) {
    if (tick === 0) return 0;
    const upper = steps.find((step) => step.tick >= tick);
    const lower = [...steps].reverse().find((step) => step.tick < tick);

    const lowerVolume = lower!.volume;
    const upperVolume = upper!.volume;
    const ratio = (tick - lower!.tick) / (upper!.tick - lower!.tick);
    return Math.round(lowerVolume + (upperVolume - lowerVolume) * ratio);
  }

  function onVolumeChange(value: number[]) {
    setTick(value[0] ?? 0);
  }

  const volume = tickToVolume(tick);

  useEffect(() => {
    if (volume <= 1000) {
      setRecommendedTier("free");
    } else if (volume <= 10000) {
      setRecommendedTier("growth");
    } else if (volume <= 100000) {
      setRecommendedTier("pro");
    } else {
      setRecommendedTier("enterprise");
    }
  }, [volume]);

  return (
    <div className="min-h-screen overflow-hidden bg-white font-sans text-black">
      <main className="container mx-auto space-y-8 px-6 py-12 sm:px-8">
        <div className="space-y-6 text-center">
          <h2 className="text-2xl font-semibold">How many moderations do you need per month?</h2>
          <div className="mx-auto max-w-3xl px-8 pb-8">
            <div className="relative pb-4">
              <Slider value={[tick]} onValueChange={onVolumeChange} max={6} min={0} step={0.0001} className="py-4" />
              <div className="flex justify-between text-sm text-gray-500">
                {steps.map((step) => (
                  <div
                    key={step.volume}
                    className="absolute -translate-x-1/2 text-sm text-gray-400"
                    style={{ left: `${(step.tick / 6) * 100}%`, bottom: "-1.5rem" }}
                  >
                    {step.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-2xl font-bold">{volume.toLocaleString()}</span>
            <span className="text-gray-500">moderations / month</span>
          </div>
        </div>
        <div className="flex items-center justify-center">
          <div className="h-px w-full bg-gray-200"></div>
          <div className="mx-4 flex h-12 w-12 items-center justify-center rounded-full bg-white">
            <Shield className="h-6 w-6 text-gray-400" />
          </div>
          <div className="h-px w-full bg-gray-200"></div>
        </div>
        <div className="flex items-center justify-center">
          <ToggleGroup
            type="single"
            value={billingPeriod}
            onValueChange={(value) => value && setBillingPeriod(value as "monthly" | "yearly")}
            className="inline-flex items-center rounded-lg border bg-stone-100"
          >
            <ToggleGroupItem
              value="monthly"
              className="rounded-lg px-6 py-2 transition-colors data-[state=on]:bg-white"
            >
              Monthly
            </ToggleGroupItem>
            <ToggleGroupItem value="yearly" className="rounded-lg px-6 py-2 transition-colors data-[state=on]:bg-white">
              Yearly
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <div className="grid items-start gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Object.entries(products).map(([key, tier], index) => {
            const features = PRODUCTS_FEATURES[key as keyof ProductsCatalog];
            return (
              <div key={key} className="transition-transform duration-200 hover:scale-105">
                <Card
                  onClick={() => onSelect?.(key as keyof ProductsCatalog)}
                  className={`group relative cursor-pointer ${key === recommendedTier ? "z-10 border-2 border-emerald-500 shadow-lg" : ""}`}
                >
                  {key === recommendedTier && (
                    <motion.div
                      className="absolute -top-3 right-0 left-0 mx-auto w-32 rounded bg-emerald-100 py-1 text-center text-sm font-medium text-emerald-800"
                      initial={{ y: -20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.3, delay: 0.2 }}
                    >
                      Recommended
                    </motion.div>
                  )}
                  <CardHeader className="space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-mono text-xl font-bold">{tier.name}</h3>
                      <PlanPrice prices={tier.prices} term={billingPeriod} />
                      <p className="text-sm text-gray-500">{tier.description}</p>
                    </div>
                    <Separator />
                    <ModerationsPrice prices={tier.prices} moderationsPerMonth={features.moderationsPerMonth} />
                    <Separator />
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    <Button
                      variant={key === recommendedTier ? "default" : "secondary"}
                      className="w-full cursor-pointer group-hover:opacity-90"
                    >
                      <span className="relative z-10">{features.cta}</span>
                    </Button>
                    <p className="text-center text-xs text-gray-500">{features.ctaDetails}</p>
                    <Separator />
                    <div className="space-y-4">
                      <h4 className="font-mono font-bold">Features included:</h4>
                      <ul className="grid gap-2 text-sm">
                        {features.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-emerald-500" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
