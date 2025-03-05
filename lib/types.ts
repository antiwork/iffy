export type ViaWithRelations =
  | {
      via: "Inbound" | "Manual" | "Automation" | "AI";
      clerkUserId?: string | null;
      viaRecordId?: string | null;
      viaAppealId?: string | null;
    }
  | { via: "Inbound"; clerkUserId?: null; viaRecordId?: null; viaAppealId?: null }
  | { via: "Manual"; clerkUserId: string; viaRecordId?: null; viaAppealId?: null }
  | { via: "Automation"; clerkUserId?: null; viaRecordId: string; viaAppealId?: null }
  | { via: "Automation"; clerkUserId?: null; viaRecordId?: null; viaAppealId: string }
  | { via: "AI"; clerkUserId?: null; viaRecordId?: null; viaAppealId?: null };
