"use server";

import { z } from "zod";
import { actionClient } from "@/lib/action-client";
import { PRODUCTS } from "@/products/products";
import stripe from "@/lib/stripe";
import type { Stripe } from "stripe";
import { findOrCreateOrganization, updateOrganization } from "@/services/organizations";
import { isFixedFeeAndOverage, isPayAsYouGo } from "@/products/types";
import { clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { env } from "@/lib/env";
import { getAbsoluteUrl } from "@/lib/url";

const createCheckoutSessionSchema = z.object({
  tier: z.enum(Object.keys(PRODUCTS) as [keyof typeof PRODUCTS, ...(keyof typeof PRODUCTS)[]]),
  term: z.enum(["monthly", "yearly"]),
});

export const createCheckoutSession = actionClient
  .schema(createCheckoutSessionSchema)
  .action(async ({ parsedInput: { tier, term }, ctx: { organizationId, userId } }) => {
    if (!env.ENABLE_BILLING || !stripe) {
      throw new Error("Billing is not enabled");
    }

    const organization = await findOrCreateOrganization(organizationId);

    const product = PRODUCTS[tier];

    let stripeCustomerId = organization.stripeCustomerId;
    if (!stripeCustomerId) {
      const clerkUser = await (await clerkClient()).users.getUser(userId);
      const clerkOrganization = await (await clerkClient()).organizations.getOrganization({ organizationId });

      const customer = await stripe.customers.create({
        name: clerkOrganization.name,
        email: clerkUser.emailAddresses[0]?.emailAddress ?? undefined,
      });

      await updateOrganization(organizationId, {
        stripeCustomerId: customer.id,
      });

      stripeCustomerId = customer.id;
    }

    let lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    if (isPayAsYouGo(product.prices)) {
      const price = await stripe.prices
        .list({
          lookup_keys: [product.prices.metered.lookup_key],
          limit: 1,
        })
        .then((res) => res.data[0]);

      if (!price) {
        throw new Error("Price not found");
      }

      lineItems = [{ price: price.id }];
    }

    if (isFixedFeeAndOverage(product.prices)) {
      const flatKey = term === "monthly" ? "flat_monthly" : "flat_yearly";
      const graduatedKey = term === "monthly" ? "graduated_monthly" : "graduated_yearly";
      const flatPrice = await stripe.prices
        .list({
          lookup_keys: [product.prices[flatKey].lookup_key],
          limit: 1,
        })
        .then((res) => res.data[0]);
      const graduatedPrice = await stripe.prices
        .list({
          lookup_keys: [product.prices[graduatedKey].lookup_key],
          limit: 1,
        })
        .then((res) => res.data[0]);

      if (!flatPrice || !graduatedPrice) {
        throw new Error("Price not found");
      }

      lineItems = [{ price: flatPrice.id, quantity: 1 }, { price: graduatedPrice.id }];
    }

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      line_items: lineItems,
      mode: "subscription",
      success_url: getAbsoluteUrl("/dashboard/subscription/success?session_id={CHECKOUT_SESSION_ID}"),
      cancel_url: getAbsoluteUrl("/dashboard/subscription/cancel?session_id={CHECKOUT_SESSION_ID}"),
      subscription_data: {
        trial_period_days: 7,
      },
    });

    if (!session) {
      throw new Error("Failed to create checkout session");
    }

    return session.url;
  });

export const createPortalSession = actionClient.action(async ({ ctx: { organizationId } }) => {
  if (!env.ENABLE_BILLING || !stripe) {
    throw new Error("Billing is not enabled");
  }

  const organization = await findOrCreateOrganization(organizationId);
  if (!organization.stripeCustomerId) {
    return null;
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: organization.stripeCustomerId,
    return_url: getAbsoluteUrl("/dashboard/subscription"),
  });

  if (!session.url) {
    throw new Error("Failed to create portal session");
  }

  redirect(session.url);
});
