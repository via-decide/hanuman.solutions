(function (global) {
  'use strict';

  const COUNTRY_COORDS = {
    US: { x: 160, y: 130 },
    CN: { x: 470, y: 140 },
    RU: { x: 420, y: 85 },
    BR: { x: 230, y: 235 },
    IN: { x: 430, y: 165 },
    DE: { x: 335, y: 110 },
    NL: { x: 328, y: 103 },
    SG: { x: 468, y: 208 },
    FR: { x: 325, y: 116 },
    UN: { x: 320, y: 165 }
  };

  function renderMap(container, events) {
    if (!container) return;
    const attacksByCountry = events.reduce((acc, event) => {
      acc[event.country] = (acc[event.country] || 0) + 1;
      return acc;
    }, {});

    const points = Object.entries(attacksByCountry).map(([country, count]) => {
      const point = COUNTRY_COORDS[country] || COUNTRY_COORDS.UN;
      const size = Math.min(28, 6 + (count * 2));
      return `<g>
        <circle cx="${point.x}" cy="${point.y}" r="${size}" fill="rgba(255,95,31,0.25)"></circle>
        <circle cx="${point.x}" cy="${point.y}" r="${Math.max(3, size * 0.2)}" fill="#ffbf69"></circle>
        <text x="${point.x + size + 3}" y="${point.y - 2}" fill="#ffd7b0" font-size="10">${country}: ${count}</text>
      </g>`;
    }).join('');

    container.innerHTML = `
      <svg viewBox="0 0 640 320" role="img" aria-label="Global attack map">
        <rect x="0" y="0" width="640" height="320" fill="#0d1117"></rect>
        <path d="M83 98l57-32 64 2 39 18 61 6 18 18 61 10 47 17 34 31-12 44-44 8-51-6-57 20-78-6-67-24-59-15-17-42z" fill="#1d2938" opacity=".7"></path>
        <path d="M357 70l67-11 84 19 53 42-15 38-64 18-49-22-43 9-51-33z" fill="#1d2938" opacity=".7"></path>
        <path d="M230 222l53 17 47 38-26 17-66-17-32-35z" fill="#1d2938" opacity=".7"></path>
        ${points}
      </svg>
    `;
  }

  global.HanumanSecurityMap = { renderMap };
})(window);
