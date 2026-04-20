(function (global) {
  'use strict';

  function classifyTrap(payload) {
    const text = String(payload || '').toLowerCase();
    if (text.includes('/api/fake') || text.includes('/v9/private')) return 'fake_api_endpoint_hits';
    if (text.includes('nmap') || text.includes('sqlmap') || text.includes('<script')) return 'scanner_payloads';
    if (text.includes('crawl') || text.includes('loop') || text.includes('spider')) return 'crawler_loops';
    if (text.includes('ignore previous') || text.includes('system prompt')) return 'prompt_injection_attempts';
    if (text.includes('playwright') || text.includes('puppeteer') || text.includes('selenium')) return 'automation_scripts';
    return 'scanner_payloads';
  }

  function handleTrap(payload, ip, site) {
    if (!global.HanumanCollector) return null;
    const trapType = classifyTrap(typeof payload === 'string' ? payload : JSON.stringify(payload));
    return global.HanumanCollector.captureHoneypotTrap(
      {
        payload,
        path: '/mirror-zayvora-v3/honeypot',
        userAgent: payload.userAgent || 'unknown-bot',
        trap_type: trapType,
        country: payload.country || 'UN'
      },
      ip,
      site
    );
  }

  global.HanumanHoneypotHandler = {
    classifyTrap,
    handleTrap
  };
})(window);
