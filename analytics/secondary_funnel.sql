-- ════════════════════════════════════════════════════════════════
-- SECONDARY FUNNEL: Visitor → Case Study → Contact → Consultation
-- secondary_funnel.sql · Hanuman.Solutions Analytics v1
-- ════════════════════════════════════════════════════════════════

WITH
  period AS (
    SELECT
      date('now', '-30 days') AS start_date,
      date('now')             AS end_date
  ),

  -- Total unique visitors (baseline)
  visitors AS (
    SELECT COUNT(DISTINCT visitor_id) AS total_visitors
    FROM analytics_events
    WHERE event_name = 'page_view'
      AND date(created_at) BETWEEN (SELECT start_date FROM period) AND (SELECT end_date FROM period)
  ),

  -- Case study viewers: page_slug contains 'case-study' or 'proof' or 'real-fixes' (s1 section)
  case_study_viewers AS (
    SELECT COUNT(DISTINCT visitor_id) AS case_study_views
    FROM analytics_events
    WHERE event_name = 'page_view'
      AND (
        page_slug LIKE '%case-study%'
        OR page_slug LIKE '%proof%'
        OR json_extract(metadata_json, '$.section') = 's1'
        OR json_extract(metadata_json, '$.section') = 'proof'
      )
      AND date(created_at) BETWEEN (SELECT start_date FROM period) AND (SELECT end_date FROM period)
  ),

  -- Visitors who went from a case study to contact
  case_study_to_contact AS (
    SELECT COUNT(DISTINCT e1.visitor_id) AS cs_contact_opens
    FROM analytics_events e1
    INNER JOIN analytics_events e2
      ON e1.visitor_id = e2.visitor_id
     AND e2.event_name = 'contact_opened'
     AND e2.created_at >= e1.created_at
    WHERE e1.event_name = 'page_view'
      AND (
        e1.page_slug LIKE '%case-study%'
        OR e1.page_slug LIKE '%proof%'
        OR json_extract(e1.metadata_json, '$.section') = 's1'
      )
      AND date(e1.created_at) BETWEEN (SELECT start_date FROM period) AND (SELECT end_date FROM period)
  ),

  -- Visitors who went from case study to consultation
  case_study_conversions AS (
    SELECT COUNT(DISTINCT e1.visitor_id) AS cs_consultations
    FROM analytics_events e1
    INNER JOIN analytics_events e2
      ON e1.visitor_id = e2.visitor_id
     AND e2.event_name = 'consultation_requested'
     AND e2.created_at >= e1.created_at
    WHERE e1.event_name = 'page_view'
      AND (
        e1.page_slug LIKE '%case-study%'
        OR e1.page_slug LIKE '%proof%'
        OR json_extract(e1.metadata_json, '$.section') = 's1'
      )
      AND date(e1.created_at) BETWEEN (SELECT start_date FROM period) AND (SELECT end_date FROM period)
  )

SELECT
  v.total_visitors,
  cs.case_study_views,
  csc.cs_contact_opens,
  csc2.cs_consultations,

  -- Secondary funnel rates
  ROUND(100.0 * cs.case_study_views    / NULLIF(v.total_visitors, 0), 2)      AS case_study_view_rate_pct,
  ROUND(100.0 * csc.cs_contact_opens   / NULLIF(cs.case_study_views, 0), 2)   AS case_study_contact_rate_pct,
  ROUND(100.0 * csc2.cs_consultations  / NULLIF(cs.case_study_views, 0), 2)   AS case_study_conversion_rate_pct,
  ROUND(100.0 * csc2.cs_consultations  / NULLIF(v.total_visitors, 0), 2)       AS case_study_lead_rate_pct,

  -- Drop-off
  ROUND(100.0 * (cs.case_study_views - csc.cs_contact_opens) / NULLIF(cs.case_study_views, 0), 2)    AS dropoff_case_to_contact_pct,
  ROUND(100.0 * (csc.cs_contact_opens - csc2.cs_consultations) / NULLIF(csc.cs_contact_opens, 0), 2) AS dropoff_contact_to_consult_pct

FROM visitors v, case_study_viewers cs, case_study_to_contact csc, case_study_conversions csc2;
