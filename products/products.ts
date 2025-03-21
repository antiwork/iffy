import stripe from "@/lib/stripe";
import { ProductsCatalog } from "./types";
import { env } from "process";

const OVERAGE_PRICE = 2; // cents

// The free tier follows a pay-as-you-go model
// https://docs.stripe.com/billing/subscriptions/usage-based/pricing-models#pay-as-you-go

// The growth & pro tiers follow a fixed fee and overage model
// https://docs.stripe.com/billing/subscriptions/usage-based/pricing-models#fixed-fee-overage

export const PRODUCTS: ProductsCatalog = {
  free: {
    id: "prod_iffy_free",
    name: "Free",
    description: "For small communities and testing",
    prices: {
      metered: {
        lookup_key: "price_iffy_free_usage",
        currency: "usd",
        unit_amount: OVERAGE_PRICE,
        billing_scheme: "per_unit",
        recurring: {
          interval: "month",
          usage_type: "metered",
        },
      },
    },
  },
  growth: {
    id: "prod_iffy_growth",
    name: "Growth",
    description: "Intelligent moderation at scale",
    prices: {
      flat_monthly: {
        lookup_key: "price_iffy_growth_base_monthly",
        currency: "usd",
        unit_amount: 9900,
        billing_scheme: "per_unit",
        recurring: {
          interval: "month",
          usage_type: "licensed",
        },
      },
      flat_yearly: {
        lookup_key: "price_iffy_growth_base_yearly",
        currency: "usd",
        unit_amount: 99000,
        billing_scheme: "per_unit",
        recurring: {
          interval: "year",
          usage_type: "licensed",
        },
      },
      graduated_monthly: {
        lookup_key: "price_iffy_growth_usage_monthly",
        currency: "usd",
        billing_scheme: "tiered",
        recurring: {
          interval: "month",
          usage_type: "metered",
        },
        tiers_mode: "graduated",
        tiers: [
          {
            up_to: 10000,
            unit_amount: 0,
          },
          {
            up_to: "inf",
            unit_amount: OVERAGE_PRICE,
          },
        ],
      },
      graduated_yearly: {
        lookup_key: "price_iffy_growth_usage_yearly",
        currency: "usd",
        billing_scheme: "tiered",
        recurring: {
          interval: "year",
          usage_type: "metered",
        },
        tiers_mode: "graduated",
        tiers: [
          {
            up_to: 10000 * 12,
            unit_amount: 0,
          },
          {
            up_to: "inf",
            unit_amount: OVERAGE_PRICE,
          },
        ],
      },
    },
  },
  pro: {
    id: "prod_iffy_pro",
    name: "Pro",
    description: "Enterprise-grade moderation",
    prices: {
      flat_monthly: {
        lookup_key: "price_iffy_pro_base_monthly",
        currency: "usd",
        unit_amount: 99900,
        billing_scheme: "per_unit",
        recurring: {
          interval: "month",
          usage_type: "licensed",
        },
      },
      flat_yearly: {
        lookup_key: "price_iffy_pro_base_yearly",
        currency: "usd",
        unit_amount: 999000,
        billing_scheme: "per_unit",
        recurring: {
          interval: "year",
          usage_type: "licensed",
        },
      },
      graduated_monthly: {
        lookup_key: "price_iffy_pro_usage_monthly",
        currency: "usd",
        billing_scheme: "tiered",
        recurring: {
          interval: "month",
          usage_type: "metered",
        },
        tiers_mode: "graduated",
        tiers: [
          {
            up_to: 100000,
            unit_amount: 0,
          },
          {
            up_to: "inf",
            unit_amount: OVERAGE_PRICE,
          },
        ],
      },
      graduated_yearly: {
        lookup_key: "price_iffy_pro_usage_yearly",
        currency: "usd",
        billing_scheme: "tiered",
        recurring: {
          interval: "year",
          usage_type: "metered",
        },
        tiers_mode: "graduated",
        tiers: [
          {
            up_to: 100000 * 12,
            unit_amount: 0,
          },
          {
            up_to: "inf",
            unit_amount: OVERAGE_PRICE,
          },
        ],
      },
    },
  },
  enterprise: {
    id: "prod_iffy_enterprise",
    name: "Enterprise",
    description: "Custom solutions for large platforms",
    prices: [],
  },
} as const;

export const METERS = {
  iffy_moderations: {
    display_name: "Iffy moderations",
    event_name: "iffy_moderations",
    default_aggregation: {
      formula: "sum",
    },
    value_settings: {
      event_payload_key: "value",
    },
    customer_mapping: {
      type: "by_id",
      event_payload_key: "stripe_customer_id",
    },
  },
} as const;

export async function updateProducts() {
  if (!env.ENABLE_BILLING || !stripe) {
    throw new Error("Billing is not enabled");
  }

  for (const { prices, ...params } of Object.values(PRODUCTS)) {
    let product = await stripe.products.retrieve(params.id).catch(() => null);

    if (!product) {
      product = await stripe.products.create(params);
    } else {
      product = await stripe.products.update(params.id, {
        name: params.name,
        description: params.description,
      });
    }

    for (const params of Object.values(prices)) {
      const lastPrice = await stripe.prices
        .list({ lookup_keys: [params.lookup_key], product: product.id })
        .then((res) => res.data[0]);
      if (lastPrice) {
        await stripe.prices.update(lastPrice.id, { active: false });
      }
      await stripe.prices.create({ product: product.id, ...params, transfer_lookup_key: true });
    }
  }
  console.log("Updating products completed successfully.");
}

export async function updateMeters() {
  if (!env.ENABLE_BILLING || !stripe) {
    throw new Error("Billing is not enabled");
  }

  for (const [key, params] of Object.entries(METERS)) {
    const existingMeters = await stripe.billing.meters.list();
    const existingMeter = existingMeters.data.find((meter) => meter.event_name === params.event_name);

    if (!existingMeter) {
      await stripe.billing.meters.create(params);
    } else {
      await stripe.billing.meters.update(existingMeter.id, {
        display_name: params.display_name,
      });
    }
  }
  console.log("Updating meters completed successfully.");
}
