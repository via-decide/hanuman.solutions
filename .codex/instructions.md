# Task Execution Instructions

Bootstrap required before any task execution:
- `AGENTS.md`
- `.codex/instructions.md`
- `.codex/session.md`

Enforcement:
- Run `rg --files -g 'AGENTS.md' -g '.codex/instructions.md' -g '.codex/session.md'`.
- If any missing: return `BOOTSTRAP_MISSING - task halted` and stop.

Gating:
- Phase order is strict: P1 (Hero/Fragmentation) → P2 (Ecosystem/Plugins) → P3 (Conversion/Open Source).
- Require checkpoint completion and session update before moving phases.
- Track conversion events: github-click, plugin-interest, early-access-signup.
