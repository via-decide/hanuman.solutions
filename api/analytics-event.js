/**
 * api/analytics-event.js
 * Hanuman.Solutions — Analytics Event Receiver
 * Vercel Serverless Function: POST /api/analytics/event
 *
 * Persists events to /tmp/hanuman_analytics.json
 * (for production: swap for a real DB / KV store)
 */

const fs   = require('fs');
const path = require('path');

const DATA_FILE = path.join('/tmp', 'hanuman_analytics.json');
const MAX_EVENTS = 50000; // rolling cap to avoid tmp overflow

// Intent weights — same as client-side
const INTENT_WEIGHTS = {
  consultation_requested: 10,
  contact_submitted:       8,
  whatsapp_clicked:        5,
  email_clicked:           5,
  proposal_downloaded:     4,
  returning_visitor:       3,
  contact_opened:          2,
  service_view:            1,
  page_view:               0
};

const VALID_EVENTS = new Set(Object.keys(INTENT_WEIGHTS));

function loadEvents() {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (_) {
    return [];
  }
}

function saveEvents(events) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(events.slice(-MAX_EVENTS)));
}

function sanitize(str, maxLen = 256) {
  return String(str || '').slice(0, maxLen).replace(/[<>"']/g, '');
}

module.exports = async (req, res) => {
  // CORS
  const ALLOWED_ORIGINS = ['https://hanuman.solutions', 'https://www.hanuman.solutions'];
  const origin = req.headers.origin || '';
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = req.body || {};
    const incoming = Array.isArray(body.events) ? body.events : [body];

    // Validate & normalize
    const normalized = [];
    for (const raw of incoming) {
      const eventName = sanitize(raw.event || raw.event_name);
      if (!VALID_EVENTS.has(eventName)) continue;

      normalized.push({
        id:           require('crypto').randomUUID(),
        event_name:   eventName,
        visitor_id:   sanitize(raw.visitorId || raw.visitor_id),
        session_id:   sanitize(raw.sessionId || raw.session_id),
        page_slug:    sanitize(raw.pageSlug  || raw.page_slug || '/'),
        metadata_json: JSON.stringify(raw.metadata || {}),
        intent_score: INTENT_WEIGHTS[eventName] || 0,
        created_at:   new Date().toISOString()
      });
    }

    if (!normalized.length) {
      return res.status(400).json({ error: 'No valid events in payload' });
    }

    const existing = loadEvents();
    saveEvents([...existing, ...normalized]);

    return res.status(200).json({ received: normalized.length });
  } catch (err) {
    console.error('[Analytics API] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
