(function (global) {
  'use strict';

  const STORAGE_KEY = 'hanuman_security_events';
  const EVENT_ENDPOINT = '../telemetry/events.json';
  const ATTACK_TYPES = [
    'bot_scanner',
    'prompt_injection',
    'api_probing',
    'crawler_swarm',
    'script_injection',
    'rate_limit_abuse',
    'automation_script'
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
      global.localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(-1500)));
    } catch (error) {
      console.warn('Telemetry storage write failed', error);
    }
  }

  function detectAttackPattern(payload) {
    const userAgent = String(payload.userAgent || '').toLowerCase();
    const path = String(payload.path || '').toLowerCase();
    const body = String(payload.payload || '').toLowerCase();
    const requestsPerMinute = Number(payload.requestsPerMinute || 0);

    if (path.includes('/v1/internal') || path.includes('/admin/debug') || body.includes('ignore previous instructions')) {
      return 'prompt_injection';
    }
    if (path.includes('/api/') && (path.includes('graphql') || path.includes('openapi') || path.includes('swagger'))) {
      return 'api_probing';
    }
    if (userAgent.includes('crawler') || userAgent.includes('spider') || requestsPerMinute > 100) {
      return 'crawler_swarm';
    }
    if (userAgent.includes('python') || userAgent.includes('playwright') || body.includes('automation')) {
      return 'automation_script';
    }
    if (body.includes('<script') || body.includes('union select') || path.includes('/.env')) {
      return 'script_injection';
    }
    if (requestsPerMinute > 60) {
      return 'rate_limit_abuse';
    }
    return 'bot_scanner';
  }

  function normalizeEvent(event) {
    const attackType = event.attack_type || event.type || detectAttackPattern(event);
    return {
      timestamp: event.timestamp || new Date().toISOString(),
      site: event.site || 'unknown-site',
      ip: event.ip || '0.0.0.0',
      country: event.country || 'UN',
      attack_type: ATTACK_TYPES.includes(attackType) ? attackType : 'bot_scanner',
      source: event.source || 'bot_detection_scripts',
      action: event.action || 'blocked',
      payload: event.payload || '',
      path: event.path || '/',
      userAgent: event.userAgent || ''
    };
  }

  function storeEvent(event) {
    const events = loadStoredEvents();
    const normalized = normalizeEvent(event);
    events.push(normalized);
    saveStoredEvents(events);
    global.dispatchEvent(new CustomEvent('hanuman:security-event', { detail: normalized }));
    return normalized;
  }

  function captureRequestEvent(requestMeta) {
    return storeEvent({
      ...requestMeta,
      source: requestMeta.source || 'cloudflare_tunnel_logs',
      attack_type: detectAttackPattern(requestMeta)
    });
  }

  function captureHoneypotTrap(payload, ip, site) {
    return storeEvent({
      timestamp: new Date().toISOString(),
      site,
      ip,
      country: payload.country || 'UN',
      payload: typeof payload === 'string' ? payload : JSON.stringify(payload),
      userAgent: payload.userAgent || '',
      path: payload.path || '/mirror-zayvora-v3/trap',
      source: 'mirror_zayvora_v3_honeypot',
      action: 'blocked',
      attack_type: detectAttackPattern(payload)
    });
  }

  async function hydrateFromEventsFile() {
    try {
      const response = await fetch(EVENT_ENDPOINT, { cache: 'no-store' });
      if (!response.ok) return loadStoredEvents();
      const remoteEvents = await response.json();
      const localEvents = loadStoredEvents();
      if (Array.isArray(remoteEvents) && localEvents.length < remoteEvents.length) {
        saveStoredEvents(remoteEvents);
        return remoteEvents;
      }
      return localEvents;
    } catch (error) {
      console.warn('Events bootstrap failed', error);
      return loadStoredEvents();
    }
  }

  global.HanumanCollector = {
    captureRequestEvent,
    detectAttackPattern,
    captureHoneypotTrap,
    storeEvent,
    hydrateFromEventsFile,
    loadStoredEvents,
    saveStoredEvents,
    ATTACK_TYPES
  };
})(window);
