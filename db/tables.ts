import {
  pgTable,
  index,
  foreignKey,
  text,
  boolean,
  timestamp,
  integer,
  uniqueIndex,
  serial,
  doublePrecision,
  jsonb,
  primaryKey,
  pgEnum,
  AnyPgColumn,
} from "drizzle-orm/pg-core";
import cuid from "cuid";

export const appealActionStatus = pgEnum("AppealActionStatus", ["Open", "Rejected", "Approved"]);
export const emailTemplateType = pgEnum("EmailTemplateType", ["Suspended", "Compliant", "Banned"]);
export const messageStatus = pgEnum("MessageStatus", ["Pending", "Delivered"]);
export const messageType = pgEnum("MessageType", ["Outbound", "Inbound"]);
export const moderationStatus = pgEnum("ModerationStatus", ["Compliant", "Flagged"]);
export const userActionStatus = pgEnum("UserActionStatus", ["Compliant", "Suspended", "Banned"]);
export const via = pgEnum("Via", [
  "Inbound",
  "Manual",
  "Automation",
  "AI",
  "Automation Flagged Record",
  "Automation All Compliant",
  "Automation Appeal Approved",
]);
export const webhookEventStatus = pgEnum("WebhookEventStatus", ["Pending", "Sent", "Failed"]);
export const strategyType = pgEnum("StrategyType", ["Blocklist", "Classifier", "Prompt"]);

export const moderations = pgTable(
  "moderations",
  {
    id: text().primaryKey().notNull().$defaultFn(cuid),
    organizationId: text("organization_id").notNull(),
    status: moderationStatus().notNull(),
    pending: boolean().default(false).notNull(),
    via: via().default("AI").notNull(),
    reasoning: text(),
    recordId: text("record_id").notNull(),
    rulesetId: text("ruleset_id"),
    createdAt: timestamp("created_at", { precision: 3, mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { precision: 3, mode: "date" })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
    userId: text("user_id"),
    testMode: boolean("test_mode").default(false).notNull(),
    tokens: integer().default(0).notNull(),
  },
  (table) => {
    return {
      recordIdIdx: index("moderations_record_id_idx").using("btree", table.recordId.asc().nullsLast().op("text_ops")),
      moderationsRecordIdFkey: foreignKey({
        columns: [table.recordId],
        foreignColumns: [records.id],
        name: "moderations_record_id_fkey",
      })
        .onUpdate("cascade")
        .onDelete("restrict"),
      moderationsRulesetIdFkey: foreignKey({
        columns: [table.rulesetId],
        foreignColumns: [rulesets.id],
        name: "moderations_ruleset_id_fkey",
      })
        .onUpdate("cascade")
        .onDelete("set null"),
      orgStatusIdx: index("moderations_org_status_idx").using(
        "btree",
        table.organizationId.asc().nullsLast().op("text_ops"),
        table.status.asc().nullsLast(),
      ),
    };
  },
);

export const rulesets = pgTable("rulesets", {
  id: text().primaryKey().notNull().$defaultFn(cuid),
  organizationId: text("organization_id").notNull(),
  name: text().notNull(),
  createdAt: timestamp("created_at", { precision: 3, mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { precision: 3, mode: "date" })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const userActions = pgTable(
  "user_actions",
  {
    id: text().primaryKey().notNull().$defaultFn(cuid),
    organizationId: text("organization_id").notNull(),
    endUserId: text("end_user_id").notNull(),
    status: userActionStatus().notNull(),
    via: via().default("Automation").notNull(),
    createdAt: timestamp("created_at", { precision: 3, mode: "date" }).defaultNow().notNull(),
    userId: text("user_id"),
    reasoning: text("reasoning"),
    viaRecordId: text("via_record_id").references((): AnyPgColumn => records.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    viaAppealId: text("via_appeal_id").references((): AnyPgColumn => appeals.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
  },
  (table) => {
    return {
      userIdIdx: index("user_actions_end_user_id_idx").using("btree", table.endUserId.asc().nullsLast().op("text_ops")),
      userActionsUserIdFkey: foreignKey({
        columns: [table.endUserId],
        foreignColumns: [endUsers.id],
        name: "user_actions_end_user_id_fkey",
      })
        .onUpdate("cascade")
        .onDelete("restrict"),
    };
  },
);

export const rules = pgTable(
  "rules",
  {
    id: text().primaryKey().notNull().$defaultFn(cuid),
    organizationId: text("organization_id").notNull(),
    name: text(),
    description: text(),
    presetId: text("preset_id"),
    rulesetId: text("ruleset_id").notNull(),
    createdAt: timestamp("created_at", { precision: 3, mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { precision: 3, mode: "date" })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => {
    return {
      rulesPresetIdFkey: foreignKey({
        columns: [table.presetId],
        foreignColumns: [presets.id],
        name: "rules_preset_id_fkey",
      })
        .onUpdate("cascade")
        .onDelete("restrict"),
      rulesRulesetIdFkey: foreignKey({
        columns: [table.rulesetId],
        foreignColumns: [rulesets.id],
        name: "rules_ruleset_id_fkey",
      })
        .onUpdate("cascade")
        .onDelete("restrict"),
    };
  },
);

export const ruleStrategies = pgTable(
  "rule_strategies",
  {
    id: text().primaryKey().notNull().$defaultFn(cuid),
    organizationId: text("organization_id").notNull(),
    type: strategyType().notNull(),
    ruleId: text("rule_id").notNull(),
    options: jsonb().notNull(),
    createdAt: timestamp("created_at", { precision: 3, mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { precision: 3, mode: "date" })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => {
    return {
      ruleStrategiesRuleIdFkey: foreignKey({
        columns: [table.ruleId],
        foreignColumns: [rules.id],
        name: "rule_strategies_rule_id_fkey",
      })
        .onUpdate("cascade")
        .onDelete("restrict"),
    };
  },
);

export const presetStrategies = pgTable(
  "preset_strategies",
  {
    id: text().primaryKey().notNull().$defaultFn(cuid),
    type: strategyType().notNull(),
    presetId: text("preset_id").notNull(),
    options: jsonb().notNull(),
    createdAt: timestamp("created_at", { precision: 3, mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { precision: 3, mode: "date" })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => {
    return {
      presetStrategiesPresetIdFkey: foreignKey({
        columns: [table.presetId],
        foreignColumns: [presets.id],
        name: "preset_strategies_preset_id_fkey",
      })
        .onUpdate("cascade")
        .onDelete("restrict"),
    };
  },
);

export const presets = pgTable("presets", {
  id: text().primaryKey().notNull().$defaultFn(cuid),
  name: text().notNull(),
  description: text(),
  default: boolean().default(false).notNull(),
  createdAt: timestamp("created_at", { precision: 3, mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { precision: 3, mode: "date" })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const messages = pgTable(
  "messages",
  {
    id: text().primaryKey().notNull().$defaultFn(cuid),
    organizationId: text("organization_id").notNull(),
    userActionId: text("user_action_id").notNull(),
    toId: text("to_id"),
    fromId: text("from_id"),
    type: messageType().notNull(),
    subject: text(),
    text: text().notNull(),
    status: messageStatus().notNull(),
    appealId: text("appeal_id"),
    createdAt: timestamp("created_at", { precision: 3, mode: "date" }).defaultNow().notNull(),
    sort: serial().notNull().unique(),
  },
  (table) => {
    return {
      sortKey: uniqueIndex("messages_sort_key").using("btree", table.sort.asc().nullsLast().op("int4_ops")),
      messagesAppealIdFkey: foreignKey({
        columns: [table.appealId],
        foreignColumns: [appeals.id],
        name: "messages_appeal_id_fkey",
      })
        .onUpdate("cascade")
        .onDelete("set null"),
      messagesFromIdFkey: foreignKey({
        columns: [table.fromId],
        foreignColumns: [endUsers.id],
        name: "messages_from_id_fkey",
      })
        .onUpdate("cascade")
        .onDelete("set null"),
      messagesUserActionIdFkey: foreignKey({
        columns: [table.userActionId],
        foreignColumns: [userActions.id],
        name: "messages_user_action_id_fkey",
      })
        .onUpdate("cascade")
        .onDelete("restrict"),
      messagesToIdFkey: foreignKey({
        columns: [table.toId],
        foreignColumns: [endUsers.id],
        name: "messages_to_id_fkey",
      })
        .onUpdate("cascade")
        .onDelete("set null"),
    };
  },
);

export const endUsers = pgTable(
  "end_users",
  {
    id: text().primaryKey().notNull().$defaultFn(cuid),
    organizationId: text("organization_id").notNull(),
    clientId: text("client_id").notNull().unique(),
    clientUrl: text("client_url"),
    stripeAccountId: text("stripe_account_id"),
    email: text(),
    name: text(),
    username: text(),
    protected: boolean().default(false).notNull(),
    metadata: jsonb(),
    createdAt: timestamp("created_at", { precision: 3, mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { precision: 3, mode: "date" })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
    sort: serial().notNull().unique(),
    actionStatus: userActionStatus("action_status"),
    actionStatusCreatedAt: timestamp("action_status_created_at", { precision: 3, mode: "date" }),
    flaggedRecordsCount: integer("flagged_records_count").default(0).notNull(),
  },
  (table) => {
    return {
      organizationIdIdx: index("end_users_organization_id_idx").using(
        "btree",
        table.organizationId.asc().nullsLast().op("text_ops"),
      ),
      clientIdKey: uniqueIndex("end_users_client_id_key").using("btree", table.clientId.asc().nullsLast().op("text_ops")),
      sortKey: uniqueIndex("end_users_sort_key").using("btree", table.sort.asc().nullsLast().op("int4_ops")),
    };
  },
);

export const webhookEndpoints = pgTable("webhook_endpoints", {
  id: text().primaryKey().notNull().$defaultFn(cuid),
  organizationId: text("organization_id").notNull(),
  url: text().notNull(),
  secret: text().notNull(), // encrypted, please use the relevant decrypt/encrypt functions in @/services/encrypt.ts
  createdAt: timestamp("created_at", { precision: 3, mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { precision: 3, mode: "date" })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const appeals = pgTable(
  "appeals",
  {
    id: text().primaryKey().notNull().$defaultFn(cuid),
    organizationId: text("organization_id").notNull(),
    userActionId: text("user_action_id").notNull().unique(),
    createdAt: timestamp("created_at", { precision: 3, mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { precision: 3, mode: "date" })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
    sort: serial().notNull().unique(),
    actionStatus: appealActionStatus("action_status"),
    actionStatusCreatedAt: timestamp("action_status_created_at", { precision: 3, mode: "date" }),
  },
  (table) => {
    return {
      organizationIdIdx: index("appeals_organization_id_idx").using(
        "btree",
        table.organizationId.asc().nullsLast().op("text_ops"),
      ),
      userActionIdIdx: index("appeals_user_action_id_idx").using(
        "btree",
        table.userActionId.asc().nullsLast().op("text_ops"),
      ),
      userActionIdKey: uniqueIndex("appeals_user_action_id_key").using(
        "btree",
        table.userActionId.asc().nullsLast().op("text_ops"),
      ),
      sortKey: uniqueIndex("appeals_sort_key").using("btree", table.sort.asc().nullsLast().op("int4_ops")),
      appealsUserActionIdFkey: foreignKey({
        columns: [table.userActionId],
        foreignColumns: [userActions.id],
        name: "appeals_user_action_id_fkey",
      })
        .onUpdate("cascade")
        .onDelete("restrict"),
    };
  },
);

export const appealActions = pgTable(
  "appeal_actions",
  {
    id: text().primaryKey().notNull().$defaultFn(cuid),
    organizationId: text("organization_id").notNull(),
    appealId: text("appeal_id").notNull(),
    status: appealActionStatus().notNull(),
    via: via().default("Inbound").notNull(),
    userId: text("user_id"),
    createdAt: timestamp("created_at", { precision: 3, mode: "date" }).defaultNow().notNull(),
  },
  (table) => {
    return {
      appealActionsAppealIdFkey: foreignKey({
        columns: [table.appealId],
        foreignColumns: [appeals.id],
        name: "appeal_actions_appeal_id_fkey",
      })
        .onUpdate("cascade")
        .onDelete("restrict"),
    };
  },
);

export const apiKeys = pgTable(
  "api_keys",
  {
    id: text().primaryKey().notNull().$defaultFn(cuid),
    organizationId: text("organization_id").notNull(),
    userId: text("user_id").notNull(),
    name: text().notNull(),
    encryptedKey: text("encrypted_key").notNull().unique(), // encrypted, please use the relevant decrypt/encrypt functions in @/services/encrypt.ts
    encryptedKeyHash: text("encrypted_key_hash").unique(), // encrypted, please use the relevant decrypt/encrypt functions in @/services/encrypt.ts
    lastUsedAt: timestamp("last_used_at", { precision: 3, mode: "date" }),
    createdAt: timestamp("created_at", { precision: 3, mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { precision: 3, mode: "date" })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp("deleted_at", { precision: 3, mode: "date" }),
  },
  (table) => {
    return {
      encryptedKeyHashKey: uniqueIndex("api_keys_encrypted_key_hash_key").using(
        "btree",
        table.encryptedKeyHash.asc().nullsLast().op("text_ops"),
      ),
      encryptedKeyKey: uniqueIndex("api_keys_encrypted_key_key").using(
        "btree",
        table.encryptedKey.asc().nullsLast().op("text_ops"),
      ),
    };
  },
);

export const organizations = pgTable(
  "organizations",
  {
    id: text().primaryKey().notNull().$defaultFn(cuid),
    name: text('name').notNull(),
    slug: text('slug').unique(),
    logo: text('logo'),
    metadata: text('metadata'),
    stripeCustomerId: text("stripe_customer_id").unique(),
    emailsEnabled: boolean("emails_enabled").default(false).notNull(),
    testModeEnabled: boolean("test_mode_enabled").default(true).notNull(),
    appealsEnabled: boolean("appeals_enabled").default(false).notNull(),
    stripeApiKey: text("stripe_api_key"), // encrypted, please use the relevant decrypt/encrypt functions in @/services/encrypt.ts
    moderationPercentage: doublePrecision("moderation_percentage").default(100).notNull(),
    suspensionThreshold: integer("suspension_threshold").default(1).notNull(),
    createdAt: timestamp("created_at", { precision: 3, mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { precision: 3, mode: "date" })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => {
    return {
      organizationIdKey: uniqueIndex("organizations_id_key").using(
        "btree",
        table.id.asc().nullsLast().op("text_ops"),
      ),
    };
  },
);

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: text().primaryKey().notNull().$defaultFn(cuid),
    organizationId: text("organization_id").notNull(),
    stripeSubscriptionId: text("stripe_subscription_id").notNull(),
    createdAt: timestamp("created_at", { precision: 3, mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { precision: 3, mode: "date" })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => {
    return {
      organizationIdKey: uniqueIndex("subscriptions_organization_id_key").using(
        "btree",
        table.organizationId.asc().nullsLast().op("text_ops"),
      ),
    };
  },
);

export const moderationsToRules = pgTable(
  "moderations_to_rules",
  {
    moderationId: text("moderation_id").notNull(),
    ruleId: text("rule_id").notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.moderationId, table.ruleId] }),
      moderationsToRulesModerationIdFkey: foreignKey({
        columns: [table.moderationId],
        foreignColumns: [moderations.id],
        name: "moderations_to_rules_moderation_id_fkey",
      })
        .onUpdate("cascade")
        .onDelete("cascade"),
      moderationsToRulesRuleIdFkey: foreignKey({
        columns: [table.ruleId],
        foreignColumns: [rules.id],
        name: "moderations_to_rules_rule_id_fkey",
      })
        .onUpdate("cascade")
        .onDelete("cascade"),
    };
  },
);

export const records = pgTable(
  "records",
  {
    id: text().primaryKey().notNull().$defaultFn(cuid),
    organizationId: text("organization_id").notNull(),
    clientId: text("client_id").notNull().unique(),
    clientUrl: text("client_url"),
    name: text().notNull(),
    entity: text().notNull(),
    text: text().notNull(),
    imageUrls: text("image_urls").array().notNull().default([]),
    externalUrls: text("external_urls").array().notNull().default([]),
    protected: boolean("protected").default(false).notNull(),
    metadata: jsonb(),
    endUserId: text("end_user_id"),
    createdAt: timestamp("created_at", { precision: 3, mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { precision: 3, mode: "date" })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
    sort: serial().notNull().unique(),
    moderationStatus: moderationStatus("moderation_status"),
    moderationStatusCreatedAt: timestamp("moderation_status_created_at", { precision: 3, mode: "date" }),
    moderationPending: boolean("moderation_pending").default(false).notNull(),
    moderationPendingCreatedAt: timestamp("moderation_pending_created_at", { precision: 3, mode: "date" }),
    deletedAt: timestamp("deleted_at", { precision: 3, mode: "date" }),
  },
  (table) => {
    return {
      organizationIdIdx: index("records_organization_id_idx").using(
        "btree",
        table.organizationId.asc().nullsLast().op("text_ops"),
      ),
      clientIdKey: uniqueIndex("records_client_id_key").using("btree", table.clientId.asc().nullsLast().op("text_ops")),
      endUserIdIdx: index("records_end_user_id_idx").using("btree", table.endUserId.asc().nullsLast().op("text_ops")),
      sortKey: uniqueIndex("records_sort_key").using("btree", table.sort.asc().nullsLast().op("int4_ops")),
      recordsUserIdFkey: foreignKey({
        columns: [table.endUserId],
        foreignColumns: [endUsers.id],
        name: "records_end_user_id_fkey",
      })
        .onUpdate("cascade")
        .onDelete("set null"),
    };
  },
);

export const webhookEvents = pgTable(
  "webhook_events",
  {
    id: text().primaryKey().notNull().$defaultFn(cuid),
    webhookEndpointId: text("webhook_endpoint_id").notNull(),
    eventType: text("event_type").notNull(),
    payload: jsonb().notNull(),
    status: webhookEventStatus().notNull(),
    createdAt: timestamp("created_at", { precision: 3, mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { precision: 3, mode: "date" })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => {
    return {
      webhookEventsWebhookEndpointIdFkey: foreignKey({
        columns: [table.webhookEndpointId],
        foreignColumns: [webhookEndpoints.id],
        name: "webhook_events_webhook_endpoint_id_fkey",
      })
        .onUpdate("cascade")
        .onDelete("restrict"),
    };
  },
);

export const emailTemplates = pgTable(
  "email_templates",
  {
    organizationId: text("organization_id").notNull(),
    type: emailTemplateType().notNull(),
    content: jsonb().notNull(),
    createdAt: timestamp("created_at", { precision: 3, mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { precision: 3, mode: "date" })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => {
    return {
      emailTemplatesPkey: primaryKey({
        columns: [table.organizationId, table.type],
        name: "email_templates_pkey",
      }),
    };
  },
);

// default better-auth schema
//
export const user = pgTable("user", {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull(),
  image: text('image'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull()
});

export const session = pgTable("session", {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  activeOrganizationId: text('active_organization_id')
});

export const account = pgTable("account", {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull()
});

export const verification = pgTable("verification", {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at')
});

export const member = pgTable("member", {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  role: text('role').notNull(),
  createdAt: timestamp('created_at').notNull()
});

export const invitation = pgTable("invitation", {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  role: text('role'),
  status: text('status').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  inviterId: text('inviter_id').notNull().references(() => user.id, { onDelete: 'cascade' })
});
