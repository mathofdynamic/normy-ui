# Normy — design it once, every agent builds it your way

AI coding agents (Claude Code, Codex, Cursor…) build UI that looks fine page by page but drifts:
different buttons, spacing and colours on every page, and rules you have to explain again each time.
Normy fixes that in two halves:

1. **A studio for the look.** Pick a style, click anything on a real page to refine it, and every page
   updates live.
2. **An Agent Kit for your agents.** One folder for your project: the real components and CSS, a design
   skill written from your system and your rules, and checks the agent must pass before it may call a
   page done. When you correct the agent, it records the lesson in the kit's review log; import that
   log back into the Studio and every future project inherits it.

![The Normy Studio](public/studio-hero.png)

## Start

```bash
pnpm install
pnpm dev            # http://localhost:3000  (use --port 3001 if 3000 is taken)
```

Open **`/studio`**. The first visit asks you to pick a starting look.

## How you work in the Studio

| Step | Where | What you do |
|---|---|---|
| 1. Style | **Style** panel | Big choices, one click each: starter look, brand colour (or any colour), neutrals, corners, spacing, fonts, depth, motion. *Fine-tune* opens the exact tokens. |
| 2. Edit | **Edit** panel, or **Select** in the canvas dock (shortcut **I**) | Click an element. Choose *Every button / Only one style / Just this one*, pick a state tab (Hover, Pressed…), and change its essentials. *Show all properties* has everything else. |
| 3. Components | **Pages / Components** switch in the top bar, or the **Components** rail item | *Card view*: every component as a card. Open one for its *canvas view*: every variant, size and frozen state, its motion (entrance, pointer, scroll; replay it), and its parts. The Edit panel opens on that component, so you can perfect each one on its own, then switch back to real pages. |
| 4. Motion | **Pages / Components / Motion** switch, or the **Motion** rail item | All movement in one place, with a live page for each kind. **Entrance**: scenarios (Calm, Snappy, Cinematic, One by one…), which blocks animate, effect tiles that preview themselves, duration, easing, and the *sequence*: all at once, overlap (next starts after N% of the previous), one by one or a fixed gap, plus order, what shares a sequence, longest sequence and trigger. **Open & close**: how every pop-up opens and how much faster it closes, backdrop fade, menu rows cascading in. **Interactive**: hover (lift, grow, glow, tilt, magnetic, spotlight…), press shrink, ripple and timing per kind of element, with every state side by side. **Loops**: 17 seamless loop components, one speed for all loops, pause on hover, play off screen, and ambient loops for any element. |
| 5. Check | Top bar | Switch page, device (Phone/Tablet/Desktop/Fit) and light/dark (the Studio and the page switch together). Compare shows before/after. |
| 6. Guide | **Guide** panel | What the product is and how it should feel, rule packs (grid, readable text, motion, stable layout, craft, page kinds, proof), your own do/never rules, and the lessons log. |
| 7. Save & export | **Save**, **Library**, **Export** | Versions on disk (`design-systems/<id>/`), restore, compare, import. **Export → Agent Kit** (recommended) or raw CSS, Tailwind v4, TypeScript, W3C tokens, JSON. |

For experts, **Edit → Advanced** is the full cascade inspector: every scope (component, variant,
size, part, instance, state, breakpoint, mode), all 279 properties and where each value comes from.

**Comfort.** Drag the panel edge to resize it (double-click resets). The rail has **Aa** for interface
size (Small/Medium/Large) and **Hide** to give the canvas the whole width.

**Keyboard.** **Ctrl/⌘ K** commands · **I** select mode · **Esc** interact · **Ctrl Z / Ctrl ⇧ Z**
undo/redo · **Ctrl S** save. On preview pages, **Ctrl J** switches page and system.

## The Agent Kit

Download it from **Export**, or install it straight into a project from this repo:

```bash
pnpm kit <saved-system-id | starter-id | system.json> <path/to/project>
```

That writes `<project>/normy/` (keeping an existing `review-log.md`), adds an instruction block to
`AGENTS.md` and `CLAUDE.md`, and installs the skill into `.claude/skills/` and `.agents/skills/`.

| In the kit | What it does |
|---|---|
| `SKILL.md` | The contract, workflow, identity, rules, lessons. Generated from the system + Guide |
| `references/` | Component catalogue with props and verified recipes, every token, setup, motion |
| `components/`, `styles/`, `fonts.ts`, `provider.tsx` | The real React components, the compiled system CSS, fonts, motion runtime |
| `scripts/check.mjs` | Static check, no dependencies: raw colours, Tailwind palette classes, foreign fonts, `transition: all`, truncated text, hand-rolled controls… |
| `scripts/audit.mjs` | Rendered check (Playwright) at 375/1440 × light/dark: off-system colours, contrast, clipped text, overflow, layout shift; writes screenshots to look at |
| `review-log.md` | Where agents record your corrections; import it back in **Guide → Lessons** |

## Other pages

| URL | What |
|---|---|
| `/` | Product home: starter looks you can try in place |
| `/preview/saas` … | 19 real product pages (11 marketing, 8 app screens) |
| `/preview/components` | Components: card view; `/preview/components/<name>` is one component in full |
| `/preview/atlas` | Every component × variant × size × state on one long page |
| `/preview/motion` | Motion Lab |
| `/preview/analyzer` | Contrast, coverage, token usage, rule hygiene |

## Scripts

```bash
pnpm check          # typecheck + lint
pnpm e2e            # Studio end-to-end (own dev server on :3100)
URL=http://localhost:3001 node scripts/motion-check.mjs   # Motion section, overlays, loops, theme
pnpm kit <system> <project>   # install / update an Agent Kit in a project
pnpm screenshots    # all pages × 390/768/1440 × light/dark → screenshots/final
pnpm build          # production build
```

## Under the hood

Every visual and motion decision is data: a registry of 428 properties (149 tokens + 279 component
properties), resolved through an 8-level cascade into one stylesheet. See `docs/ARCHITECTURE.md`,
`docs/PROPERTY-SPACE.md` and `docs/DECISIONS.md`; progress is in `PROGRESS.md`.

- `engine/`: registry, cascade, compiler, exports, diff, contrast, runtime
- `components/normy/`: the library (81 components, 16 of them loops)
- `components/studio/`: the Studio
- `design-systems/`: your saved systems (git-ignored)
