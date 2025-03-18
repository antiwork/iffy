import Stripe from "stripe";
import { findOrCreateOrganization } from "../organizations";
import { env } from "@/lib/env";
import { z } from "zod";

export const stripe = new Stripe(env.STRIPE_API_KEY);

export async function createMeterEvent(clerkOrganizationId: string, eventName: string, value: number) {
  const organization = await findOrCreateOrganization(clerkOrganizationId);
  if (!organization.stripeCustomerId) {
    throw new Error("Organization does not have a Stripe Customer ID");
  }

  // value must be a positive integer, sent to Stripe as a string
  const valueSchema = z
    .number()
    .int()
    .positive()
    .transform((val) => val.toString());

  const parsedValue = valueSchema.safeParse(value);
  if (!parsedValue.success) {
    throw new Error("Value is not an integer");
  }

  await stripe.billing.meterEvents.create({
    event_name: eventName,
    payload: {
      value: parsedValue.data,
      stripe_customer_id: organization.stripeCustomerId,
    },
  });
}
