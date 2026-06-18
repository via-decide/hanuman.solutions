-- ════════════════════════════════════════════════════════════════
-- TOP SERVICES REPORT
-- top_services.sql · Hanuman.Solutions Analytics v1
-- ════════════════════════════════════════════════════════════════
-- Returns: which service pages generate the most views AND leads

SELECT
  page_slug                                                   AS service,
  COUNT(*)                                                    AS total_service_views,
  COUNT(DISTINCT visitor_id)                                  AS unique_viewers,

  -- How many viewers from this service eventually requested a consultation
  COUNT(DISTINCT CASE
    WHEN EXISTS (
      SELECT 1 FROM analytics_events e2
      WHERE e2.visitor_id = analytics_events.visitor_id
        AND e2.event_name = 'consultation_requested'
        AND e2.created_at >= analytics_events.created_at
    ) THEN visitor_id
  END)                                                        AS consultations_generated,

  -- Conversion rate from this service page
  ROUND(100.0 * COUNT(DISTINCT CASE
    WHEN EXISTS (
      SELECT 1 FROM analytics_events e2
      WHERE e2.visitor_id = analytics_events.visitor_id
        AND e2.event_name = 'consultation_requested'
        AND e2.created_at >= analytics_events.created_at
    ) THEN visitor_id
  END) / NULLIF(COUNT(DISTINCT visitor_id), 0), 2)            AS service_conversion_rate_pct

FROM analytics_events
WHERE event_name = 'service_view'
  AND date(created_at) BETWEEN date('now', '-30 days') AND date('now')
GROUP BY page_slug
ORDER BY consultations_generated DESC, total_service_views DESC
LIMIT 20;
