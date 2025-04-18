export type ViaWithRelations =
  | { via: "Inbound"; userId?: null; viaRecordId?: null; viaAppealId?: null }
  | { via: "Manual"; userId: string; viaRecordId?: null; viaAppealId?: null }
  | { via: "Automation Flagged Record"; userId?: null; viaRecordId: string; viaAppealId?: null }
  | { via: "Automation Appeal Approved"; userId?: null; viaRecordId?: null; viaAppealId: string }
  | { via: "Automation All Compliant"; userId?: null; viaRecordId?: null; viaAppealId?: null }
  | { via: "Automation"; userId?: null; viaRecordId?: null; viaAppealId?: null }
  | { via: "AI"; userId?: null; viaRecordId?: null; viaAppealId?: null };
