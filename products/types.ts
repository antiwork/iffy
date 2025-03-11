import { Stripe } from "stripe";

// The following constraints on the default Stripe Price & Product params types
// allow the rest of the application to reason about the structure of the
// tiered products without supporting a fully generic pricing model.

export type BaseTier = Stripe.PriceCreateParams.Tier & { up_to: number; unit_amount: 0 };
export type OverageTier = Stripe.PriceCreateParams.Tier & { up_to: "inf"; unit_amount: number };

export type PriceParams = Omit<Stripe.PriceCreateParams, "product"> & { lookup_key: string };
export type FlatPriceParams = PriceParams & { recurring: { usage_type: "licensed" }; tiers?: undefined };
export type MeteredPriceParams = PriceParams & { recurring: { usage_type: "metered" }; tiers?: undefined };
export type GraduatedPriceParams = PriceParams & {
  recurring: { usage_type: "metered" };
  tiers_mode: "graduated";
  tiers: [BaseTier, OverageTier];
};

export type ProductParams = Stripe.ProductCreateParams & {
  id: string;
};

export type ProductsConfig = {
  free: ProductParams & {
    prices: {
      metered: MeteredPriceParams;
    };
  };
  growth: ProductParams & {
    prices: {
      flat: FlatPriceParams;
      graduated: GraduatedPriceParams;
    };
  };
  pro: ProductParams & {
    prices: {
      flat: FlatPriceParams;
      graduated: GraduatedPriceParams;
    };
  };
};
