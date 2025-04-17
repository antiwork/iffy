export type ViaWithRelations =
  | { via: "Inbound"; authUserId?: null; viaRecordId?: null; viaAppealId?: null }
  | { via: "Manual"; authUserId: string; viaRecordId?: null; viaAppealId?: null }
  | { via: "Automation Flagged Record"; authUserId?: null; viaRecordId: string; viaAppealId?: null }
  | { via: "Automation Appeal Approved"; authUserId?: null; viaRecordId?: null; viaAppealId: string }
  | { via: "Automation All Compliant"; authUserId?: null; viaRecordId?: null; viaAppealId?: null }
  | { via: "Automation"; authUserId?: null; viaRecordId?: null; viaAppealId?: null }
  | { via: "AI"; authUserId?: null; viaRecordId?: null; viaAppealId?: null };
