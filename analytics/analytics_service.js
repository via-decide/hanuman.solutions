/**
 * analytics_service.js
 * Hanuman.Solutions — Lead Generation Analytics Engine v1
 *
 * Tracks consulting intent events with zero dependency on traffic logs.
 * All events are emitted directly by application logic.
 *
 * API: POST /api/analytics/event
 * Storage: localStorage queue → flushed on idle / page unload
 */

(function (global) {
  'use strict';

  // ── CONFIGURATION ─────────────────────────────────────────────
  const STORAGE_KEY   = 'hanuman_lead_events';
  const VISITOR_KEY   = 'hanuman_visitor_id';
  const SESSION_KEY   = 'hanuman_session_id';
  const LAST_SEEN_KEY = 'hanuman_last_seen';
  const FLUSH_ENDPOINT = '/api/analytics/event';
  const FLUSH_BATCH    = 10;      // flush after N queued events
  const RETURN_WINDOW  = 86400000; // 24 hours in ms

  // ── INTENT SCORES ─────────────────────────────────────────────
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

  // ── IDENTITY ──────────────────────────────────────────────────
  function generateId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  function getVisitorId() {
    let vid = localStorage.getItem(VISITOR_KEY);
    if (!vid) { vid = generateId(); localStorage.setItem(VISITOR_KEY, vid); }
    return vid;
  }

  function getSessionId() {
    let sid = sessionStorage.getItem(SESSION_KEY);
    if (!sid) { sid = generateId(); sessionStorage.setItem(SESSION_KEY, sid); }
    return sid;
  }

  function getPageSlug() {
    return global.location.pathname || '/';
  }

  // ── RETURNING VISITOR DETECTION ───────────────────────────────
  function checkReturningVisitor() {
    const lastSeen = parseInt(localStorage.getItem(LAST_SEEN_KEY) || '0', 10);
    const now = Date.now();
    if (lastSeen > 0 && (now - lastSeen) > RETURN_WINDOW) {
      track('returning_visitor', {
        days_since_last_visit: Math.floor((now - lastSeen) / 86400000)
      });
    }
    localStorage.setItem(LAST_SEEN_KEY, String(now));
  }

  // ── QUEUE MANAGEMENT ──────────────────────────────────────────
  function loadQueue() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function saveQueue(queue) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queue.slice(-500)));
    } catch (e) {
      console.warn('[Hanuman Analytics] Queue write failed', e);
    }
  }

  // ── CORE TRACK FUNCTION ───────────────────────────────────────
  /**
   * track(eventName, metadata)
   *
   * @param {string} eventName - one of the canonical consulting events
   * @param {object} metadata  - event-specific context (source, service_name, etc.)
   */
  function track(eventName, metadata) {
    if (typeof eventName !== 'string' || !eventName) return;

    const event = {
      event_name:   eventName,
      visitor_id:   getVisitorId(),
      session_id:   getSessionId(),
      page_slug:    getPageSlug(),
      metadata:     Object.assign({ source: _getUtmSource() }, metadata || {}),
      intent_score: INTENT_WEIGHTS[eventName] || 0,
      created_at:   new Date().toISOString()
    };

    // Queue locally
    const queue = loadQueue();
    queue.push(event);
    saveQueue(queue);

    // Dispatch to DOM for real-time dashboard listeners
    global.dispatchEvent(new CustomEvent('hanuman:lead-event', { detail: event }));

    // Flush if batch threshold reached
    if (queue.length >= FLUSH_BATCH) {
      flush();
    }

    return event;
  }

  // ── UTM SOURCE DETECTION ──────────────────────────────────────
  function _getUtmSource() {
    try {
      const params = new URLSearchParams(global.location.search);
      return params.get('utm_source') || params.get('ref') || document.referrer
        ? new URL(document.referrer).hostname
        : 'direct';
    } catch (e) {
      return 'direct';
    }
  }

  // ── FLUSH TO API ──────────────────────────────────────────────
  async function flush() {
    const queue = loadQueue();
    if (!queue.length) return;

    // Process sequentially to avoid duplicate flushes
    saveQueue([]); // clear queue optimistically

    try {
      if (typeof navigator.sendBeacon === 'function') {
        const blob = new Blob([JSON.stringify({ events: queue })], { type: 'application/json' });
        navigator.sendBeacon(FLUSH_ENDPOINT, blob);
      } else {
        await fetch(FLUSH_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ events: queue }),
          keepalive: true
        });
      }
    } catch (err) {
      // Re-queue on failure
      const current = loadQueue();
      saveQueue([...queue, ...current]);
      console.warn('[Hanuman Analytics] Flush failed, re-queued', err);
    }
  }

  // ── INTENT SCORE FOR VISITOR ──────────────────────────────────
  function getIntentScore(visitorId) {
    const vid = visitorId || getVisitorId();
    const queue = loadQueue();
    return queue
      .filter(e => e.visitor_id === vid)
      .reduce((score, e) => score + (INTENT_WEIGHTS[e.event_name] || 0), 0);
  }

  // ── CONVENIENT SHORTHAND TRACKERS ────────────────────────────
  const HanumanAnalytics = {

    // Core
    track,
    flush,
    getIntentScore,
    getVisitorId,
    getSessionId,

    // Semantic shorthands (call these directly in HTML/JS)
    pageView: (meta)          => track('page_view', meta),
    serviceView: (service, meta) => track('service_view', Object.assign({ service_name: service }, meta)),
    contactOpened: (meta)     => track('contact_opened', meta),
    contactSubmitted: (meta)  => track('contact_submitted', meta),
    consultationRequested: (meta) => track('consultation_requested', meta),
    proposalDownloaded: (doc, meta) => track('proposal_downloaded', Object.assign({ proposal_name: doc }, meta)),
    emailClicked: (email, meta) => track('email_clicked', Object.assign({ email_address: email }, meta)),
    whatsappClicked: (phone, meta) => track('whatsapp_clicked', Object.assign({ phone_number: phone }, meta)),

    // Called once on init
    init() {
      checkReturningVisitor();
      track('page_view', { section: 'hero' });

      // Flush on page unload
      global.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') flush();
      });
      global.addEventListener('pagehide', flush);

      // Flush on idle
      if ('requestIdleCallback' in global) {
        requestIdleCallback(() => flush(), { timeout: 5000 });
      }
    }
  };

  global.HanumanAnalytics = HanumanAnalytics;

})(window);
