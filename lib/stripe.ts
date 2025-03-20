import { env } from "@/lib/env";
import Stripe from "stripe";

const stripeClientSingleton = () => {
  const stripe = env.STRIPE_API_KEY ? new Stripe(env.STRIPE_API_KEY) : null;
  return { stripe };
};

const stripeSingleton = stripeClientSingleton();
const stripe = stripeSingleton.stripe;
export default stripe;
