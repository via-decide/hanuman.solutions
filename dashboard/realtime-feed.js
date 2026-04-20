(function (global) {
  'use strict';

  const DEFAULT_ENDPOINT = '../telemetry/events.json';

  function formatEvent(event) {
    const time = new Date(event.timestamp).toISOString().slice(11, 19);
    const type = String(event.attack_type || event.type || 'bot_scanner').replaceAll('_', ' ');
    const source = String(event.source || 'unknown');
    return `
      <article class="feed-item">
        <div class="feed-time">${time}</div>
        <div class="feed-title">${type}</div>
        <div class="feed-meta">Target: ${event.site} • IP: ${event.ip} • Source: ${source}</div>
      </article>
    `;
  }

  function renderFeed(container, events, maxItems) {
    if (!container) return;
    const sorted = [...events]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, maxItems || 15);

    container.innerHTML = sorted.map(formatEvent).join('') || '<p class="muted">No attacks logged yet.</p>';
  }

  async function pollFeed(onEvents, intervalMs, endpoint) {
    const targetEndpoint = endpoint || DEFAULT_ENDPOINT;
    const pollInterval = intervalMs || 5000;

    async function runPoll() {
      try {
        const response = await fetch(targetEndpoint, { cache: 'no-store' });
        if (!response.ok) return;
        const events = await response.json();
        if (Array.isArray(events) && typeof onEvents === 'function') {
          onEvents(events);
        }
      } catch (error) {
        console.warn('Realtime feed poll failed', error);
      }
    }

    await runPoll();
    return global.setInterval(runPoll, pollInterval);
  }

  global.HanumanRealtimeFeed = {
    renderFeed,
    pollFeed
  };
})(window);
