(function (global) {
  'use strict';

  const COUNTRY_COORDS = {
    US: { x: 170, y: 120 },
    RU: { x: 425, y: 85 },
    CN: { x: 470, y: 140 },
    IN: { x: 430, y: 170 },
    BR: { x: 235, y: 235 },
    DE: { x: 337, y: 108 },
    SG: { x: 468, y: 206 },
    NL: { x: 331, y: 102 },
    UN: { x: 320, y: 160 }
  };

  function renderAttackMap(container, events) {
    if (!container) return;

    const countryCounts = events.reduce((acc, event) => {
      const code = event.country || 'UN';
      acc[code] = (acc[code] || 0) + 1;
      return acc;
    }, {});

    const points = Object.entries(countryCounts).map(([country, count]) => {
      const point = COUNTRY_COORDS[country] || COUNTRY_COORDS.UN;
      const radius = Math.min(26, 5 + (count * 1.8));
      return `<g>
        <circle cx="${point.x}" cy="${point.y}" r="${radius}" fill="rgba(255,95,31,0.26)"></circle>
        <circle cx="${point.x}" cy="${point.y}" r="${Math.max(2, radius * 0.24)}" fill="#ffd16a"></circle>
        <text x="${point.x + radius + 4}" y="${point.y - 3}" fill="#ffddb6" font-size="10">${country}: ${count}</text>
      </g>`;
    }).join('');

    container.innerHTML = `
      <svg viewBox="0 0 640 320" role="img" aria-label="Attack origin map">
        <rect width="640" height="320" fill="#0a1018"></rect>
        <path d="M83 98l57-32 64 2 39 18 61 6 18 18 61 10 47 17 34 31-12 44-44 8-51-6-57 20-78-6-67-24-59-15-17-42z" fill="#1f2c3d" opacity=".8"></path>
        <path d="M357 70l67-11 84 19 53 42-15 38-64 18-49-22-43 9-51-33z" fill="#1f2c3d" opacity=".8"></path>
        <path d="M230 222l53 17 47 38-26 17-66-17-32-35z" fill="#1f2c3d" opacity=".8"></path>
        ${points}
      </svg>
    `;
  }

  global.HanumanAttackMap = { renderAttackMap };
})(window);
