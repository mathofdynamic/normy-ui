import type { DesignSystem, Guide, GuideRule } from "./types";

/* ------------------------------------------------------------------ *
 * The guide: the rules an AI agent must follow when it designs with a
 * system. Rule packs are distilled from a real site's owner reviews
 * (every rule here exists because an agent once got it wrong).
 * The Studio edits the guide; the Agent Kit turns it into SKILL.md,
 * AGENTS.md and the settings of the checker.
 * ------------------------------------------------------------------ */

export interface RulePack {
  id: string;
  title: string;
  /** One line for the Studio. */
  summary: string;
  /** Imperative rules with numbers, for the agent. */
  rules: string[];
  /** Checker rule ids this pack turns on (see kit/scripts/check.mjs). */
  checks: string[];
  /** Always on; cannot be switched off. */
  core?: boolean;
}

export const RULE_PACKS: RulePack[] = [
  {
    id: "system",
    title: "Use the system, nothing else",
    summary: "Only kit components and tokens. No raw colours, fonts, sizes or one-off styles.",
    core: true,
    checks: ["raw-color", "palette-class", "foreign-font", "raw-size", "inline-style", "kit-component", "important"],
    rules: [
      "Build every screen from the kit components in `normy/components`. If the kit has it (button, input, card, dialog, tabs, table, badge, avatar, navigation…), use it; never hand-roll a look-alike.",
      "Every colour, font, size, radius, shadow, space, duration and easing comes from a token (`var(--n-…)`) or a component prop. No hex, rgb, hsl or oklch values, no Tailwind palette classes (`bg-blue-500`), no pixel values for spacing or type.",
      "Lay out pages with the layout components (Container, Stack, Grid, Box, Section…) and their token props. A page file should contain almost no CSS of its own.",
      "If something truly is missing from the kit, compose it from kit components first. If that is impossible, write one small local component that uses tokens only, give it a clear name, and list it under \"Kit gaps\" in your report so the owner can add it to the system.",
      "Never edit files inside `normy/` (they are generated) except `normy/review-log.md`. Changing the look means changing the system in Normy Studio and exporting again.",
      "Use variants and sizes that exist. Do not invent a new variant with local CSS; pick the closest existing one or report a kit gap.",
    ],
  },
  {
    id: "consistency",
    title: "Same thing, same look, every page",
    summary: "One pattern per job across the whole app, so every page feels like one product.",
    core: true,
    checks: [],
    rules: [
      "Before building a page, open one or two finished pages of the same kind and reuse their structure: header, page title block, section spacing, footer, empty and loading states.",
      "One job, one pattern: the same action uses the same component, variant, label style and position on every page (primary action: solid button; secondary: outline or ghost; destructive: danger). Never two styles of primary button in one app.",
      "Section rhythm comes from the space tokens only. Do not tune spacing per page by eye.",
      "Copy follows one voice and one casing style everywhere (titles, buttons, labels). Use real text, never lorem ipsum or invented numbers.",
      "Icons come from the kit's `Icon` set only, in one style and stroke. No emoji as icons, no mixed icon libraries.",
    ],
  },
  {
    id: "grid",
    title: "Grid and space",
    summary: "Everything snaps to the page column; no empty holes beside or inside blocks.",
    checks: [],
    rules: [
      "The page column is law: every section's content edges line up with the Container edges at 375, 768, 1024 and 1440px. Nothing bleeds out of the column unless the owner asked for it.",
      "Two columns fill the row together: a list beside a taller visual stretches to it (`align-items: stretch`, equal rows) or the visual gets shorter. No empty band above, below or beside a column.",
      "Cards with text and a demo or image are at least 280px wide, at most four per row. Five or more items become two rows (2 + 3) or a list beside one shared visual, never five thin columns.",
      "In a row of cards, titles, text and media start at the same height in every card, and nothing inside a card is a hole.",
      "Use the space: no block floating in the middle of a wide empty area, no leftover `justify-content: center` shrinking a grid.",
    ],
  },
  {
    id: "text",
    title: "Readable text",
    summary: "Never cut text off, never too small, comfortable line length.",
    checks: ["truncate"],
    rules: [
      "Descriptive text is never cut off: no ellipsis, no line-clamp on copy. Give it more lines and let the row grow equally.",
      "No text under 12px. Paragraphs read in comfortable lines (about 45 to 75 characters; never squeezed under 20).",
      "Use the type scale tokens and the Heading / Text components for every piece of text. Hierarchy comes from the scale, not from ad-hoc bold or colour.",
      "Text contrast meets WCAG AA (4.5:1 body, 3:1 large). Muted text is for secondary information only.",
    ],
  },
  {
    id: "motion",
    title: "Calm, meaningful motion",
    summary: "Elements reveal as they scroll in, hover shows what a thing is, nothing blinks.",
    checks: ["transition-all", "layout-animation"],
    rules: [
      "Motion comes from the system: kit components already carry their entrance, hover and press motion. Do not add your own animation library or keyframes for things the system animates.",
      "Each element reveals when it scrolls into view, not the whole page at load. Content already on screen at load animates in once and is never hidden again (no visible → hidden → animated blink).",
      "Animate `transform` and `opacity` only (clip-path for reveals). Never animate `top`, `left`, `margin`, `width` or `height`. Never `transition: all`. Never `scale(0)`; start from about 0.95.",
      "Durations and easings come from the motion tokens. UI feedback stays under 300ms; content reveals are slow enough to be seen (400–700ms).",
      "A hover reacts with something related to what the element is (an icon that does its action), not only a lift and a shadow. Hover motion only on fine pointers; never hide information behind hover.",
      "Every loop runs only while it is on screen, is seamless, cheap, and stops under reduced motion. `prefers-reduced-motion` always gives a calm version, never a broken one.",
    ],
  },
  {
    id: "stable",
    title: "Nothing jumps",
    summary: "No layout shift, media fades in from a skeleton, every state is designed.",
    checks: [],
    rules: [
      "Nothing moves the page by itself: reserve the real height of images, lazy sections, async content and auto-playing demos. Total layout shift while idle or scrolling stays at or below 0.01.",
      "Media never pops: images and videos show a skeleton in their exact shape while loading and fade in when decoded; failures show a quiet fallback.",
      "Every list, table and data view has designed empty, loading and error states using kit components (Skeleton, EmptyState, Alert…).",
    ],
  },
  {
    id: "craft",
    title: "Craft details",
    summary: "Pill for the active nav item, glass done right, no decorative accent lines.",
    checks: ["accent-bar", "emoji-icon"],
    rules: [
      "The active navigation item is a pill (surface fill + hairline border) around the label, never an underline, never two indicators.",
      "Menus, popovers and headers that float over content use the system's glass or raised surface: blur plus low opacity, never blur alone, never fully transparent.",
      "No decorative accent bars or gradient lines on card edges, titles or active items. State is shown with surface, border, text colour and motion.",
      "Interactive elements have visible hover, press and keyboard focus states (the kit provides them; do not remove focus rings).",
    ],
  },
  {
    id: "page-kinds",
    title: "Page kinds",
    summary: "Marketing pages can show off; docs, blog, help and legal pages use the standard layout for their kind.",
    checks: [],
    rules: [
      "Classify every page before building it and write the class at the top of your plan: **showcase** (sells or explains: home, features, pricing, product pages), **content** (people read or look something up: docs, help, blog, posts, about, contact, legal, changelog) or **app** (people work in it: dashboards, settings, editors, lists, forms).",
      "Showcase pages get rich motion, a clear hero and their own section shapes; do not copy the previous page's skeleton.",
      "Content pages use the proven layout for their kind (docs: sidebar + content + outline; blog index: featured post + grid; post or article: readable column, outline on wide screens; legal: table of contents + numbered sections). Motion is quiet. Pages of the same kind look the same.",
      "App screens put density and speed first: no decorative entrances on data people work with, numbers do not move for style, frequent actions are never animated.",
    ],
  },
  {
    id: "proof",
    title: "Prove it before saying done",
    summary: "Run the checks, look at real screenshots, review each section, fix or report.",
    core: true,
    checks: [],
    rules: [
      "Before you report UI work as done: `node normy/scripts/check.mjs` has no errors, and `node normy/scripts/audit.mjs <urls of the pages you touched>` passes with the app running.",
      "Open the screenshots the audit writes (375 and 1440px, light and dark) and look at every section at full size. Never judge a page from a scaled-down full-page capture or from reading code.",
      "For each section answer: on the grid? any holes or dead space? text readable and not cut off? consistent with the other pages? Verdict per section is **ship** or **fix**; \"close enough\" is not a verdict.",
      "If you can, have a reviewer that did not build the page (another agent or the owner) look at the same screenshots and name the three weakest things. Fix them or list them as known issues.",
      "Say exactly what you verified in a browser and what you did not.",
    ],
  },
];

export const CORE_PACKS = RULE_PACKS.filter((p) => p.core).map((p) => p.id);

export const DEFAULT_GUIDE: Guide = {
  feel: "",
  product: "",
  packs: RULE_PACKS.map((p) => p.id),
  rules: [],
  lessons: "",
  language: "",
};

export function guideOf(system: DesignSystem): Guide {
  const g = system.guide;
  if (!g) return { ...DEFAULT_GUIDE, packs: [...DEFAULT_GUIDE.packs] };
  return {
    feel: g.feel ?? "",
    product: g.product ?? "",
    packs: Array.from(new Set([...(Array.isArray(g.packs) ? g.packs : DEFAULT_GUIDE.packs), ...CORE_PACKS])),
    rules: Array.isArray(g.rules) ? g.rules.filter((r): r is GuideRule => !!r && typeof r.text === "string") : [],
    lessons: g.lessons ?? "",
    language: g.language ?? "",
  };
}

export function withGuide(system: DesignSystem, patch: Partial<Guide>): DesignSystem {
  return { ...system, guide: { ...guideOf(system), ...patch }, meta: { ...system.meta, updatedAt: new Date().toISOString() } };
}

export const enabledPacks = (g: Guide) => RULE_PACKS.filter((p) => p.core || g.packs.includes(p.id));

/** Short, readable slug for skill names and file names. */
export const slugOf = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "design";

/* ---------------- lessons (review log) ---------------- */

export interface Lesson {
  title: string;
  body: string;
}

/** Split a review log into entries: each "## " heading starts one. */
export function parseLessons(md: string): Lesson[] {
  const out: Lesson[] = [];
  let cur: Lesson | null = null;
  for (const line of md.split(/\r?\n/)) {
    const m = line.match(/^##\s+(.+)/);
    if (m) {
      if (cur) out.push(cur);
      cur = { title: m[1].trim(), body: "" };
    } else if (cur) cur.body += line + "\n";
  }
  if (cur) out.push(cur);
  return out.map((l) => ({ ...l, body: l.body.trim() }));
}

/** Merge lessons from an imported review log into the guide (by title, new ones appended). */
export function mergeLessons(current: string, incoming: string): { text: string; added: number } {
  const have = parseLessons(current);
  const titles = new Set(have.map((l) => l.title.toLowerCase()));
  const fresh = parseLessons(incoming).filter((l) => !titles.has(l.title.toLowerCase()));
  const text = [...have, ...fresh].map((l) => `## ${l.title}\n${l.body}`).join("\n\n");
  return { text, added: fresh.length };
}
