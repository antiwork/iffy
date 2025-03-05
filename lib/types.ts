export type ViaWithClerkUserOrUser =
  | {
      via: "Inbound" | "Manual" | "Automation" | "AI";
      clerkUserId?: string | null;
      viaRecordId?: string;
      viaAppealId?: string;
    }
  | { via: "Inbound"; clerkUserId?: null; viaRecordId?: string; viaAppealId?: string }
  | { via: "Manual"; clerkUserId: string; viaRecordId?: string; viaAppealId?: string }
  | { via: "Automation"; clerkUserId?: null; viaRecordId?: string; viaAppealId?: string }
  | { via: "AI"; clerkUserId?: null; viaRecordId?: string; viaAppealId?: string };
