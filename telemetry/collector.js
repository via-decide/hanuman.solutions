(function (global) {
  'use strict';

  const STORAGE_KEY = 'hanuman_security_events';
  const EVENT_TYPES = [
    'bot_traffic',
    'ddos_attempt',
    'rate_limit_triggered',
    'suspicious_user_agent',
    'sql_injection_attempt',
    'scanner_bot'
  ];

  function loadStoredEvents() {
    try {
      const raw = global.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn('Telemetry storage read failed', error);
      return [];
    }
  }

  function saveStoredEvents(events) {
    try {
      global.localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(-500)));
    } catch (error) {
      console.warn('Telemetry storage write failed', error);
    }
  }

  function detectBotPattern(event) {
    const userAgent = String(event.userAgent || '').toLowerCase();
    const path = String(event.path || '').toLowerCase();
    const indicators = ['bot', 'crawler', 'scan', 'curl', 'python-requests', 'sqlmap'];

    const matched = indicators.some((token) => userAgent.includes(token) || path.includes(token));
    if (matched && !event.type) {
      return 'scanner_bot';
    }

    if (event.requestsPerMinute && event.requestsPerMinute > 120) {
      return 'ddos_attempt';
    }

    return event.type || 'bot_traffic';
  }

  function normalizeEvent(event) {
    const normalizedType = detectBotPattern(event);
    return {
      timestamp: event.timestamp || new Date().toISOString(),
      site: event.site || 'unknown-site',
      ip: event.ip || '0.0.0.0',
      country: event.country || 'UN',
      type: EVENT_TYPES.includes(normalizedType) ? normalizedType : 'bot_traffic',
      action: event.action || 'blocked',
      source: event.source || 'edge_firewall',
      userAgent: event.userAgent || '',
      path: event.path || '/'
    };
  }

  function logSecurityEvent(event) {
    const events = loadStoredEvents();
    const normalized = normalizeEvent(event);
    events.push(normalized);
    saveStoredEvents(events);
    global.dispatchEvent(new CustomEvent('hanuman:security-event', { detail: normalized }));
    return normalized;
  }

  function captureRequestEvent(requestMeta) {
    return logSecurityEvent({
      ...requestMeta,
      type: detectBotPattern(requestMeta)
    });
  }

  global.HanumanCollector = {
    captureRequestEvent,
    detectBotPattern,
    logSecurityEvent,
    loadStoredEvents,
    saveStoredEvents,
    EVENT_TYPES
  };
})(window);
