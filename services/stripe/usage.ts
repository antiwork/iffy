import Stripe from "stripe";
import { findOrCreateOrganization } from "../organizations";
import { env } from "@/lib/env";
import { z } from "zod";
import { startOfCurrentBillingPeriod } from "./subscriptions";

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

export async function getUsage(clerkOrganizationId: string, eventName: string, start: Date, end?: Date) {
  const organization = await findOrCreateOrganization(clerkOrganizationId);
  if (!organization || !organization.stripeCustomerId) {
    return null;
  }

  const meters = await stripe.billing.meters.list({ status: "active" });
  const meter = meters.data.find((meter) => meter.event_name === eventName);
  if (!meter) {
    return null;
  }

  // Align to start of minute (UTC)
  const startTime = Math.floor(start.setUTCMinutes(0, 0, 0) / 1000);
  // Align to end of minute (UTC)
  const endTime = Math.floor((end ? end : new Date()).setUTCMinutes(59, 59, 999) / 1000) + 1;

  const usage = await stripe.billing.meters.listEventSummaries(meter.id, {
    customer: organization.stripeCustomerId,
    start_time: startTime,
    end_time: endTime,
  });

  const total = usage.data[0]?.aggregated_value ?? 0;

  return total;
}

export async function getUsageForCurrentBillingPeriod(clerkOrganizationId: string, eventName: string) {
  const start = await startOfCurrentBillingPeriod(clerkOrganizationId);
  if (!start) {
    return null;
  }

  return getUsage(clerkOrganizationId, eventName, start);
}
