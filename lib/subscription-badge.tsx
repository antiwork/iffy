import { Badge } from "@/components/ui/badge";
import { Stripe } from "stripe";

export function formatSubscriptionStatus({ status }: Pick<Stripe.Subscription, "status">) {
  if (status === "active") {
    return <Badge variant="success">Active</Badge>;
  }
  if (status === "trialing") {
    return <Badge variant="secondary">Trialing</Badge>;
  }
  if (status === "past_due") {
    return <Badge variant="warning">Past due</Badge>;
  }
  if (status === "unpaid") {
    return <Badge variant="failure">Unpaid</Badge>;
  }
  if (status === "incomplete") {
    return <Badge variant="outline">Incomplete</Badge>;
  }
  if (status === "incomplete_expired") {
    return <Badge variant="outline">Incomplete expired</Badge>;
  }
  if (status === "canceled") {
    return <Badge variant="failure">Canceled</Badge>;
  }
  return null;
}
