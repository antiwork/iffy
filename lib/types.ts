export type ViaWithClerkUserOrUser =
  | { via: "Inbound" | "Manual" | "Automation" | "AI"; clerkUserId?: string | null }
  | { via: "Inbound"; clerkUserId?: null }
  | { via: "Manual"; clerkUserId: string }
  | { via: "Automation"; clerkUserId?: null }
  | { via: "AI"; clerkUserId?: null };
