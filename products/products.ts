import { Stripe } from "stripe";
import { env } from "@/lib/env";

const stripe = new Stripe(env.STRIPE_API_KEY);

type ProductConfig = Stripe.ProductCreateParams & {
  prices: Omit<Stripe.PriceCreateParams, "product">[];
};

// WARNING: When updating prices, increment the version number in the lookup_key
export const PRODUCTS: ProductConfig[] = [
  {
    id: "prod_iffy_free",
    name: "Free",
    description: "For small communities and testing",
    prices: [
      {
        lookup_key: "price_iffy_free_usage_v1",
        currency: "usd",
        unit_amount: 2,
        billing_scheme: "per_unit",
        recurring: {
          interval: "month",
          usage_type: "metered",
        },
      },
    ],
  },
  {
    id: "prod_iffy_growth",
    name: "Growth",
    description: "Intelligent moderation at scale",
    prices: [
      {
        lookup_key: "price_iffy_growth_base_v1",
        currency: "usd",
        unit_amount: 9900,
        billing_scheme: "per_unit",
        recurring: {
          interval: "month",
        },
      },
      {
        lookup_key: "price_iffy_growth_usage_v1",
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
            unit_amount: 2,
          },
        ],
      },
    ],
  },
  {
    id: "prod_iffy_pro",
    name: "Pro",
    description: "Enterprise-grade moderation",
    prices: [
      {
        lookup_key: "price_iffy_pro_base_v1",
        currency: "usd",
        unit_amount: 99900,
        billing_scheme: "per_unit",
        recurring: {
          interval: "month",
        },
      },
      {
        lookup_key: "price_iffy_pro_usage_v1",
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
            unit_amount: 2,
          },
        ],
      },
    ],
  },
] as const;

export async function updateProducts() {
  for (const { prices, ...params } of PRODUCTS) {
    let product = await stripe.products.retrieve(params.id!).catch(() => null);

    if (!product) {
      product = await stripe.products.create(params);
    } else {
      product = await stripe.products.update(params.id!, {
        name: params.name,
        description: params.description,
      });
    }

    for (const params of prices) {
      const price = await stripe.prices
        .list({
          lookup_keys: [params.lookup_key!],
          limit: 1,
        })
        .then((res) => res.data[0]);

      if (!price) {
        await stripe.prices.create({ product: product.id, active: true, ...params });
      }
      // Since updated price params will have a new lookup_key
      // we can safely ignore prices that already exist
    }

    // Archive any prior prices that are not the current prices
    const allPrices = await stripe.prices.list({ product: product.id }).then((res) => res.data);
    const activeLookupKeys = new Set(prices.map((p) => p.lookup_key));

    for (const price of allPrices) {
      const isInactivePrice = !price.lookup_key || (price.lookup_key && !activeLookupKeys.has(price.lookup_key));
      if (price.active && isInactivePrice) {
        await stripe.prices.update(price.id, { active: false });
      }
    }
  }
}
