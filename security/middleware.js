'use strict';

const DEFAULT_TELEMETRY_ENDPOINT = '/telemetry/security-events';
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 60;
const ABUSE_SCORE_THRESHOLD = 3;

const requestBuckets = new Map();

const BOT_SIGNATURES = [
  'bot',
  'crawler',
  'spider',
  'curl',
  'wget',
  'httpclient',
  'python-requests',
  'scrapy',
  'headless',
  'selenium',
  'playwright',
  'puppeteer'
];

const ATTACK_PATTERNS = [
  { type: 'sql_injection', regex: /(?:\bunion\b\s+\bselect\b|\bor\b\s+1=1|information_schema|sleep\s*\()/i },
  { type: 'xss_attempt', regex: /<script\b|javascript:|onerror\s*=|onload\s*=/i },
  { type: 'path_traversal', regex: /\.\.\/|%2e%2e%2f|\/etc\/passwd|\/proc\/self\//i },
  { type: 'command_injection', regex: /(?:;|&&|\|\|)\s*(?:cat|ls|bash|sh|curl|wget)\b/i },
  { type: 'template_injection', regex: /\{\{.*\}\}|\$\{.*\}|<%=?\s*.*\s*%>/i },
  { type: 'prompt_injection', regex: /ignore\s+(all\s+)?previous\s+instructions|reveal\s+system\s+prompt|developer\s+mode/i }
];

function getClientIp(request) {
  const headers = request.headers || {};
  const xForwardedFor = headers['x-forwarded-for'] || headers['X-Forwarded-For'];
  if (xForwardedFor) return String(xForwardedFor).split(',')[0].trim();
  return request.ip || '0.0.0.0';
}

function getRequestText(request) {
  if (!request) return '';
  const url = String(request.url || request.path || '');
  const query = String(request.queryString || '');
  const body = typeof request.body === 'string' ? request.body : JSON.stringify(request.body || '');
  return `${url} ${query} ${body}`.toLowerCase();
}

function getRateLimitSignal(ip, now = Date.now()) {
  const history = requestBuckets.get(ip) || [];
  const recent = history.filter((ts) => now - ts <= RATE_LIMIT_WINDOW_MS);
  recent.push(now);
  requestBuckets.set(ip, recent);

  const overLimit = recent.length > MAX_REQUESTS_PER_WINDOW;
  const abuseScore = overLimit ? Math.ceil((recent.length - MAX_REQUESTS_PER_WINDOW) / 10) + 1 : 0;

  return {
    requestsInWindow: recent.length,
    overLimit,
    abuseScore
  };
}

function detectBotTraffic(request) {
  const userAgent = String((request.headers && (request.headers['user-agent'] || request.headers['User-Agent'])) || '').toLowerCase();
  const matchedSignature = BOT_SIGNATURES.find((signature) => userAgent.includes(signature));
  return {
    isBot: Boolean(matchedSignature),
    signature: matchedSignature || null,
    userAgent
  };
}

function detectAttackPatterns(request) {
  const requestText = getRequestText(request);
  const matches = ATTACK_PATTERNS
    .filter((pattern) => pattern.regex.test(requestText))
    .map((pattern) => pattern.type);

  return {
    hasAttackPattern: matches.length > 0,
    matches,
    sample: requestText.slice(0, 250)
  };
}

async function logSecurityEvent(event, options = {}) {
  const endpoint = options.telemetryEndpoint || DEFAULT_TELEMETRY_ENDPOINT;
  const eventPayload = {
    timestamp: new Date().toISOString(),
    ...event
  };

  if (typeof fetch !== 'function') return { delivered: false, reason: 'fetch_unavailable', event: eventPayload };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(eventPayload),
      keepalive: true
    });

    return {
      delivered: response.ok,
      status: response.status,
      event: eventPayload
    };
  } catch (error) {
    return {
      delivered: false,
      reason: 'network_error',
      error: error.message,
      event: eventPayload
    };
  }
}

async function inspectRequest(request, options = {}) {
  const ip = getClientIp(request);
  const botSignal = detectBotTraffic(request);
  const attackSignal = detectAttackPatterns(request);
  const rateSignal = getRateLimitSignal(ip);

  const reasons = [];
  if (botSignal.isBot) reasons.push(`bot:${botSignal.signature}`);
  if (attackSignal.hasAttackPattern) reasons.push(...attackSignal.matches);
  if (rateSignal.overLimit && rateSignal.abuseScore >= ABUSE_SCORE_THRESHOLD) reasons.push('rate_limit_abuse');

  const blocked = reasons.length > 0;
  const verdict = blocked ? 'blocked' : 'allowed';

  const event = {
    site: options.site || 'daxini.space',
    ip,
    path: request.path || request.url || '/',
    method: request.method || 'GET',
    action: verdict,
    reasons,
    bot_signal: botSignal,
    attack_signal: attackSignal,
    rate_signal: rateSignal
  };

  if (blocked || options.logAllRequests) {
    await logSecurityEvent(event, options);
  }

  return {
    blocked,
    statusCode: blocked ? 403 : 200,
    verdict,
    reasons,
    context: event
  };
}

module.exports = {
  inspectRequest,
  detectBotTraffic,
  detectAttackPatterns,
  logSecurityEvent
};
