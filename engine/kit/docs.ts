import { spaceId, RADIUS_SCALE } from "../compile";
import { COMPONENTS } from "../components";
import { enabledPacks, guideOf, parseLessons, RULE_PACKS, slugOf } from "../guide";
import { SPACE_STEPS, TOKENS } from "../registry";
import type { ComponentDef, DesignSystem, PropertyDef, Value } from "../types";
import { valueToCss } from "../values";

/* ------------------------------------------------------------------ *
 * Agent Kit documents: SKILL.md, references, AGENTS.md block, review
 * log and the checker config, generated from one design system.
 * Pure (no fs): the Studio previews these; lib/kit.ts zips them.
 * ------------------------------------------------------------------ */

/** What the kit builder learned from the component sources (export names + props). */
export interface CatalogEntry {
  exportName: string;
  file: string;
  props: string[];
  /** Pieces that compose with it, e.g. CardHeader / CardBody for Card. */
  companions?: Array<{ name: string; props: string[] }>;
}
export type KitCatalog = Record<string, CatalogEntry>;

export const KIT_DIR = "normy";

export interface KitInfo {
  name: string;
  slug: string;
  skillName: string;
}

export function kitInfo(system: DesignSystem): KitInfo {
  const slug = slugOf(system.meta.id || system.meta.name);
  return { name: system.meta.name, slug, skillName: `${slug}-design` };
}

/* ---------------- token helpers ---------------- */

const light = (s: DesignSystem, d: PropertyDef): Value => (s.tokens[d.id] ?? d.default ?? null) as Value;
const dark = (s: DesignSystem, d: PropertyDef): Value | undefined => (s.dark[d.id] ?? d.darkDefault) as Value | undefined;
const css = (d: PropertyDef, v: Value | undefined) => (v === undefined ? null : valueToCss(d, v, false));
const tokenById = new Map(TOKENS.map((t) => [t.id, t]));
const tv = (s: DesignSystem, id: string) => {
  const d = tokenById.get(id);
  return d ? (css(d, light(s, d)) ?? "") : "";
};
const tvd = (s: DesignSystem, id: string) => {
  const d = tokenById.get(id);
  return d ? (css(d, dark(s, d)) ?? css(d, light(s, d)) ?? "") : "";
};

/** Where each colour role is meant to be used (plain language). */
const COLOR_USE: Record<string, string> = {
  bg: "page background",
  surface: "cards, panels, inputs",
  "surface-raised": "popovers, menus, floating panels",
  "surface-sunken": "wells, code blocks, table headers, inactive tracks",
  "surface-inverse": "inverted blocks (tooltips, dark bands)",
  overlay: "scrim behind dialogs and sheets",
  text: "all primary text",
  "text-muted": "secondary text, descriptions",
  "text-subtle": "hints, captions, placeholders, meta",
  "text-inverse": "text on surface-inverse",
  "text-on-accent": "text and icons on accent fills",
  border: "default dividers and card borders",
  "border-strong": "control borders (inputs, outline buttons)",
  "border-subtle": "very quiet separators",
  accent: "primary actions, selection, the brand moment; use sparingly",
  "accent-hover": "hover of accent fills",
  "accent-soft": "selected rows, soft badges, highlights",
  "accent-text": "accent-coloured text on normal surfaces",
  success: "success fills",
  warning: "warning fills",
  danger: "destructive actions and errors",
  info: "informational fills",
  focus: "keyboard focus rings",
  link: "inline links",
};

/* ---------------- identity summary ---------------- */

function fontName(stack: string) {
  const m = stack.match(/--font-([a-z0-9-]+)/);
  if (m) return m[1].replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return stack.split(",")[0].replace(/['"]/g, "").trim();
}

export function identityLines(s: DesignSystem): string[] {
  const g = guideOf(s);
  const lines: string[] = [];
  lines.push(`- **Accent (brand) colour:** \`${tv(s, "color.accent")}\` (dark mode \`${tvd(s, "color.accent")}\`) → \`var(--n-color-accent)\`. Use it for the primary action and the one thing that matters on a screen; everything else is neutral.`);
  lines.push(`- **Canvas / text:** \`${tv(s, "color.bg")}\` / \`${tv(s, "color.text")}\` in light, \`${tvd(s, "color.bg")}\` / \`${tvd(s, "color.text")}\` in dark. Dark mode is the \`.dark\` class on \`<html>\`; tokens switch by themselves, never write separate dark colours.`);
  lines.push(`- **Type:** headings in ${fontName(tv(s, "font.display"))} (weight ${tv(s, "weight.heading")}), body in ${fontName(tv(s, "font.body"))}, code in ${fontName(tv(s, "font.mono"))}. Base size ${tv(s, "text.base")}, reading measure ${tv(s, "type.measure")}.`);
  lines.push(`- **Shape:** base radius ${tv(s, "radius.base")} (controls ${tv(s, "radius.control")}, cards ${tv(s, "radius.card")}), corner style ${tv(s, "shape.corner") || "round"}, borders ${tv(s, "border.thin")} ${tv(s, "border.style")}.`);
  lines.push(`- **Space:** base unit ${tv(s, "space.unit")} × density ${tv(s, "space.density")}; container ${tv(s, "size.container")}, gutter ${tv(s, "size.gutter")}, section padding ${tv(s, "size.section")}.`);
  lines.push(`- **Depth:** elevation tokens \`--n-shadow-0\` … \`--n-shadow-5\`; cards use the system's choice, do not add your own shadows.`);
  lines.push(`- **Motion:** durations ${["instant", "fast", "base", "slow", "slower"].map((k) => `${k} ${tv(s, `duration.${k}`)}`).join(", ")}; standard easing \`${tv(s, "easing.standard")}\`, enter \`${tv(s, "easing.enter")}\`. Motion is ${tv(s, "motion.enabled") === "false" ? "switched off in this system" : "on"}; reduced motion: ${tv(s, "motion.reduce") || "follows the OS"}.`);
  if (g.language) lines.push(`- **Language & direction:** ${g.language}. Use logical properties (\`margin-inline\`, \`padding-inline-start\`) so layouts flip correctly.`);
  return lines;
}

/* ---------------- SKILL.md ---------------- */

export function skillMd(s: DesignSystem, catalog: KitCatalog = {}): string {
  const g = guideOf(s);
  const { name, skillName } = kitInfo(s);
  const packs = enabledPacks(g);
  const does = g.rules.filter((r) => r.kind === "do" && r.text.trim());
  const donts = g.rules.filter((r) => r.kind === "dont" && r.text.trim());
  const lessons = parseLessons(g.lessons);
  const componentNames = COMPONENTS.map((c) => catalog[c.type]?.exportName).filter(Boolean) as string[];
  const desc = `${name} design system for this project. Use it for ANY UI work: building, changing or reviewing a page, screen, section, component, layout, form, table, menu, dialog, colour, font, spacing or animation, fixing how something looks, or making anything "look better". It holds the only components, tokens and rules this project allows, the checks to run before calling UI work done, and the owner's review log.`;

  const out: string[] = [];
  out.push(`---\nname: ${skillName}\ndescription: ${desc}\n---\n`);
  out.push(`# ${name} — design system\n`);
  if (g.product.trim()) out.push(`**What this product is:** ${g.product.trim()}\n`);
  if (g.feel.trim()) out.push(`**How it must feel (owner's words):** ${g.feel.trim()}\n`);
  out.push(
    `This project's look is defined in **Normy Studio** and exported here. The design is already decided: your job is to build screens that use it exactly, the same way on every page. Generated on ${new Date().toISOString().slice(0, 10)} from system \`${s.meta.id}\`.\n`,
  );

  out.push(`## The contract (read first, every time)\n`);
  out.push(
    [
      `1. **Only kit components and tokens.** Import UI from \`@/${KIT_DIR}\` (see \`references/components.md\`). Style with \`var(--n-…)\` tokens and component props (\`references/tokens.md\`). No raw colours, fonts, pixel sizes, shadows or easings in app code.`,
      `2. **Never edit \`${KIT_DIR}/\`** except \`${KIT_DIR}/review-log.md\`. The look changes in Normy Studio, not in code.`,
      `3. **Prove it.** Before saying UI work is done, \`node ${KIT_DIR}/scripts/check.mjs\` reports no errors and \`node ${KIT_DIR}/scripts/audit.mjs <urls>\` passes; you have looked at its screenshots.`,
      `4. **Learn.** When the owner rejects or corrects a design decision, first add the lesson to \`${KIT_DIR}/review-log.md\` (format inside), then fix it. Read the review log before every UI task: each entry is a rule.`,
      `5. **Report gaps, do not improvise.** If the kit cannot express something, compose it from kit parts or build one small token-only component, and list it under "Kit gaps" in your report.`,
    ].join("\n") + "\n",
  );

  out.push(`## Workflow\n`);
  out.push(
    [
      `0. Read \`${KIT_DIR}/review-log.md\` and the rules below. Open one finished page of the same kind and note the structure you will reuse.`,
      `1. Plan in a few lines: the page kind (showcase, content or app), the sections, and which kit components each section uses. For card rows, write the cards per row at 375 / 1024 / 1440.`,
      `2. Build with kit components and token props only. Prefer layout components (Container, Stack, Grid, Section) over custom CSS.`,
      `3. Run \`node ${KIT_DIR}/scripts/check.mjs\` and fix every error (warnings: fix or explain).`,
      `4. Start the app and run \`node ${KIT_DIR}/scripts/audit.mjs http://localhost:<port>/<page> …\` for every page you touched. Fix every failure.`,
      `5. Open the screenshots in \`normy-audit/\` at full size and review each section (see "Prove it" below). Verdict per section: ship or fix.`,
      `6. Report: what changed, the check and audit results, the section verdicts, kit gaps, and what you did not verify.`,
    ].join("\n") + "\n",
  );

  out.push(`## Identity (from the system)\n`);
  out.push(identityLines(s).join("\n") + "\n");
  out.push(`**Compose components the way the recipes at the top of \`references/components.md\` show** (cards use CardHeader / CardBody / CardFooter, a split Hero needs media, inputs carry their own label). Most layout mistakes come from guessing a composition.\n`);
  if (componentNames.length) out.push(`Kit components (${componentNames.length}): ${componentNames.map((n) => `\`${n}\``).join(", ")}. Props, variants and sizes: \`references/components.md\`.\n`);

  if (does.length || donts.length) {
    out.push(`## Owner's rules (highest priority after the task itself)\n`);
    for (const r of does) out.push(`- **Do:** ${r.text.trim()}`);
    for (const r of donts) out.push(`- **Never:** ${r.text.trim()}`);
    out.push("");
  }

  out.push(`## Rules\n`);
  for (const p of packs) {
    out.push(`### ${p.title}\n`);
    out.push(p.rules.map((r) => `- ${r}`).join("\n") + "\n");
  }

  if (lessons.length) {
    out.push(`## Lessons from reviews (${lessons.length})\n`);
    out.push(`Each one is a mistake the owner already rejected. Full entries are in \`${KIT_DIR}/review-log.md\`.\n`);
    out.push(lessons.map((l) => `- **${l.title}** ${firstLine(l.body)}`).join("\n") + "\n");
  }

  out.push(`## Priority when guidance conflicts\n`);
  out.push(
    [
      `1. The owner's explicit request in the current task.`,
      `2. The review log and the owner's rules.`,
      `3. The rules above.`,
      `4. What the kit components already do (their defaults are deliberate).`,
      `5. General design advice. Where it disagrees with this system, this system wins.`,
    ].join("\n") + "\n",
  );

  out.push(`## Never ship\n`);
  out.push(
    [
      `- Raw colour, font, size, shadow or easing values in app code, or Tailwind palette classes.`,
      `- A hand-rolled button, input, select, dialog, tabs, table or card when the kit has one.`,
      `- Edits inside \`${KIT_DIR}/\` (other than the review log).`,
      `- Two different looks for the same job on two pages.`,
      `- Text that is cut off, under 12px, or below WCAG AA contrast.`,
      `- Layout shift while idle or scrolling; media that pops in without a placeholder.`,
      `- \`transition: all\`, animating layout properties, entrances that blink.`,
      `- Anything the review log lists as rejected.`,
      `- A claim of "done" or "verified" without a passing check, a passing audit and screenshots you looked at.`,
    ].join("\n") + "\n",
  );

  out.push(`## References\n`);
  out.push(
    [
      `| Read | When |`,
      `|---|---|`,
      `| \`${KIT_DIR}/review-log.md\` | **Always**, before any UI work |`,
      `| \`${KIT_DIR}/references/components.md\` | Choosing and using components: imports, props, variants, sizes, parts |`,
      `| \`${KIT_DIR}/references/tokens.md\` | Any styling: every token with its light and dark value and its use |`,
      `| \`${KIT_DIR}/references/setup.md\` | Wiring the kit into the app (CSS, provider, fonts, dark mode) |`,
      `| \`${KIT_DIR}/references/motion.md\` | Anything that moves |`,
    ].join("\n") + "\n",
  );
  return out.join("\n");
}

const firstLine = (s: string) => {
  const l = s.split("\n").find((x) => x.trim()) ?? "";
  return l.replace(/^[-*]\s*/, "").slice(0, 220);
};

/* ---------------- references ---------------- */

export function tokensMd(s: DesignSystem): string {
  const out: string[] = [`# Tokens — ${s.meta.name}\n`, `Use tokens as CSS variables: \`color: var(--n-color-text)\`. Light values apply by default; dark values apply under \`html.dark\`. Never copy the raw values into code.\n`];
  const groups = new Map<string, PropertyDef[]>();
  for (const d of TOKENS) {
    if (!d.cssVar) continue;
    const k = d.id.split(".")[0];
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(d);
  }
  const titles: Record<string, string> = { color: "Colour roles", font: "Font families", text: "Type scale", weight: "Font weights", leading: "Line heights", tracking: "Letter spacing", type: "Type behaviour", space: "Space", size: "Sizes", radius: "Corner radius", shape: "Shape", border: "Borders", shadow: "Elevation (shadows)", z: "Layers (z-index)", blur: "Blur", opacity: "Opacity", duration: "Durations", easing: "Easings", motion: "Motion policy", bp: "Breakpoints" };
  for (const [k, defs] of groups) {
    out.push(`## ${titles[k] ?? k}\n`);
    const hasDark = defs.some((d) => d.darkDefault !== undefined || s.dark[d.id] !== undefined);
    out.push(hasDark ? `| Variable | Light | Dark | Use |\n|---|---|---|---|` : `| Variable | Value | Use |\n|---|---|---|`);
    for (const d of defs) {
      const l = css(d, light(s, d)) ?? "—";
      const use = (k === "color" ? COLOR_USE[d.id.slice(6)] : undefined) ?? d.description ?? d.label;
      const cell = (v: string) => `\`${v.replace(/\|/g, "\\|").slice(0, 90)}\``;
      out.push(hasDark ? `| \`${d.cssVar}\` | ${cell(l)} | ${cell(css(d, dark(s, d)) ?? l)} | ${use} |` : `| \`${d.cssVar}\` | ${cell(l)} | ${use} |`);
    }
    out.push("");
  }
  out.push(`## Space steps\n`);
  out.push(`Use \`var(--n-space-N)\` (or the \`gap\`, \`p\`, \`px\`, \`py\` props on layout components). Steps: ${SPACE_STEPS.map((n) => `\`--n-space-${spaceId(n)}\``).join(", ")}. Each step is \`N × unit × density\`.\n`);
  out.push(`## Radius scale\n`);
  out.push(RADIUS_SCALE.map(([k]) => `\`--n-radius-${k}\``).join(", ") + ` (all derived from \`--n-radius-base\`).\n`);
  return out.join("\n");
}

const CATEGORY_TITLE: Record<string, string> = {
  layout: "Layout",
  typography: "Typography",
  actions: "Actions",
  forms: "Forms",
  navigation: "Navigation",
  display: "Display",
  feedback: "Feedback",
  overlay: "Overlays",
  data: "Data",
  media: "Media",
  blocks: "Blocks",
};

/** Verified compositions. Agents get these wrong most often when they only see a prop list. */
export const RECIPES = `## Recipes (copy these shapes)

**Page section.** Every section is \`Section > Container > Stack\`; spacing comes from \`gap\` steps, never margins.
\`\`\`tsx
<Section>
  <Container>
    <Stack gap={8}>
      <Heading>Everything a small salon needs</Heading>
      <Grid cols={{ base: 1, md: 3 }} gap={6}>…</Grid>
    </Stack>
  </Container>
</Section>
\`\`\`

**Card.** Content goes in the card's own parts; they carry the padding. Never put text straight into \`<Card>\`.
\`\`\`tsx
<Card>
  <CardHeader title="Ready when you are" description="Set up takes ten minutes." />
  <CardBody>…</CardBody>
  <CardFooter><Button>Create your salon</Button></CardFooter>
</Card>
\`\`\`

**Hero.** \`variant="split"\` needs \`media\`; without a visual use \`variant="centered"\` (a split hero without media leaves half the screen empty).
\`\`\`tsx
<Hero variant="centered" eyebrow="…" title="…" lead="…" actions={<Stack direction="row" gap={3}><Button>Start free</Button><Button variant="outline">See a demo</Button></Stack>} />
\`\`\`

**Form field.** Inputs carry their own label, hint and error; never add a separate \`<label>\`.
\`\`\`tsx
<Input label="Email" type="email" hint="We never share it." error={errors.email} required />
\`\`\`

**Dialog.**
\`\`\`tsx
<Dialog>
  <DialogTrigger asChild><Button>Invite</Button></DialogTrigger>
  <DialogContent title="Invite a teammate" description="They get an email with a link." footer={<Button>Send invite</Button>}>…</DialogContent>
</Dialog>
\`\`\`

**Table.**
\`\`\`tsx
<Table label="Bookings">
  <THead><Tr><Th>Client</Th><Th>Time</Th></Tr></THead>
  <TBody><Tr><Td>Sara</Td><Td>10:30</Td></Tr></TBody>
</Table>
\`\`\`

**App screen title.** \`<PageHeader title="Bookings" description="…" actions={<Button>New booking</Button>} />\` at the top of every app screen.

**Buttons.** One \`solid\` (default) primary action per view; secondary actions \`outline\` or \`ghost\`; destructive \`danger\`. Icons with \`icon\` / \`iconEnd\` props.
`;

export function componentsMd(s: DesignSystem, catalog: KitCatalog = {}): string {
  const out: string[] = [
    `# Components — ${s.meta.name}\n`,
    `Import everything from the kit: \`import { Button, Card, Stack } from "@/${KIT_DIR}";\` (adjust the alias if the project has no \`@/\`). Every component is styled by the system; pass \`variant\` and \`size\`, never \`className\` colours or inline styles.\n`,
    `Shared props on every component: \`variant\`, \`size\`, and \`nid\` (an instance id the Studio can target).\n`,
    RECIPES,
  ];
  const byCat = new Map<string, ComponentDef[]>();
  for (const c of COMPONENTS) {
    if (!byCat.has(c.category)) byCat.set(c.category, []);
    byCat.get(c.category)!.push(c);
  }
  for (const [cat, defs] of byCat) {
    out.push(`## ${CATEGORY_TITLE[cat] ?? cat}\n`);
    for (const c of defs) {
      const e = catalog[c.type];
      out.push(`### ${e ? `\`<${e.exportName}>\`` : c.label}${e ? ` — ${c.label}` : ""}\n`);
      out.push(`${c.description}\n`);
      const meta: string[] = [];
      if (c.variants.length > 1 || (c.variants[0] && c.variants[0] !== "default")) meta.push(`- Variants: ${c.variants.map((v) => `\`${v}\``).join(", ")}${c.defaultVariant ? ` (default \`${c.defaultVariant}\`)` : ""}`);
      if (c.sizes.length) meta.push(`- Sizes: ${c.sizes.map((v) => `\`${v}\``).join(", ")}${c.defaultSize ? ` (default \`${c.defaultSize}\`)` : ""}`);
      if (c.states.length) meta.push(`- States it styles: ${c.states.join(", ")}`);
      const parts = Object.entries(c.parts).filter(([k]) => k !== "root");
      if (parts.length) meta.push(`- Parts: ${parts.map(([k, v]) => `\`${k}\` (${typeof v === "string" ? v : (v as { label?: string }).label ?? k})`).join(", ")}`);
      if (e?.props.length) meta.push(`- Props:\n${e.props.map((p) => `  - \`${p}\``).join("\n")}`);
      if (e?.companions?.length) meta.push(`- Compose with: ${e.companions.map((x) => `\`<${x.name}>\`${x.props.length ? ` (${x.props.map((p) => p.split(" — ")[0]).join("; ")})` : ""}`).join(", ")}`);
      if (e) meta.push(`- Source: \`${KIT_DIR}/components/${e.file}\``);
      out.push(meta.join("\n") + "\n");
    }
  }
  return out.join("\n");
}

export function setupMd(s: DesignSystem): string {
  return `# Setup — ${s.meta.name}

The kit is plain React + CSS. It needs \`react\`, \`react-dom\` and the Radix primitives listed in \`${KIT_DIR}/README.md\`. \`next/link\` is used through \`${KIT_DIR}/link.tsx\`; in a non-Next app change that one file to export a plain \`<a>\`.

## 1. Styles and fonts (root layout or entry file, once)

\`\`\`ts
import "@/${KIT_DIR}/styles/base.css";   // resets
import "@/${KIT_DIR}/styles/normy.css";  // the system: tokens + every component
\`\`\`

Fonts: in a **Next.js** app use \`import { normyFonts } from "@/${KIT_DIR}/fonts";\` and put \`className={normyFonts}\` on \`<html>\` (self-hosted, no layout shift). In any other app import \`@/${KIT_DIR}/styles/fonts.css\` instead.

## 2. Boot script and provider (Next.js App Router)

\`\`\`tsx
import { normyFonts } from "@/${KIT_DIR}/fonts";
import { NORMY_BOOT } from "@/${KIT_DIR}/boot";
import { NormyProvider } from "@/${KIT_DIR}/provider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={normyFonts} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: NORMY_BOOT }} />
      </head>
      <body>
        <NormyProvider>{children}</NormyProvider>
      </body>
    </html>
  );
}
\`\`\`

\`NORMY_BOOT\` applies the saved light/dark choice before paint and holds animated content for its entrance (it never hides content for long). \`NormyProvider\` starts the motion runtime and the tooltip provider.

## 3. Dark mode

\`setMode("light" | "dark" | "system")\` from \`@/${KIT_DIR}/boot\`. It toggles \`.dark\` on \`<html>\` and remembers the choice. Never write separate dark colours: every token switches by itself.

## 4. Updating the look

Open the system in Normy Studio, change it, export the Agent Kit again and replace the \`${KIT_DIR}/\` folder. Keep your \`${KIT_DIR}/review-log.md\`: import it into the Studio's Guide panel first so its lessons are carried into the new export.
`;
}

export function motionMd(s: DesignSystem): string {
  const animated = Array.from(new Set(s.rules.filter((r) => r.props && ("enter" in r.props || "fx" in r.props || "scrollEffect" in r.props)).map((r) => r.scope.component).filter(Boolean)));
  return `# Motion — ${s.meta.name}

Motion is part of the system. The motion runtime (started by \`NormyProvider\`) reads the compiled CSS and plays entrances, hover effects and scroll effects on kit components. You get the system's motion by using kit components; do not add another animation library for the same jobs.

## Tokens

| Token | Value |
|---|---|
${["instant", "fast", "base", "slow", "slower"].map((k) => `| \`--n-duration-${k}\` | \`${tv(s, `duration.${k}`)}\` |`).join("\n")}
${["standard", "enter", "exit", "emphasized", "linear", "spring"].map((k) => `| \`--n-easing-${k}\` | \`${tv(s, `easing.${k}`)}\` |`).join("\n")}

${animated.length ? `Components with system motion (entrance, effects or scroll): ${animated.map((c) => `\`${c}\``).join(", ")}.` : "This system defines no extra entrance effects beyond the component defaults."}

## When you need custom motion

- Use the duration and easing tokens: \`transition: opacity var(--n-duration-base) var(--n-easing-standard), transform var(--n-duration-base) var(--n-easing-standard);\`
- Name the properties. Animate \`transform\` and \`opacity\` (and \`clip-path\` for reveals) only.
- Under \`@media (prefers-reduced-motion: reduce)\` remove movement and keep short opacity changes.
- Gate hover motion with \`@media (hover: hover) and (pointer: fine)\`.
- Loops run only while on screen (IntersectionObserver) and stop when the tab is hidden.
- Never re-hide content that is already visible, and never animate the whole page at load.
`;
}

export const REVIEW_LOG_HEADER = `# Review log

Every entry is a design decision the owner rejected or corrected. Read this file before any UI work and treat each entry as a rule for the whole app.

**Agents: when the owner corrects a design decision, add an entry here before fixing it.** One \`## \` heading per lesson, in this format:

\`\`\`md
## <short name of the mistake> (<page>, <YYYY-MM-DD>)
- Shipped: what was built.
- Why it was rejected: the owner's reason, in their words if possible.
- Rule: what to do instead, everywhere in the app.
- Check: how to verify it on a rendered page.
\`\`\`

Then import this file into Normy Studio (Guide → Lessons → Import review log) so future projects inherit the lesson.

---
`;

export function reviewLogMd(s: DesignSystem): string {
  const g = guideOf(s);
  return REVIEW_LOG_HEADER + "\n" + (g.lessons.trim() ? g.lessons.trim() + "\n" : "_No lessons yet._\n");
}

export const AGENTS_START = "<!-- normy:start -->";
export const AGENTS_END = "<!-- normy:end -->";

export function agentsBlock(s: DesignSystem): string {
  const { name } = kitInfo(s);
  return `${AGENTS_START}
## UI design system: ${name} (Normy)

All UI in this project uses the **${name}** design system in \`${KIT_DIR}/\`. Before any UI work (pages, components, layout, styling, motion), read \`${KIT_DIR}/SKILL.md\` and \`${KIT_DIR}/review-log.md\`, and follow them exactly.

- Use only kit components (\`@/${KIT_DIR}\`) and tokens (\`var(--n-…)\`). No raw colours, fonts, pixel sizes or one-off styles.
- Before saying UI work is done: \`node ${KIT_DIR}/scripts/check.mjs\` has no errors, \`node ${KIT_DIR}/scripts/audit.mjs <page urls>\` passes, and you have looked at the screenshots it writes.
- When the owner corrects a design decision, add the lesson to \`${KIT_DIR}/review-log.md\` first, then fix it.
- Never edit files in \`${KIT_DIR}/\` except \`review-log.md\`; the look changes in Normy Studio.
${AGENTS_END}`;
}

/** Thin skill stub for agent skill folders (.claude/skills, .agents/skills) pointing at the kit. */
export function skillStub(s: DesignSystem): string {
  const full = skillMd(s);
  const fm = full.slice(0, full.indexOf("\n---\n") + 5);
  return `${fm}
# ${s.meta.name} design system

The full skill lives in the project at \`${KIT_DIR}/SKILL.md\`. Read it now, then \`${KIT_DIR}/review-log.md\`, and follow both exactly for this task.
`;
}

/** Checker settings: which rules are on, and which raw tags map to which kit component. */
export function checkConfig(s: DesignSystem, catalog: KitCatalog = {}) {
  const g = guideOf(s);
  const checks = new Set(enabledPacks(g).flatMap((p) => p.checks));
  const all = Array.from(new Set(RULE_PACKS.flatMap((p) => p.checks)));
  const has = (t: string) => catalog[t]?.exportName;
  const tags: Record<string, string> = {};
  const map: Array<[string, string]> = [
    ["button", "button"],
    ["input", "input"],
    ["select", "select"],
    ["textarea", "textarea"],
    ["dialog", "dialog"],
    ["table", "table"],
    ["progress", "progress"],
    ["hr", "divider"],
  ];
  for (const [tag, type] of map) if (has(type)) tags[tag] = has(type)!;
  return {
    $comment: "Generated by Normy. Edit the guide in Normy Studio instead of this file.",
    system: s.meta.id,
    kitDir: KIT_DIR,
    rules: Object.fromEntries(all.map((id) => [id, checks.has(id) ? (WARN_ONLY.has(id) ? "warn" : "error") : "off"])),
    tags,
    include: ["app", "src", "components", "pages", "lib", "features", "ui"],
    exclude: ["node_modules", ".next", "dist", "build", "out", ".git", KIT_DIR, "normy-audit", "coverage", "public"],
  };
}

const WARN_ONLY = new Set(["raw-size", "inline-style", "kit-component", "important", "layout-animation", "emoji-icon", "accent-bar"]);

export function kitReadme(s: DesignSystem): string {
  return `# ${s.meta.name} — Normy Agent Kit

Generated by Normy from the system \`${s.meta.id}\`. This folder is the single source of truth for how this project looks.

| Path | What |
|---|---|
| \`SKILL.md\` | The design skill: contract, workflow, identity, rules, lessons |
| \`review-log.md\` | Lessons from the owner's reviews. The only file here agents may edit |
| \`references/\` | Components, tokens, setup, motion |
| \`index.ts\`, \`components/\` | The React components |
| \`styles/\`, \`fonts.ts\` | \`normy.css\` (system), \`base.css\`, fonts (\`fonts.ts\` for Next.js, \`fonts.css\` otherwise) |
| \`provider.tsx\`, \`boot.ts\`, \`runtime/\` | Motion runtime, dark mode, boot script |
| \`scripts/check.mjs\` | Static check of app code against the system (no dependencies) |
| \`scripts/audit.mjs\` | Rendered check of pages + screenshots (needs \`playwright\`) |
| \`normy.config.json\` | Checker settings derived from the guide |
| \`system.json\` | The design system itself; import it into Normy Studio to change the look |

## Install

1. Copy this folder to the project root as \`${KIT_DIR}/\` (next to \`package.json\`).
2. Add the block in \`AGENTS.snippet.md\` to the project's \`AGENTS.md\` and \`CLAUDE.md\` (create them if needed). Copy \`skills/\` into \`.claude/skills/\` and \`.agents/skills/\` so agents pick the skill up by themselves.
   The Normy CLI does both steps for you: \`pnpm kit <system> <project-dir>\` from the Normy repo.
3. Dependencies: \`pnpm add @radix-ui/react-accordion @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-popover @radix-ui/react-select @radix-ui/react-tabs @radix-ui/react-tooltip\` and, for the audit, \`pnpm add -D playwright\`.
4. Wire it in as described in \`references/setup.md\`.

## Daily use

Tell your agent what to build. It reads \`AGENTS.md\`, follows \`${KIT_DIR}/SKILL.md\`, runs the checks and records your corrections in \`review-log.md\`.
`;
}
