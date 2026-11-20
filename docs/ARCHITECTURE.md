# Normy architecture

```
engine/                         the Design Engine (framework-agnostic TS + a small client runtime)
  types.ts                      DesignSystem, Rule, Scope, values, PropertyDef, ComponentDef
  registry/                     THE single source of truth
    tokens.ts                   148 foundation tokens (colour roles ×2 modes, type, space, shape, elevation, motion, bp, a11y)
    properties.ts               263 style / motion / behaviour properties in 19 groups
    index.ts                    GROUPS metadata, lookups, stats
  values.ts                     value → CSS (token refs, shadows, gradients/mesh, patterns, grain, easing, spring → linear())
  cascade.ts                    scoring, matching, rule ordering, explain() (origin of any value)
  compile.ts                    DesignSystem + recipes → one CSS string + motion manifest
  components/                   65 component definitions: parts, variants, sizes, states, recipe (data)
  systems/                      9 starter systems + the Studio's own chrome system
  export.ts                     CSS · Tailwind v4 theme · TypeScript tokens · W3C DTCG JSON · Normy JSON
  diff.ts                       flatten + diff two systems
  contrast.ts                   WCAG 2 ratio + APCA Lc, browser colour resolver
  fonts.ts                      bundled font stacks for the font pickers
  react.ts                      nRoot / nPart attribute helpers, token layout helpers (server-safe)
  runtime/
    apply.ts                    inject CSS, mode, motion policy, localStorage cache, BOOT_SCRIPT
    motion.ts                   entrance batches + stagger, fx, scroll, typewriter, count-up, replay
    agent.ts                    canvas side of the Studio protocol (inspect, force, highlight…)
    channel.ts                  message types + BroadcastChannel

components/normy/               the library — structure + ARIA + behaviour only, no visual values
components/runtime/             <NormyRuntime/> (applies the active system on every page except /studio)
components/studio/              Studio: store (zustand), canvas, style panel + theme presets, edit panel, guide panel, inspector (Advanced), controls, panels
components/preview/component-views.tsx  Components card view + canvas view (samples from atlas.tsx)
engine/guide.ts                 Guide model: rule packs, defaults, lessons parse/merge
engine/kit/docs.ts              Agent Kit documents (SKILL.md, references, AGENTS block, checker config); pure
lib/kit.ts, lib/zip.ts          Agent Kit builder (reads component sources, compiles CSS) + zip writer
kit-template/                   Files copied verbatim into every kit (runtime shim, provider, boot, check.mjs, audit.mjs)
components/preview/             preview shells, content data, Atlas, Motion Lab, Analyzer
components/site/hub.tsx         the showcase hub (/)

app/
  page.tsx                      hub
  studio/                       the Studio
  preview/(landing)/…           SaaS, pricing, blog, article, shop, product, portfolio, docs, 404
  preview/(auth)/…              login, signup
  preview/app/…                 analytics, table, settings, kanban, inbox, calendar, checkout, states
  preview/(labs)/…              atlas, motion, analyzer
  api/systems/…                 list/create · get/save/delete · versions · version

lib/storage.ts                  disk storage for systems + snapshots
design-systems/<id>/            saved systems (created on first save)
scripts/                        engine check, screenshots, e2e, contact sheets, server wrapper
```

## Data flow

1. The **registry** declares each property once: id, label, group, control, default, constraints,
   CSS mapping (property, composite slot, transport var, custom emitter, pseudo target),
   applicability, whether it animates, and whether it inherits.
2. A **DesignSystem** is data: `tokens` (light), `dark` (overrides), `rules[]` (scope + props),
   `components` (user-defined variants/sizes) and `meta`.
3. **compile()** merges recipe rules with system rules, sorts them by cascade score, and emits:
   - a static header: `@property` registrations, ambient and overlay keyframes, motion policy, base reset
   - `:root{…}` tokens, `:root.dark{…}` dark tokens, derived radius and space scales
   - one `:where(selector){…}` block per rule in priority order, with `@media` for breakpoint rules
     and `:root.dark` prefixes for mode rules
   - a motion manifest (selectors that carry entrance, scroll or fx config)
4. The **runtime** injects the CSS, sets `data-n-motion` on `<html>`, dispatches `normy:apply`, and
   the motion runtime rescans.
5. **Components** render `data-n`, `data-n-variant`, `data-n-size`, `data-n-id` and state data
   attributes on the root, and `data-n-part="type.part"` on parts.

## Cascade

| dimension | weight |
|---|---|
| component | 1 |
| variant / size | 2 |
| part | 4 |
| instance | 8 |
| state | 16 |
| breakpoint | 32 |
| mode | 64 |

Sort key: score → source (recipe < system) → index. Later wins.
`explain(ordered, target, prop)` replays the same ordering for one target to report the winning
value and its source scope. The Studio shows that as "set here / ↳ inherited from X / default".

## State selectors

| state | selector |
|---|---|
| hover | `:hover`, `[data-n-force~=hover]` |
| focus | `:focus-visible`, `:has(:focus-visible)`, `[data-highlighted]`, `[data-n-force~=focus]` |
| active | `:active`, `[data-pressed]`, `[data-n-force~=active]` |
| disabled | `[data-disabled]`, `:disabled` |
| loading | `[data-loading]` |
| selected | `[data-selected]`, `[aria-selected=true]`, `[data-state=active\|checked\|on]` |
| error | `[data-invalid]`, `[aria-invalid=true]` |
| open | `[data-open]`, `[data-state=open]` |
| current | `[data-current]`, `[aria-current]` (not false) |
| dragging | `[data-dragging]` |

## Studio ⇄ canvas protocol

The Studio and canvases are same-origin. Studio → canvas messages: `system` (with optional transient
rules), `mode`, `inspect`, `force`, `highlight`, `replay`, `scan`. Canvas → Studio: `ready`
(path), `instances`, `picked`. Other tabs receive the active system through BroadcastChannel and
localStorage.
