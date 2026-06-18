-- ════════════════════════════════════════════════════════════════
-- LEAD SOURCES REPORT
-- lead_sources.sql · Hanuman.Solutions Analytics v1
-- ════════════════════════════════════════════════════════════════
-- Source is stored in metadata_json as { "source": "linkedin" }

SELECT
  COALESCE(json_extract(metadata_json, '$.source'), 'direct')  AS source,
  COUNT(DISTINCT visitor_id)                                    AS unique_visitors,

  SUM(CASE WHEN event_name = 'service_view'            THEN 1 ELSE 0 END) AS service_views,
  SUM(CASE WHEN event_name = 'contact_opened'          THEN 1 ELSE 0 END) AS contact_opens,
  SUM(CASE WHEN event_name = 'contact_submitted'       THEN 1 ELSE 0 END) AS contact_submissions,
  SUM(CASE WHEN event_name = 'consultation_requested'  THEN 1 ELSE 0 END) AS consultation_requests,
  SUM(CASE WHEN event_name = 'email_clicked'           THEN 1 ELSE 0 END) AS email_clicks,
  SUM(CASE WHEN event_name = 'whatsapp_clicked'        THEN 1 ELSE 0 END) AS whatsapp_clicks,
  SUM(CASE WHEN event_name = 'proposal_downloaded'     THEN 1 ELSE 0 END) AS proposal_downloads,

  -- Lead conversion rate per source
  ROUND(100.0 *
    SUM(CASE WHEN event_name = 'consultation_requested' THEN 1 ELSE 0 END) /
    NULLIF(COUNT(DISTINCT visitor_id), 0), 2
  )                                                             AS lead_conversion_rate_pct

FROM analytics_events
WHERE date(created_at) BETWEEN date('now', '-30 days') AND date('now')
GROUP BY source
ORDER BY consultation_requests DESC, unique_visitors DESC;
