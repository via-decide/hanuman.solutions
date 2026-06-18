-- ════════════════════════════════════════════════════════════════
-- HANUMAN.SOLUTIONS · LEAD GENERATION ANALYTICS ENGINE
-- analytics_schema.sql · v1
-- ════════════════════════════════════════════════════════════════

-- Core events table
CREATE TABLE IF NOT EXISTS analytics_events (
  id           TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  event_name   TEXT NOT NULL,
  visitor_id   TEXT NOT NULL,
  session_id   TEXT NOT NULL,
  page_slug    TEXT NOT NULL DEFAULT '/',
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_ae_event_name   ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_ae_visitor      ON analytics_events(visitor_id);
CREATE INDEX IF NOT EXISTS idx_ae_session      ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_ae_page_slug    ON analytics_events(page_slug);
CREATE INDEX IF NOT EXISTS idx_ae_created_at   ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_ae_event_date   ON analytics_events(event_name, created_at);

-- Visitor intent score materialized view (recomputed on demand)
CREATE TABLE IF NOT EXISTS visitor_intent_scores (
  visitor_id          TEXT PRIMARY KEY,
  intent_score        INTEGER NOT NULL DEFAULT 0,
  -- High intent signals
  consultation_count  INTEGER NOT NULL DEFAULT 0,
  whatsapp_count      INTEGER NOT NULL DEFAULT 0,
  email_count         INTEGER NOT NULL DEFAULT 0,
  proposal_count      INTEGER NOT NULL DEFAULT 0,
  -- Medium intent signals
  contact_open_count  INTEGER NOT NULL DEFAULT 0,
  service_view_count  INTEGER NOT NULL DEFAULT 0,
  -- Low intent signals
  page_view_count     INTEGER NOT NULL DEFAULT 0,
  last_event_at       TEXT,
  updated_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- ════════════════════════════════════════════
-- EVENT CATALOG (canonical reference)
-- ════════════════════════════════════════════
-- engagement_events:  page_view, service_view, contact_opened, proposal_downloaded
-- lead_events:        contact_submitted, consultation_requested, email_clicked, whatsapp_clicked
-- retention_events:   returning_visitor

-- Intent score weights:
--   consultation_requested = 10
--   whatsapp_clicked       = 5
--   email_clicked          = 5
--   proposal_downloaded    = 4
--   contact_opened         = 2
--   service_view           = 1
--   page_view              = 0
