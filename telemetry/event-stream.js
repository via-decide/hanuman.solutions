(function (global) {
  'use strict';

  function getDashboardMetrics(events) {
    const items = Array.isArray(events) ? events : [];
    const blockedIps = new Set();
    let liveAttacks = 0;
    let honeypotCaptures = 0;

    for (const event of items) {
      if (event.action === 'blocked') {
        liveAttacks += 1;
        blockedIps.add(event.ip || '0.0.0.0');
      }
      if ((event.attack_type || event.type) === 'honeypot_capture' || String(event.source || '').includes('honeypot')) {
        honeypotCaptures += 1;
      }
    }

    return { liveAttacks, blockedIps: blockedIps.size, honeypotCaptures };
  }

  global.HanumanEventStream = {
    getDashboardMetrics
  };
})(window);
