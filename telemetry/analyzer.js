(function (global) {
  'use strict';

  function summarize(events) {
    const now = Date.now();
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);

    const stats = {
      total: events.length,
      blocked: 0,
      attacksToday: 0,
      topCountries: {},
      sites: {}
    };

    for (const event of events) {
      if (event.action === 'blocked') stats.blocked += 1;
      if (new Date(event.timestamp).getTime() >= startOfDay.getTime()) stats.attacksToday += 1;

      stats.topCountries[event.country] = (stats.topCountries[event.country] || 0) + 1;

      if (!stats.sites[event.site]) {
        stats.sites[event.site] = {
          blockedToday: 0,
          lastThreat: null,
          status: 'Protected'
        };
      }

      const siteStats = stats.sites[event.site];
      if (event.action === 'blocked' && new Date(event.timestamp).getTime() >= startOfDay.getTime()) {
        siteStats.blockedToday += 1;
      }
      if (!siteStats.lastThreat || new Date(event.timestamp).getTime() > new Date(siteStats.lastThreat.timestamp).getTime()) {
        siteStats.lastThreat = event;
      }
    }

    stats.topCountriesSorted = Object.entries(stats.topCountries)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([country, count]) => ({ country, count }));

    stats.protectedSites = Object.keys(stats.sites).length;
    stats.threatSignatures = new Set(events.map((event) => event.type)).size;
    stats.generatedAt = new Date(now).toISOString();

    return stats;
  }

  function byMinute(events, lookbackMinutes) {
    const output = [];
    const now = Date.now();
    const minute = 60 * 1000;

    for (let i = lookbackMinutes - 1; i >= 0; i -= 1) {
      const bucketStart = now - (i * minute);
      const bucketEnd = bucketStart + minute;
      const count = events.filter((event) => {
        const ts = new Date(event.timestamp).getTime();
        return ts >= bucketStart && ts < bucketEnd;
      }).length;
      output.push({
        label: new Date(bucketStart).toISOString().slice(11, 16),
        count
      });
    }

    return output;
  }

  global.HanumanAnalyzer = {
    summarize,
    byMinute
  };
})(window);
