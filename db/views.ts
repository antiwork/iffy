import * as schema from "./tables";
import { pgMaterializedView, timestamp, text, integer, jsonb } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const moderationsAnalyticsHourly = pgMaterializedView("moderations_analytics_hourly", {
  time: timestamp("time").notNull(),
  organizationId: text("organization_id").notNull(),
  moderations: integer("moderations").notNull(),
  flagged: integer("flagged").notNull(),
  flaggedByRule: jsonb("flagged_by_rule")
    .$type<Record<string, { count: number; name: string | null; description: string | null }>>()
    .notNull(),
}).as(sql`
  WITH time_filtered_moderations AS (
    SELECT 
      ${schema.moderations.id} as moderation_id,
      ${schema.moderations.organizationId} as organization_id,
      ${schema.moderations.createdAt} as created_at,
      ${schema.moderations.status} as status
    FROM ${schema.moderations}
    WHERE ${schema.moderations.createdAt} AT TIME ZONE 'UTC' >= date_trunc('hour', now() AT TIME ZONE 'UTC') - INTERVAL '23 hours'
  ),
  flagged_moderations AS (
    SELECT 
      m.moderation_id,
      m.organization_id,
      m.created_at,
      m.status,
      ${schema.moderationsToRules.ruleId} as rule_id,
      COALESCE(${schema.presets.name}, ${schema.rules.name}) as rule_name,
      COALESCE(${schema.presets.description}, ${schema.rules.description}) as rule_description
    FROM time_filtered_moderations m
    LEFT JOIN ${schema.moderationsToRules} ON m.moderation_id = ${schema.moderationsToRules.moderationId}
    LEFT JOIN ${schema.rules} ON ${schema.moderationsToRules.ruleId} = ${schema.rules.id}
    LEFT JOIN ${schema.presets} ON ${schema.rules.presetId} = ${schema.presets.id}
    WHERE m.status = 'Flagged'
  ),
  rule_counts AS (
    SELECT
      date_trunc('hour', m.created_at AT TIME ZONE 'UTC') AS time,
      m.organization_id,
      rule_id,
      COUNT(*) as rule_count,
      MAX(rule_name) as rule_name,
      MAX(rule_description) as rule_description
    FROM flagged_moderations m
    WHERE rule_id IS NOT NULL
    GROUP BY time, m.organization_id, rule_id
  )
  SELECT
    date_trunc('hour', m.created_at AT TIME ZONE 'UTC') as time,
    m.organization_id as organization_id,
    COUNT(*)::int AS moderations,
    COUNT(*) FILTER (WHERE m.status = 'Flagged')::int AS flagged,
    COALESCE(
      jsonb_object_agg(
        rc.rule_id,
        jsonb_build_object(
          'count', rc.rule_count,
          'name', rc.rule_name,
          'description', rc.rule_description
        )
      ) FILTER (WHERE rc.rule_id IS NOT NULL),
      '{}'::jsonb
    ) AS flagged_by_rule
  FROM time_filtered_moderations m
  LEFT JOIN rule_counts rc ON 
    date_trunc('hour', m.created_at AT TIME ZONE 'UTC') = rc.time AND 
    m.organization_id = rc.organization_id
  GROUP BY date_trunc('hour', m.created_at AT TIME ZONE 'UTC'), m.organization_id
`);

export const moderationsAnalyticsDaily = pgMaterializedView("moderations_analytics_daily", {
  time: timestamp("time").notNull(),
  organizationId: text("organization_id").notNull(),
  moderations: integer("moderations").notNull(),
  flagged: integer("flagged").notNull(),
  flaggedByRule: jsonb("flagged_by_rule")
    .$type<Record<string, { count: number; name: string | null; description: string | null }>>()
    .notNull(),
}).as(sql`
  WITH time_filtered_moderations AS (
    SELECT 
      ${schema.moderations.id} as moderation_id,
      ${schema.moderations.organizationId} as organization_id,
      ${schema.moderations.createdAt} as created_at,
      ${schema.moderations.status} as status
    FROM ${schema.moderations}
    WHERE ${schema.moderations.createdAt} AT TIME ZONE 'UTC' >= date_trunc('day', now() AT TIME ZONE 'UTC') - INTERVAL '29 days'
  ),
  flagged_moderations AS (
    SELECT 
      m.moderation_id,
      m.organization_id,
      m.created_at,
      m.status,
      ${schema.moderationsToRules.ruleId} as rule_id,
      COALESCE(${schema.presets.name}, ${schema.rules.name}) as rule_name,
      COALESCE(${schema.presets.description}, ${schema.rules.description}) as rule_description
    FROM time_filtered_moderations m
    LEFT JOIN ${schema.moderationsToRules} ON m.moderation_id = ${schema.moderationsToRules.moderationId}
    LEFT JOIN ${schema.rules} ON ${schema.moderationsToRules.ruleId} = ${schema.rules.id}
    LEFT JOIN ${schema.presets} ON ${schema.rules.presetId} = ${schema.presets.id}
    WHERE m.status = 'Flagged'
  ),
  rule_counts AS (
    SELECT
      date_trunc('day', m.created_at AT TIME ZONE 'UTC') AS time,
      m.organization_id,
      rule_id,
      COUNT(*) as rule_count,
      MAX(rule_name) as rule_name,
      MAX(rule_description) as rule_description
    FROM flagged_moderations m
    WHERE rule_id IS NOT NULL
    GROUP BY time, m.organization_id, rule_id
  )
  SELECT
    date_trunc('day', m.created_at AT TIME ZONE 'UTC') as time,
    m.organization_id as organization_id,
    COUNT(*)::int AS moderations,
    COUNT(*) FILTER (WHERE m.status = 'Flagged')::int AS flagged,
    COALESCE(
      jsonb_object_agg(
        rc.rule_id,
        jsonb_build_object(
          'count', rc.rule_count,
          'name', rc.rule_name,
          'description', rc.rule_description
        )
      ) FILTER (WHERE rc.rule_id IS NOT NULL),
      '{}'::jsonb
    ) AS flagged_by_rule
  FROM time_filtered_moderations m
  LEFT JOIN rule_counts rc ON 
    date_trunc('day', m.created_at AT TIME ZONE 'UTC') = rc.time AND 
    m.organization_id = rc.organization_id
  GROUP BY date_trunc('day', m.created_at AT TIME ZONE 'UTC'), m.organization_id
`);
