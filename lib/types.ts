export type ViaWithRelations =
  | { via: "Inbound"; clerkUserId?: null; viaRecordId?: null; viaAppealId?: null }
  | { via: "Manual"; clerkUserId: string; viaRecordId?: null; viaAppealId?: null }
  | { via: "Automation Flagged Record"; clerkUserId?: null; viaRecordId: string; viaAppealId?: null }
  | { via: "Automation Appeal Approved"; clerkUserId?: null; viaRecordId?: null; viaAppealId: string }
  | { via: "Automation All Compliant"; clerkUserId?: null; viaRecordId?: null; viaAppealId?: null }
  | { via: "Automation"; clerkUserId?: null; viaRecordId?: null; viaAppealId?: null }
  | { via: "AI"; clerkUserId?: null; viaRecordId?: null; viaAppealId?: null };
