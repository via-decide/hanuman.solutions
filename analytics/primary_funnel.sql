-- ════════════════════════════════════════════════════════════════
-- PRIMARY FUNNEL: Visitor → Service Page → Contact → Consultation
-- primary_funnel.sql · Hanuman.Solutions Analytics v1
-- ════════════════════════════════════════════════════════════════

WITH
  period AS (
    SELECT
      date('now', '-30 days') AS start_date,
      date('now')             AS end_date
  ),

  -- Unique visitors in period (identified by first page_view)
  visitors AS (
    SELECT COUNT(DISTINCT visitor_id) AS total_visitors
    FROM analytics_events
    WHERE event_name = 'page_view'
      AND date(created_at) BETWEEN (SELECT start_date FROM period) AND (SELECT end_date FROM period)
  ),

  -- Visitors who viewed at least one service page
  service_viewers AS (
    SELECT COUNT(DISTINCT visitor_id) AS service_views
    FROM analytics_events
    WHERE event_name = 'service_view'
      AND date(created_at) BETWEEN (SELECT start_date FROM period) AND (SELECT end_date FROM period)
  ),

  -- Visitors who opened the contact page
  contact_openers AS (
    SELECT COUNT(DISTINCT visitor_id) AS contact_opens
    FROM analytics_events
    WHERE event_name = 'contact_opened'
      AND date(created_at) BETWEEN (SELECT start_date FROM period) AND (SELECT end_date FROM period)
  ),

  -- Visitors who completed a consultation request
  consult_requests AS (
    SELECT COUNT(DISTINCT visitor_id) AS consultations
    FROM analytics_events
    WHERE event_name = 'consultation_requested'
      AND date(created_at) BETWEEN (SELECT start_date FROM period) AND (SELECT end_date FROM period)
  )

SELECT
  v.total_visitors,
  sv.service_views,
  co.contact_opens,
  cr.consultations,

  -- Funnel Rates
  ROUND(100.0 * sv.service_views   / NULLIF(v.total_visitors, 0), 2)  AS service_view_rate_pct,
  ROUND(100.0 * co.contact_opens   / NULLIF(sv.service_views, 0), 2)  AS contact_rate_pct,
  ROUND(100.0 * cr.consultations   / NULLIF(co.contact_opens, 0), 2)  AS contact_to_consult_rate_pct,
  ROUND(100.0 * cr.consultations   / NULLIF(v.total_visitors, 0), 2)  AS lead_conversion_rate_pct,

  -- Drop-off rates between stages
  ROUND(100.0 * (sv.service_views - co.contact_opens) / NULLIF(sv.service_views, 0), 2)  AS dropoff_service_to_contact_pct,
  ROUND(100.0 * (co.contact_opens - cr.consultations) / NULLIF(co.contact_opens, 0), 2)  AS dropoff_contact_to_consult_pct,
  ROUND(100.0 * (1.0 - (cr.consultations * 1.0 / NULLIF(sv.service_views, 0))), 2)       AS funnel_dropoff_rate_pct

FROM visitors v, service_viewers sv, contact_openers co, consult_requests cr;
