"use client";

import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ProductsConfig, FreePrices, GrowthPrices, ProPrices } from "@/products/types";
import { Shield } from "lucide-react";

function Price({ prices, term }: { prices: FreePrices | GrowthPrices | ProPrices; term: "monthly" | "yearly" }) {
  if ("metered" in prices) {
    return (
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold">{prices.metered.unit_amount}</span>
        <span className="text-muted-foreground">/ moderation</span>
      </div>
    );
  }
  return (
    <div className="flex items-baseline gap-1">
      <span className="text-2xl font-bold">{prices.flat.unit_amount}</span>
      <span className="text-muted-foreground">/mo</span>
    </div>
  );
}

export function Pricing({ products }: { products: ProductsConfig }) {
  const [tick, setTick] = useState(2);
  const [recommendedTier, setRecommendedTier] = useState("Growth");

  function onVolumeChange(value: number[]) {
    setTick(value[0] ?? 0);
  }

  const steps = [
    { tick: 0, volume: 0, label: "0" },
    { tick: 1, volume: 100, label: "100" },
    { tick: 2, volume: 1000, label: "1k" },
    { tick: 3, volume: 5000, label: "5k" },
    { tick: 4, volume: 10000, label: "10k" },
    { tick: 5, volume: 50000, label: "50k" },
    { tick: 6, volume: 100000, label: "100k" },
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

  return (
    <div>
      <div className="space-y-6">
        <div className="flex items-center justify-center">
          <div className="h-px w-full bg-gray-200"></div>
          <div className="mx-4 flex h-12 w-12 items-center justify-center rounded-full bg-white">
            <Shield className="h-6 w-6 text-gray-400" />
          </div>
          <div className="h-px w-full bg-gray-200"></div>
        </div>
        <h2 className="font-mono text-2xl font-bold">How many moderations do you need per month?</h2>
        <div className="mx-auto max-w-3xl px-8">
          <div className="relative pb-4">
            <Slider value={[tick]} onValueChange={onVolumeChange} max={6} min={0} step={0.0001} className="py-4" />
            {steps.map((step) => (
              <div
                key={step.volume}
                className="absolute bottom-0 -translate-x-1/2 text-sm text-gray-400"
                style={{ left: `${(step.tick / 6) * 100}%` }}
              >
                <div>{step.label}</div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-lg font-semibold">
          <span className="font-mono">{tickToVolume(tick).toLocaleString()}</span> moderations/month
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Object.entries(products).map(([key, tier]) => (
          <Card
            key={tier.name}
            className={`relative ${tier.id === recommendedTier ? "border-2 border-emerald-500" : ""}`}
          >
            {tier.id === recommendedTier && (
              <div className="absolute -top-3 right-0 left-0 mx-auto w-32 rounded bg-emerald-100 py-1 text-center text-sm font-medium text-emerald-800">
                Recommended
              </div>
            )}
            <CardHeader>
              <h3 className="font-mono text-xl font-bold">{tier.name}</h3>
              {/* <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold">{tier.getPrice ? tier.getPrice(volume) : tier.price}</span>
                  {tier.price !== "Custom" && <span className="text-muted-foreground">/mo</span>}
                </div> */}
              <p className="text-muted-foreground text-sm">{tier.description}</p>
            </CardHeader>
            <CardContent className="grid gap-4">
              {/* <Button variant={tier.ctaVariant} className="w-full">
                  {tier.cta}
                </Button> */}
              {/* {tier.price !== "Custom" && (
                  <p className="text-muted-foreground text-center text-xs">Start with a free trial. Upgrade anytime.</p>
                )} */}
              {/* <div className="space-y-4">
                  <h4 className="font-mono font-bold">Features included:</h4>
                  <ul className="grid gap-2 text-sm">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-emerald-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div> */}
            </CardContent>
            {/* <CardFooter className="grid gap-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-muted-foreground">Moderations/mo:</p>
                    <p className="font-mono font-bold">
                      {typeof tier.limits.moderationsPerMonth === "number"
                        ? tier.limits.moderationsPerMonth.toLocaleString()
                        : tier.limits.moderationsPerMonth}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Custom rules:</p>
                    <p className="font-mono font-bold">{tier.limits.customRules}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Data retention:</p>
                    <p className="font-mono font-bold">{tier.limits.retentionDays} days</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Appeals handling:</p>
                    <p className="font-mono font-bold">{tier.limits.appeals}</p>
                  </div>
                </div>
              </CardFooter> */}
          </Card>
        ))}
      </div>
    </div>
  );
}
