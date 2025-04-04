DROP MATERIALIZED VIEW "public"."moderations_analytics_daily";--> statement-breakpoint
DROP MATERIALIZED VIEW "public"."moderations_analytics_hourly";--> statement-breakpoint
CREATE MATERIALIZED VIEW "public"."moderations_analytics_daily" AS (
  WITH time_filtered_moderations AS (
    SELECT 
      "moderations"."id" as moderation_id,
      "moderations"."clerk_organization_id" as clerk_organization_id,
      "moderations"."created_at" as created_at,
      "moderations"."status" as status
    FROM "moderations"
    WHERE "moderations"."created_at" AT TIME ZONE 'UTC' >= date_trunc('day', now() AT TIME ZONE 'UTC') - INTERVAL '29 days'
  ),
  flagged_moderations AS (
    SELECT 
      m.moderation_id,
      m.clerk_organization_id,
      m.created_at,
      m.status,
      "moderations_to_rules"."rule_id" as rule_id,
      COALESCE("presets"."name", "rules"."name") as rule_name,
      COALESCE("presets"."description", "rules"."description") as rule_description
    FROM time_filtered_moderations m
    LEFT JOIN "moderations_to_rules" ON m.moderation_id = "moderations_to_rules"."moderation_id"
    LEFT JOIN "rules" ON "moderations_to_rules"."rule_id" = "rules"."id"
    LEFT JOIN "presets" ON "rules"."preset_id" = "presets"."id"
    WHERE m.status = 'Flagged'
  ),
  rule_counts AS (
    SELECT
      date_trunc('day', m.created_at AT TIME ZONE 'UTC') AS time,
      m.clerk_organization_id,
      rule_id,
      COUNT(*) as rule_count,
      MAX(rule_name) as rule_name,
      MAX(rule_description) as rule_description
    FROM flagged_moderations m
    WHERE rule_id IS NOT NULL
    GROUP BY time, m.clerk_organization_id, rule_id
  )
  SELECT
    date_trunc('day', m.created_at AT TIME ZONE 'UTC') as time,
    m.clerk_organization_id as clerk_organization_id,
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
    m.clerk_organization_id = rc.clerk_organization_id
  GROUP BY date_trunc('day', m.created_at AT TIME ZONE 'UTC'), m.clerk_organization_id
);--> statement-breakpoint

CREATE UNIQUE INDEX moderations_analytics_daily_pkey ON moderations_analytics_daily (time, clerk_organization_id);

CREATE MATERIALIZED VIEW "public"."moderations_analytics_hourly" AS (
  WITH time_filtered_moderations AS (
    SELECT 
      "moderations"."id" as moderation_id,
      "moderations"."clerk_organization_id" as clerk_organization_id,
      "moderations"."created_at" as created_at,
      "moderations"."status" as status
    FROM "moderations"
    WHERE "moderations"."created_at" AT TIME ZONE 'UTC' >= date_trunc('hour', now() AT TIME ZONE 'UTC') - INTERVAL '23 hours'
  ),
  flagged_moderations AS (
    SELECT 
      m.moderation_id,
      m.clerk_organization_id,
      m.created_at,
      m.status,
      "moderations_to_rules"."rule_id" as rule_id,
      COALESCE("presets"."name", "rules"."name") as rule_name,
      COALESCE("presets"."description", "rules"."description") as rule_description
    FROM time_filtered_moderations m
    LEFT JOIN "moderations_to_rules" ON m.moderation_id = "moderations_to_rules"."moderation_id"
    LEFT JOIN "rules" ON "moderations_to_rules"."rule_id" = "rules"."id"
    LEFT JOIN "presets" ON "rules"."preset_id" = "presets"."id"
    WHERE m.status = 'Flagged'
  ),
  rule_counts AS (
    SELECT
      date_trunc('hour', m.created_at AT TIME ZONE 'UTC') AS time,
      m.clerk_organization_id,
      rule_id,
      COUNT(*) as rule_count,
      MAX(rule_name) as rule_name,
      MAX(rule_description) as rule_description
    FROM flagged_moderations m
    WHERE rule_id IS NOT NULL
    GROUP BY time, m.clerk_organization_id, rule_id
  )
  SELECT
    date_trunc('hour', m.created_at AT TIME ZONE 'UTC') as time,
    m.clerk_organization_id as clerk_organization_id,
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
    m.clerk_organization_id = rc.clerk_organization_id
  GROUP BY date_trunc('hour', m.created_at AT TIME ZONE 'UTC'), m.clerk_organization_id
);--> statement-breakpoint

CREATE UNIQUE INDEX moderations_analytics_hourly_pkey ON moderations_analytics_hourly (time, clerk_organization_id);