import * as schema from "@/db/schema";

type UserRecord = typeof schema.userRecords.$inferSelect;

export function formatUserRecord(userRecord: UserRecord) {
  let primary = userRecord.clientId;
  if (userRecord.email) primary = userRecord.email;
  if (userRecord.username) primary = userRecord.username;
  if (userRecord.name) primary = userRecord.name;
  return primary;
}

export function getUserRecordSecondaryParts(userRecord: UserRecord) {
  let secondary = ["No email provided"];
  if (userRecord.email) secondary = [userRecord.clientId];
  if (userRecord.username && userRecord.email) secondary = [userRecord.email];
  if (userRecord.name && userRecord.username && userRecord.email) secondary = [userRecord.username, userRecord.email];
  return secondary;
}

export function formatUserRecordCompact(userRecord: UserRecord) {
  let primary = userRecord.clientId;
  // in compact situations the ranking of properties is different than above
  if (userRecord.name) primary = userRecord.name;
  if (userRecord.email) primary = userRecord.email;
  if (userRecord.username) primary = userRecord.username;
  return primary;
}

