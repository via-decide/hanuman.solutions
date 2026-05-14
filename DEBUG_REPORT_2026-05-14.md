# Debug Report (2026-05-14)
Status: Degraded | Critical: 4 | Perf: 58/100 | Mobile: Partial.
Critical 1: External dependencies violate antigravity (`fonts.googleapis`, `cdn.vercel-insights`, `cdnjs three.js`) in `index.html` lines 7-10, 792.
Critical 2: Render risk if Three.js CDN fails; runtime assumes global `THREE` without guard in `index.html` lines 797-826.
Critical 3: Accessibility gap: missing explicit landmarks/labels for interactive controls and low-contrast muted text in hero/body styles (`index.html` lines 253-255, 347-349).
Critical 4: CLS/perf risk: heavy inline SVG + particle animation + render-blocking script load (`index.html` lines 400-1000).
Minor: Placeholder CTAs (`href='#'`) in sovereignty page reduce trust/conversion (`sovereignty/index.html` lines 9-11).
Minor: Adoption page proof links are generic org links, not concrete plugin/demo/testimonial artifacts (`adoption/index.html` lines 4,8).
Warnings: No local font fallback strategy for brand type when third-party blocked; duplicate intake page path (`intake.html` + `public/intake.html`).
Inventory: HTML=8 (`index,intake,sovereignty,adoption,dashboard/*,security-dashboard/index`), JS=8 local + 2 external scripts, CSS=inline-only, Images=inline SVG heavy.
Checks run: `node --check` on all JS (pass), `python -m json.tool vercel.json` (pass), root-path link check script (0 missing).
Deploy test: `python3 -m http.server 8000` then validate `/`, `/intake`, `/sovereignty`, `/adoption` and console/network for blocked CDN behavior.
Priority fixes: 1) localize fonts+three.js or graceful fallback, 2) add `if(!window.THREE)` guard, 3) replace `#` CTAs with working targets, 4) reduce animation cost for mobile.
