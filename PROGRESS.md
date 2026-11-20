# Progress

Resume rule: find the first unchecked box and continue there. Each milestone ends with typecheck,
lint, Playwright screenshots (390/768/1440 × light/dark) into `screenshots/<milestone>/`, and a
review of those screenshots.

## M0 Audit + docs
- [x] Audit existing code (11 components, Tailwind tokens, showcase site)
- [x] docs/PROPERTY-SPACE.md (R1)
- [x] docs/ARCHITECTURE.md, docs/DECISIONS.md, PROGRESS.md

## M-a Registry + resolver + cascade
- [x] engine/types.ts
- [x] registry: tokens + property groups
- [x] values.ts (token refs, shadows, gradients, easing, spring→linear)
- [x] cascade.ts (score, match, explain)
- [x] compile.ts (+ @property, media, mode, states, motion manifest)
- [x] default system + runtime/apply + boot script
- [x] checks + screenshots (engine check script: 411 registry entries, ~6ms compile)

## M-b Component migration (≥40)
- [x] use-n helpers, Icon set
- [x] migrate the 11 existing components
- [x] new components to reach ≥ 50
- [x] showcase landing on the new APIs
- [x] checks + screenshots

## M-c Animation engine
- [x] entrance (batches, stagger, in-view, once)
- [x] interaction fx (magnetic, tilt, ripple, spotlight, cursor, parallax)
- [x] scroll effects, ambient keyframes, behaviours (marquee, carousel, typewriter, count-up)
- [x] page transitions, global speed / disable / reduce policy
- [x] checks + screenshots

## M-d Studio shell + inspector
- [x] store (system, history, selection), three panes
- [x] canvas iframe + PreviewAgent protocol, devices, mode, inspect, force state
- [x] inspector generated from the registry, origin + reset, search
- [x] undo/redo, copy/paste, compare, command palette, autosave
- [x] checks + screenshots

## M-e Save / load / export
- [x] route handlers + disk storage + versions
- [x] systems panel: save, save as, duplicate, delete, import/export, diff
- [x] exports: CSS, Tailwind, TS, W3C
- [x] checks + screenshots

## M-f Preview pages
- [x] landing: SaaS home, pricing, blog index, article, shop listing, product, portfolio, docs, login, signup, 404
- [x] dashboard: analytics, data table, settings, kanban, inbox, calendar, checkout, states
- [x] checks + screenshots
- [x] PROOF: the same pages under two starter systems

## M-g Atlas, Motion Lab, Analyzer
- [x] Atlas
- [x] Motion Lab (presets, easing editor, scrubber, fx, ambient)
- [x] Analyzer (coverage, contrast, token usage, unused rules, page scan)
- [x] checks + screenshots

## M-h Starter systems (≥6)
- [x] Normy, Brutalist, Glass, Editorial, Neumorphic, Material, Terminal, Playful, Luxury
- [x] screenshots under each

## M-i Polish
- [x] a11y pass, reduced motion, keyboard
- [x] PROPERTY-SPACE R4, final docs
- [x] final typecheck + lint + screenshots

## M-j Usability overhaul (after first review)
- [x] black / white / blue identity (registry defaults, Studio chrome, Hub)
- [x] Studio: rail + one resizable panel + canvas dock; interface size S/M/L; collapsible panel
- [x] Style panel: starters, brand colour (presets + any colour), neutrals, corners, spacing, type, depth, lines, motion
- [x] Edit panel: click-to-edit, plain-language scope, state tabs, essentials, all properties, Advanced = old inspector
- [x] Library / Export / History restyled; first-run welcome; page picker in the top bar
- [x] canvas outlines everything the current edit touches
- [x] Hub rebuilt as a product landing page with a Studio product shot
- [x] e2e rewritten for the new flow (13/13), typecheck + lint clean, screenshots regenerated

## M-k Agent Kit (the purpose: consistent UI from AI agents)
- [x] Guide in the system (feel, product, language, rule packs, own rules, lessons) + Studio Guide panel
- [x] Kit generator: SKILL.md, references (components + recipes, tokens, setup, motion), AGENTS block, review log, checker config
- [x] Kit code: components, compiled CSS, next/font fonts, motion runtime shim, provider, boot script
- [x] `check.mjs` (static) and `audit.mjs` (rendered, screenshots)
- [x] Export → Agent Kit (zip via /api/kit), `pnpm kit <system> <project>` installer
- [x] Proof: fresh Next.js app builds with the kit; good page passes check + audit, planted bad page fails both
- [x] System fixes found by the audit (dark accent contrast, 11px labels, centred Hero)
- [x] e2e 14/14, kit UI check 10/10, flash check 10/10, typecheck + lint clean

## M-l Components view + page-change glitch
- [x] Page transition never blanks the page; Studio canvas navigates instead of reloading (filmed: no empty frame)
- [x] /preview/components card view and /preview/components/<type> canvas view (variants, sizes, states, motion + replay, anatomy)
- [x] Studio: Pages | Components switch, component picker, Components rail panel, Edit panel follows the open component
- [x] components-check 10/10, e2e 14/14, kit UI 10/10, flash 10/10

## Log
- 2026-11-18: engine + 62 components render from data (smoke test light/dark OK, no console errors). Notes:
  hydration-safe motion runtime (no DOM attribute bookkeeping); stateful parts; overlay roots are display:contents wrappers.
- 2026-11-19: Studio, save/load API, 19 preview pages, 9 starter systems done. Proof sheets in
  screenshots/proof/ (saas-sheet.png, sheet-2.png). Structural rules added (hero layout per system).
  Dev server: use `bash scripts/with-server.sh <cmd>` (starts + stops a server per command).
  NEXT: Atlas, Motion Lab, Analyzer, hub home page, Th onSort, VisuallyHidden cleanup, full screenshots.
- 2026-11-19: Labs (Atlas, Motion Lab, Analyzer) and hub done. Analyzer caught a real contrast bug
  (border-strong < 3:1), fixed in tokens. Mobile overflow fixed on table/inbox/checkout/app bar.
  Tailwind removed. Production build passes (28 routes). Studio e2e: 10/10 PASS.
  Final screenshot matrix: screenshots/final (pnpm screenshots).
- 2026-11-19: Usability overhaul after first review (decisions 29–37). Studio rebuilt around
  Style → Edit → Advanced, resizable/scalable chrome, black/white/blue identity, new Hub.
