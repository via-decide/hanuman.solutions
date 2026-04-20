(function (global) {
  'use strict';

  function formatEvent(event) {
    const time = new Date(event.timestamp).toISOString().slice(11, 19);
    const type = String(event.type || '').replaceAll('_', ' ');
    return `
      <article class="feed-item">
        <div class="feed-time">${time}</div>
        <div class="feed-title">${event.action} ${type}</div>
        <div class="feed-meta">IP: ${event.ip} • Target: ${event.site}</div>
      </article>
    `;
  }

  function renderFeed(container, events, maxItems) {
    if (!container) return;
    const sorted = [...events]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, maxItems || 12);

    container.innerHTML = sorted.map(formatEvent).join('') || '<p class="muted">No attacks logged yet.</p>';
  }

  global.HanumanRealtimeFeed = { renderFeed };
})(window);
