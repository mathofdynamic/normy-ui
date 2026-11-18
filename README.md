# Normy — design engine, studio and component library

Every visual and motion decision of every component is **data**: a registry of 411 properties,
resolved through an 8-level cascade into a single stylesheet. The **Studio** edits that data live on
real app pages and saves it as reusable design systems.

## Start

```bash
pnpm install
pnpm dev            # http://localhost:3000
```

| URL | What |
|---|---|
| `/` | Hub: starter systems (apply one everywhere), engine overview, links |
| `/studio` | The Studio (three panes, inspect, force state, compare, save/load/export) |
| `/preview/saas` … | 19 preview pages: landing (11) and dashboard (8) |
| `/preview/atlas` | Every component × variant × size × state |
| `/preview/motion` | Motion Lab |
| `/preview/analyzer` | Coverage, contrast, token usage, rule hygiene |

Keyboard: **Ctrl/⌘ K** opens the Studio command palette, **I** toggles inspect, **Ctrl Z / Ctrl ⇧ Z**
undo and redo, **Ctrl S** saves. On preview pages, **Ctrl J** opens the page and system navigator.

## Scripts

```bash
pnpm check          # typecheck + lint
pnpm engine:check   # compile every component with the default system, report size/time
pnpm e2e            # Studio end-to-end (starts and stops its own dev server on :3100)
pnpm screenshots    # full matrix: all pages × 390/768/1440 × light/dark → screenshots/final
pnpm build          # production build
```

## Where things are

- `engine/`: registry, cascade, compiler, values, exports, diff, contrast, runtime
- `components/normy/`: the library (65 components)
- `components/studio/`: the Studio
- `design-systems/`: saved systems (`<id>/system.json` + `versions/`)
- `docs/`: `ARCHITECTURE.md`, `PROPERTY-SPACE.md`, `DECISIONS.md`
- `PROGRESS.md`: milestone checklist and log

## Using a system outside this repo

Export from the Studio (Export tab): compiled CSS, Tailwind v4 theme, TypeScript tokens, W3C design
tokens, or the Normy JSON (re-importable).
