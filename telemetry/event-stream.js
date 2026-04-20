(function (global) {
  'use strict';

  function getDashboardMetrics(events, protectedSites) {
    const items = Array.isArray(events) ? events : [];
    const expectedSites = Array.isArray(protectedSites) ? protectedSites : [];
    const blockedIps = new Set();
    const protectedSiteSet = new Set(expectedSites);
    let liveAttacks = 0;
    let honeypotCaptures = 0;
    let attacksToday = 0;
    let latestThreat = null;
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    for (const event of items) {
      if (event.site) protectedSiteSet.add(event.site);
      if (event.action === 'blocked') {
        liveAttacks += 1;
        blockedIps.add(event.ip || '0.0.0.0');
        if (new Date(event.timestamp).getTime() >= todayStart.getTime()) attacksToday += 1;
      }
      if ((event.attack_type || event.type) === 'honeypot_capture' || String(event.source || '').includes('honeypot')) {
        honeypotCaptures += 1;
      }
      if (!latestThreat || new Date(event.timestamp) > new Date(latestThreat.timestamp)) {
        latestThreat = event;
      }
    }

    return {
      liveAttacks,
      blockedIps: blockedIps.size,
      honeypotCaptures,
      attacksToday,
      protectedSites: protectedSiteSet.size,
      latestThreat
    };
  }

  global.HanumanEventStream = {
    getDashboardMetrics
  };
})(window);
