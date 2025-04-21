import * as schema from "@/db/schema";

export type Record = typeof schema.records.$inferSelect;
export type RecordWithContent = Record & {
  name: string;
  text: string;
};

export function formatRecord(record: Record) {
  let name = record.clientId;
  if (record.name) name = record.name;
  return name;
}
export const isRecordWithContent = (record: typeof schema.records.$inferSelect): record is RecordWithContent => {
  return record.name != null && record.text != null;
};
