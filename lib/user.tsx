import * as schema from "@/db/schema";

type User = typeof schema.endUsers.$inferSelect;

export function formatUser(user: User) {
  let primary = user.clientId;
  if (user.email) primary = user.email;
  if (user.username) primary = user.username;
  if (user.name) primary = user.name;
  return primary;
}

export function getUserSecondaryParts(user: User) {
  let secondary = ["No email provided"];
  if (user.email) secondary = [user.clientId];
  if (user.username && user.email) secondary = [user.email];
  if (user.name && user.username && user.email) secondary = [user.username, user.email];
  return secondary;
}

export function formatUserSecondary(user: User) {
  return getUserSecondaryParts(user)[0];
}

export function formatUserCompact(user: User) {
  let primary = user.clientId;
  // in compact situations the ranking of properties is different than above
  if (user.name) primary = user.name;
  if (user.email) primary = user.email;
  if (user.username) primary = user.username;
  return primary;
}

export function formatUserCompactSecondary(user: User) {
  let secondary = "No email provided";
  // in compact situations the ranking of properties is different than above
  if (user.name) secondary = user.clientId;
  if (user.email && user.name) secondary = user.name;
  if (user.username && user.email) secondary = user.email;
  return secondary;
}
