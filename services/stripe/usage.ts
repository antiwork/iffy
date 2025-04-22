import { env } from "@/lib/env";
import { findOrganization } from "../organizations";
import { startOfCurrentBillingPeriod } from "./subscriptions";
import stripe from "@/lib/stripe";
import { z } from "zod";

export async function createMeterEvent(organizationId: string, eventName: string, value: number) {
  if (!env.ENABLE_BILLING || !stripe) {
    throw new Error("Billing is not enabled");
  }

  const organization = await findOrganization(organizationId);
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

export async function getUsage(organizationId: string, eventName: string, start: Date, end?: Date) {
  if (!env.ENABLE_BILLING || !stripe) {
    throw new Error("Billing is not enabled");
  }

  const organization = await findOrganization(organizationId);
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

export async function getUsageForCurrentBillingPeriod(organizationId: string, eventName: string) {
  if (!env.ENABLE_BILLING || !stripe) {
    throw new Error("Billing is not enabled");
  }

  const start = await startOfCurrentBillingPeriod(organizationId);
  if (!start) {
    return null;
  }

  return getUsage(organizationId, eventName, start);
}
