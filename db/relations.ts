import { relations } from "drizzle-orm/relations";
import {
  records,
  moderations,
  rulesets,
  users,
  userActions,
  appeals,
  messages,
  appealActions,
  moderationsToRules,
  webhookEndpoints,
  webhookEvents,
  rules,
  presets,
  ruleStrategies,
  presetStrategies,
} from "./tables";

export const moderationsRelations = relations(moderations, ({ one, many }) => ({
  record: one(records, {
    fields: [moderations.recordId],
    references: [records.id],
  }),
  ruleset: one(rulesets, {
    fields: [moderations.rulesetId],
    references: [rulesets.id],
  }),
  moderationsToRules: many(moderationsToRules),
}));

export const recordsRelations = relations(records, ({ one, many }) => ({
  moderations: many(moderations),
  user: one(users, {
    fields: [records.userId],
    references: [users.id],
  }),
}));

export const rulesetsRelations = relations(rulesets, ({ many }) => ({
  moderations: many(moderations),
  rules: many(rules),
}));

export const userActionsRelations = relations(userActions, ({ one, many }) => ({
  user: one(users, {
    fields: [userActions.userId],
    references: [users.id],
  }),
  messages: many(messages),
  appeal: one(appeals, { fields: [userActions.id], references: [appeals.userActionId] }),
  viaRecord: one(records, {
    fields: [userActions.viaRecordId],
    references: [records.id],
    relationName: "viaRecord",
  }),
  viaAppeal: one(appeals, {
    fields: [userActions.viaAppealId],
    references: [appeals.id],
    relationName: "viaAppeal",
  }),
}));
export const usersRelations = relations(users, ({ many }) => ({
  actions: many(userActions),
  from: many(messages, { relationName: "from" }),
  to: many(messages, { relationName: "to" }),
  records: many(records),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  appeal: one(appeals, {
    fields: [messages.appealId],
    references: [appeals.id],
  }),
  from: one(users, {
    fields: [messages.fromId],
    references: [users.id],
    relationName: "from",
  }),
  userAction: one(userActions, {
    fields: [messages.userActionId],
    references: [userActions.id],
  }),
  to: one(users, {
    fields: [messages.toId],
    references: [users.id],
    relationName: "to",
  }),
}));

export const appealsRelations = relations(appeals, ({ one, many }) => ({
  messages: many(messages),
  userAction: one(userActions, {
    fields: [appeals.userActionId],
    references: [userActions.id],
  }),
  actions: many(appealActions),
}));

export const appealActionsRelations = relations(appealActions, ({ one }) => ({
  appeal: one(appeals, {
    fields: [appealActions.appealId],
    references: [appeals.id],
  }),
}));

export const moderationsToRulesRelations = relations(moderationsToRules, ({ one }) => ({
  moderation: one(moderations, {
    fields: [moderationsToRules.moderationId],
    references: [moderations.id],
  }),
  rule: one(rules, {
    fields: [moderationsToRules.ruleId],
    references: [rules.id],
  }),
}));

export const webhookEventsRelations = relations(webhookEvents, ({ one }) => ({
  webhookEndpoint: one(webhookEndpoints, {
    fields: [webhookEvents.webhookEndpointId],
    references: [webhookEndpoints.id],
  }),
}));

export const webhookEndpointsRelations = relations(webhookEndpoints, ({ many }) => ({
  webhookEvents: many(webhookEvents),
}));

export const rulesRelations = relations(rules, ({ one, many }) => ({
  ruleset: one(rulesets, {
    fields: [rules.rulesetId],
    references: [rulesets.id],
  }),
  preset: one(presets, {
    fields: [rules.presetId],
    references: [presets.id],
  }),
  strategies: many(ruleStrategies),
  moderationsToRules: many(moderationsToRules),
}));

export const presetsRelations = relations(presets, ({ many }) => ({
  strategies: many(presetStrategies),
  rules: many(rules),
}));

export const ruleStrategiesRelations = relations(ruleStrategies, ({ one }) => ({
  rule: one(rules, {
    fields: [ruleStrategies.ruleId],
    references: [rules.id],
  }),
}));

export const presetStrategiesRelations = relations(presetStrategies, ({ one }) => ({
  preset: one(presets, {
    fields: [presetStrategies.presetId],
    references: [presets.id],
  }),
}));
