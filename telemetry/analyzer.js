(function (global) {
  'use strict';

  function calculateAttackCounts(events) {
    return events.reduce((acc, event) => {
      const type = event.attack_type || event.type || 'bot_scanner';
      acc.total += 1;
      if (event.action === 'blocked') acc.blocked += 1;
      acc.byType[type] = (acc.byType[type] || 0) + 1;
      return acc;
    }, { total: 0, blocked: 0, byType: {} });
  }

  function groupByCountry(events) {
    return events.reduce((acc, event) => {
      const code = event.country || 'UN';
      acc[code] = (acc[code] || 0) + 1;
      return acc;
    }, {});
  }

  function detectBotClusters(events) {
    const clusterMap = events.reduce((acc, event) => {
      const key = `${event.ip || '0.0.0.0'}::${event.site || 'unknown'}`;
      if (!acc[key]) {
        acc[key] = { key, ip: event.ip || '0.0.0.0', site: event.site || 'unknown', attacks: 0, attackTypes: {} };
      }
      const cluster = acc[key];
      const type = event.attack_type || event.type || 'bot_scanner';
      cluster.attacks += 1;
      cluster.attackTypes[type] = (cluster.attackTypes[type] || 0) + 1;
      return acc;
    }, {});

    return Object.values(clusterMap)
      .filter((cluster) => cluster.attacks >= 2)
      .sort((a, b) => b.attacks - a.attacks)
      .slice(0, 10);
  }

  function generateThreatStats(events, protectedSites) {
    const counts = calculateAttackCounts(events);
    const countries = groupByCountry(events);
    const clusters = detectBotClusters(events);
    const siteStats = {};

    for (const site of protectedSites) {
      siteStats[site] = { status: 'Protected', blockedToday: 0, lastDetectedThreat: 'No threats detected' };
    }

    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    for (const event of events) {
      const site = event.site || 'unknown-site';
      if (!siteStats[site]) {
        siteStats[site] = { status: 'Protected', blockedToday: 0, lastDetectedThreat: 'No threats detected' };
      }
      const ts = new Date(event.timestamp).getTime();
      if (event.action === 'blocked' && ts >= todayStart.getTime()) {
        siteStats[site].blockedToday += 1;
      }
      const label = (event.attack_type || event.type || 'bot_scanner').replaceAll('_', ' ');
      siteStats[site].lastDetectedThreat = label;
    }

    return {
      protectedSites: Object.keys(siteStats).length,
      honeypotsActive: 5,
      threatPatternsDetected: Object.keys(counts.byType).length,
      totalAttacksBlocked: counts.blocked,
      counts,
      countries,
      botClusters: clusters,
      siteStats
    };
  }

  global.HanumanAnalyzer = {
    calculateAttackCounts,
    groupByCountry,
    detectBotClusters,
    generateThreatStats
  };
})(window);
