import type { Control, GroupId, PropertyDef, TokenGroup, Value } from "../types";

/** Token id `color.accent` → CSS var `--n-color-accent`. */
export const tokenVar = (id: string) => `--n-${id.replace(/\./g, "-")}`;

type TokOpts = Partial<Pick<PropertyDef, "description" | "darkDefault" | "keywords">>;

function tok(
  id: string,
  label: string,
  group: GroupId,
  control: Control,
  def: Value,
  opts: TokOpts = {},
): PropertyDef {
  return {
    id,
    label,
    group,
    kind: "token",
    control,
    default: def,
    cssVar: tokenVar(id),
    animatable: false,
    tokenGroup: id.split(".")[0] as TokenGroup,
    ...opts,
  };
}

const color: Control = { type: "color" };
const len = (min = 0, max = 64, step = 1, units = ["px", "rem"]): Control => ({ type: "length", min, max, step, units });
const num = (min: number, max: number, step = 1, unit?: string): Control => ({ type: "number", min, max, step, unit });
const time: Control = { type: "time", min: 0, max: 2000, step: 10 };
const easing: Control = { type: "easing" };
const sel = (...options: string[]): Control => ({
  type: "select",
  options: options.map((o) => ({ value: o, label: o })),
});

/* ---------------- color roles (light / dark pairs) ---------------- */

const C = (id: string, label: string, light: string, dark: string, description?: string) =>
  tok(`color.${id}`, label, "color", color, light, { darkDefault: dark, description });

export const COLOR_TOKENS: PropertyDef[] = [
  C("bg", "Canvas", "oklch(0.99 0 0)", "oklch(0.145 0.004 265)", "Page background"),
  C("surface", "Surface", "oklch(1 0 0)", "oklch(0.175 0.004 265)"),
  C("surface-raised", "Surface raised", "oklch(1 0 0)", "oklch(0.21 0.004 265)"),
  C("surface-sunken", "Surface sunken", "oklch(0.967 0.002 265)", "oklch(0.12 0.004 265)"),
  C("surface-inverse", "Surface inverse", "oklch(0.16 0.004 265)", "oklch(0.97 0 0)"),
  C("overlay", "Overlay scrim", "oklch(0.16 0.004 265 / 0.45)", "oklch(0.05 0 0 / 0.66)"),
  C("text", "Text", "oklch(0.16 0.004 265)", "oklch(0.97 0 0)"),
  C("text-muted", "Text muted", "oklch(0.43 0.008 265)", "oklch(0.75 0.006 265)"),
  C("text-subtle", "Text subtle", "oklch(0.56 0.008 265)", "oklch(0.6 0.006 265)"),
  C("text-inverse", "Text inverse", "oklch(0.98 0 0)", "oklch(0.16 0.004 265)"),
  C("text-on-accent", "Text on accent", "oklch(1 0 0)", "oklch(1 0 0)"),
  C("border", "Border", "oklch(0.91 0.003 265)", "oklch(0.28 0.004 265)"),
  C("border-strong", "Border strong", "oklch(0.62 0.008 265)", "oklch(0.52 0.006 265)", "Control borders; keep >= 3:1 against canvas (WCAG 1.4.11)"),
  C("border-subtle", "Border subtle", "oklch(0.945 0.002 265)", "oklch(0.23 0.004 265)"),
  C("accent", "Accent", "oklch(0.55 0.215 264)", "oklch(0.6 0.2 264)"),
  C("accent-hover", "Accent hover", "oklch(0.49 0.21 264)", "oklch(0.66 0.19 264)"),
  C("accent-soft", "Accent soft", "oklch(0.55 0.215 264 / 0.1)", "oklch(0.6 0.2 264 / 0.18)"),
  C("accent-text", "Accent as text", "oklch(0.5 0.21 264)", "oklch(0.75 0.14 264)"),
  C("success", "Success", "oklch(0.56 0.14 155)", "oklch(0.72 0.15 155)"),
  C("success-soft", "Success soft", "oklch(0.56 0.14 155 / 0.11)", "oklch(0.72 0.15 155 / 0.16)"),
  C("success-text", "Success text", "oklch(0.46 0.12 155)", "oklch(0.8 0.13 155)"),
  C("warning", "Warning", "oklch(0.74 0.15 75)", "oklch(0.8 0.14 80)"),
  C("warning-soft", "Warning soft", "oklch(0.74 0.15 75 / 0.16)", "oklch(0.8 0.14 80 / 0.16)"),
  C("warning-text", "Warning text", "oklch(0.5 0.12 65)", "oklch(0.85 0.12 85)"),
  C("danger", "Danger", "oklch(0.56 0.21 25)", "oklch(0.68 0.19 25)"),
  C("danger-soft", "Danger soft", "oklch(0.56 0.21 25 / 0.1)", "oklch(0.68 0.19 25 / 0.16)"),
  C("danger-text", "Danger text", "oklch(0.5 0.2 25)", "oklch(0.78 0.14 25)"),
  C("info", "Info", "oklch(0.58 0.13 230)", "oklch(0.72 0.12 230)"),
  C("info-soft", "Info soft", "oklch(0.58 0.13 230 / 0.1)", "oklch(0.72 0.12 230 / 0.16)"),
  C("info-text", "Info text", "oklch(0.47 0.13 230)", "oklch(0.8 0.1 230)"),
  C("focus", "Focus ring", "oklch(0.55 0.215 264)", "oklch(0.66 0.19 264)"),
  C("selection", "Selection", "oklch(0.55 0.215 264 / 0.22)", "oklch(0.6 0.2 264 / 0.36)"),
  C("link", "Link", "oklch(0.5 0.21 264)", "oklch(0.75 0.14 264)"),
  C("shadow", "Shadow base", "oklch(0.18 0.02 265)", "oklch(0 0 0)"),
  C("chart-1", "Chart 1", "oklch(0.55 0.215 264)", "oklch(0.64 0.19 264)"),
  C("chart-2", "Chart 2", "oklch(0.2 0.004 265)", "oklch(0.92 0 0)"),
  C("chart-3", "Chart 3", "oklch(0.7 0.12 225)", "oklch(0.75 0.11 225)"),
  C("chart-4", "Chart 4", "oklch(0.58 0.2 295)", "oklch(0.7 0.16 295)"),
  C("chart-5", "Chart 5", "oklch(0.72 0.14 170)", "oklch(0.76 0.13 170)"),
  C("chart-6", "Chart 6", "oklch(0.7 0.01 265)", "oklch(0.5 0.01 265)"),
];

/* ---------------- typography ---------------- */

export const TYPE_TOKENS: PropertyDef[] = [
  tok("font.display", "Display family", "typography", { type: "font" }, "var(--font-geist), ui-sans-serif, sans-serif"),
  tok("font.body", "Body family", "typography", { type: "font" }, "var(--font-geist), ui-sans-serif, sans-serif"),
  tok("font.mono", "Mono family", "typography", { type: "font" }, "var(--font-geist-mono), ui-monospace, monospace"),
  tok("font.heading", "Heading family", "typography", { type: "font" }, "var(--n-font-display)"),
  tok("text.xs", "Size xs", "typography", len(8, 24, 0.5), "0.75rem"),
  tok("text.sm", "Size sm", "typography", len(10, 28, 0.5), "0.875rem"),
  tok("text.base", "Size base", "typography", len(12, 28, 0.5), "1rem"),
  tok("text.lg", "Size lg", "typography", len(12, 32, 0.5), "1.1875rem"),
  tok("text.xl", "Size xl", "typography", len(14, 40, 0.5), "1.5rem"),
  tok("text.2xl", "Size 2xl", "typography", len(16, 64), "clamp(1.75rem, 1.4rem + 1.2vw, 2.25rem)"),
  tok("text.3xl", "Size 3xl", "typography", len(18, 96), "clamp(2.1rem, 1.5rem + 2.4vw, 3.25rem)"),
  tok("text.4xl", "Size 4xl", "typography", len(20, 120), "clamp(2.5rem, 1.6rem + 3.6vw, 4.5rem)"),
  tok("text.5xl", "Size 5xl", "typography", len(24, 160), "clamp(3rem, 1.6rem + 5.4vw, 6rem)"),
  tok("text.display", "Size display", "typography", len(24, 220), "clamp(3.25rem, 1.3rem + 7.6vw, 8.75rem)"),
  tok("weight.regular", "Weight regular", "typography", num(100, 900, 10), 400),
  tok("weight.medium", "Weight medium", "typography", num(100, 900, 10), 500),
  tok("weight.semibold", "Weight semibold", "typography", num(100, 900, 10), 600),
  tok("weight.bold", "Weight bold", "typography", num(100, 900, 10), 700),
  tok("weight.heading", "Weight heading", "typography", num(100, 900, 10), 700),
  tok("leading.tight", "Line height tight", "typography", num(0.7, 2, 0.01), 1.05),
  tok("leading.snug", "Line height snug", "typography", num(0.8, 2, 0.01), 1.3),
  tok("leading.normal", "Line height normal", "typography", num(1, 2.4, 0.01), 1.55),
  tok("leading.relaxed", "Line height relaxed", "typography", num(1, 2.6, 0.01), 1.75),
  tok("tracking.tighter", "Tracking tighter", "typography", len(-0.1, 0.3, 0.005, ["em"]), "-0.04em"),
  tok("tracking.tight", "Tracking tight", "typography", len(-0.1, 0.3, 0.005, ["em"]), "-0.02em"),
  tok("tracking.normal", "Tracking normal", "typography", len(-0.1, 0.3, 0.005, ["em"]), "0em"),
  tok("tracking.wide", "Tracking wide", "typography", len(-0.1, 0.3, 0.005, ["em"]), "0.04em"),
  tok("tracking.caps", "Tracking caps", "typography", len(-0.1, 0.4, 0.005, ["em"]), "0.08em"),
  tok("type.heading-case", "Heading case", "typography", sel("none", "uppercase", "lowercase", "capitalize"), "none"),
  tok("type.heading-stretch", "Heading width", "typography", num(62, 125, 1, "%"), 100),
  tok("type.heading-style", "Heading style", "typography", sel("normal", "italic"), "normal"),
  tok("type.label-case", "Label case", "typography", sel("none", "uppercase", "lowercase", "capitalize"), "uppercase"),
  tok("type.label-font", "Label family", "typography", { type: "font" }, "var(--n-font-mono)"),
  tok("type.measure", "Reading measure", "typography", len(30, 100, 1, ["ch"]), "68ch"),
];

/* ---------------- space & size ---------------- */

export const SPACE_STEPS = [0, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8, 10, 12, 14, 16, 20, 24, 32] as const;

export const SPACE_TOKENS: PropertyDef[] = [
  tok("space.unit", "Base unit", "space", len(2, 8, 0.5), "4px", {
    description: "All space-* steps are unit × n × density.",
  }),
  tok("space.density", "Density", "space", num(0.6, 1.6, 0.05), 1),
  tok("size.control-xs", "Control xs", "space", len(16, 40), "calc(1.5rem * var(--n-space-density))"),
  tok("size.control-sm", "Control sm", "space", len(20, 48), "calc(2rem * var(--n-space-density))"),
  tok("size.control-md", "Control md", "space", len(24, 64), "calc(2.5rem * var(--n-space-density))"),
  tok("size.control-lg", "Control lg", "space", len(28, 80), "calc(3rem * var(--n-space-density))"),
  tok("size.container", "Container width", "space", len(640, 1920, 10), "88rem"),
  tok("size.container-narrow", "Narrow container", "space", len(400, 1200, 10), "46rem"),
  tok("size.gutter", "Page gutter", "space", len(8, 64), "clamp(1.25rem, 3vw, 2rem)"),
  tok("size.section", "Section padding", "space", len(16, 240), "clamp(4rem, 8vw, 8rem)"),
  tok("size.sidebar", "Sidebar width", "space", len(160, 400), "16rem"),
];

/* ---------------- shape ---------------- */

export const SHAPE_TOKENS: PropertyDef[] = [
  tok("radius.base", "Base radius", "shape", len(0, 32, 0.5), "6px", {
    description: "xs…2xl are multiples of the base radius.",
  }),
  tok("radius.control", "Control radius", "shape", len(0, 40, 0.5), "var(--n-radius-md)"),
  tok("radius.card", "Card radius", "shape", len(0, 48, 0.5), "var(--n-radius-lg)"),
  tok("radius.overlay", "Overlay radius", "shape", len(0, 48, 0.5), "var(--n-radius-lg)"),
  tok("radius.badge", "Badge radius", "shape", len(0, 40, 0.5), "var(--n-radius-xs)"),
  tok("radius.input", "Input radius", "shape", len(0, 40, 0.5), "var(--n-radius-md)"),
  tok("shape.corner", "Corner shape", "shape", sel("round", "squircle", "bevel", "scoop", "notch"), "round"),
  tok("border.hairline", "Hairline", "shape", len(0, 4, 0.5), "1px"),
  tok("border.thin", "Border thin", "shape", len(0, 8, 0.5), "1px"),
  tok("border.thick", "Border thick", "shape", len(0, 12, 0.5), "2px"),
  tok("border.heavy", "Border heavy", "shape", len(0, 16, 0.5), "4px"),
  tok("border.style", "Border style", "shape", sel("solid", "dashed", "dotted", "double"), "solid"),
];

/* ---------------- elevation ---------------- */

const sh = (layers: Array<[number, number, number, number, number]>) => ({
  kind: "shadow" as const,
  layers: layers.map(([x, y, blur, spread, alpha]) => ({
    x,
    y,
    blur,
    spread,
    color: `color-mix(in oklch, var(--n-color-shadow) ${Math.round(alpha * 100)}%, transparent)`,
  })),
});

export const ELEVATION_TOKENS: PropertyDef[] = [
  tok("shadow.0", "Elevation 0", "elevation", { type: "shadow" }, "none"),
  tok("shadow.1", "Elevation 1", "elevation", { type: "shadow" }, sh([[0, 1, 0, 0, 0.06], [0, 1, 2, 0, 0.05]])),
  tok("shadow.2", "Elevation 2", "elevation", { type: "shadow" }, sh([[0, 1, 2, 0, 0.06], [0, 8, 20, -10, 0.22]])),
  tok("shadow.3", "Elevation 3", "elevation", { type: "shadow" }, sh([[0, 2, 4, 0, 0.06], [0, 16, 32, -14, 0.3]])),
  tok("shadow.4", "Elevation 4", "elevation", { type: "shadow" }, sh([[0, 2, 4, 0, 0.06], [0, 28, 56, -20, 0.42]])),
  tok("shadow.5", "Elevation 5", "elevation", { type: "shadow" }, sh([[0, 4, 8, 0, 0.08], [0, 40, 80, -24, 0.5]])),
  tok("shadow.inner", "Inner", "elevation", { type: "shadow" }, {
    kind: "shadow",
    layers: [{ x: 0, y: 1, blur: 2, spread: 0, color: "color-mix(in oklch, var(--n-color-shadow) 12%, transparent)", inset: true }],
  }),
  tok("shadow.press", "Pressable", "elevation", { type: "shadow" }, {
    kind: "shadow",
    layers: [
      { x: 0, y: -1, blur: 0, spread: 0, color: "color-mix(in oklch, var(--n-color-shadow) 28%, transparent)", inset: true },
      { x: 0, y: 1, blur: 0, spread: 0, color: "oklch(1 0 0 / 0.14)", inset: true },
    ],
  }),
  tok("shadow.glow", "Glow", "elevation", { type: "shadow" }, {
    kind: "shadow",
    layers: [{ x: 0, y: 0, blur: 24, spread: -4, color: "color-mix(in oklch, var(--n-color-accent) 55%, transparent)" }],
  }),
  tok("shadow.hard", "Hard offset", "elevation", { type: "shadow" }, {
    kind: "shadow",
    layers: [{ x: 4, y: 4, blur: 0, spread: 0, color: "var(--n-color-text)" }],
  }),
  tok("shadow.halo", "Focus halo", "elevation", { type: "shadow" }, {
    kind: "shadow",
    layers: [{ x: 0, y: 0, blur: 0, spread: 3, color: "var(--n-color-accent-soft)" }],
  }),
  tok("z.base", "Z base", "elevation", num(0, 9999), 0),
  tok("z.raised", "Z raised", "elevation", num(0, 9999), 10),
  tok("z.sticky", "Z sticky", "elevation", num(0, 9999), 40),
  tok("z.dropdown", "Z dropdown", "elevation", num(0, 9999), 50),
  tok("z.overlay", "Z overlay", "elevation", num(0, 9999), 60),
  tok("z.modal", "Z modal", "elevation", num(0, 9999), 70),
  tok("z.toast", "Z toast", "elevation", num(0, 9999), 80),
  tok("z.tooltip", "Z tooltip", "elevation", num(0, 9999), 90),
  tok("blur.sm", "Blur sm", "elevation", len(0, 40), "4px"),
  tok("blur.md", "Blur md", "elevation", len(0, 60), "12px"),
  tok("blur.lg", "Blur lg", "elevation", len(0, 80), "24px"),
  tok("blur.xl", "Blur xl", "elevation", len(0, 120), "48px"),
  tok("opacity.disabled", "Disabled opacity", "elevation", num(0, 1, 0.01), 0.45),
  tok("opacity.muted", "Muted opacity", "elevation", num(0, 1, 0.01), 0.7),
];

/* ---------------- motion ---------------- */

const ez = (p: [number, number, number, number]) => ({ kind: "easing" as const, type: "bezier" as const, p });

export const MOTION_TOKENS: PropertyDef[] = [
  tok("duration.instant", "Instant", "motion-tokens", time, 60),
  tok("duration.fast", "Fast", "motion-tokens", time, 120),
  tok("duration.base", "Base", "motion-tokens", time, 200),
  tok("duration.slow", "Slow", "motion-tokens", time, 420),
  tok("duration.slower", "Slower", "motion-tokens", time, 700),
  tok("easing.standard", "Standard", "motion-tokens", easing, ez([0.22, 1, 0.36, 1])),
  tok("easing.enter", "Enter", "motion-tokens", easing, ez([0.16, 1, 0.3, 1])),
  tok("easing.exit", "Exit", "motion-tokens", easing, ez([0.55, 0, 1, 0.45])),
  tok("easing.emphasized", "Emphasized", "motion-tokens", easing, ez([0.65, 0, 0.35, 1])),
  tok("easing.linear", "Linear", "motion-tokens", easing, ez([0, 0, 1, 1])),
  tok("easing.spring", "Spring", "motion-tokens", easing, {
    kind: "easing",
    type: "spring",
    stiffness: 380,
    damping: 26,
    mass: 1,
  }),
  tok("motion.speed", "Master speed", "motion-tokens", num(0.1, 4, 0.05, "×"), 1, {
    description: "Divides every duration. 2 = twice as fast.",
  }),
  tok("motion.reduce", "Reduced motion", "motion-tokens", sel("system", "always", "never"), "system", {
    description: "system follows the OS setting; always forces reduced motion; never ignores it.",
  }),
  tok("motion.enabled", "Motion enabled", "motion-tokens", { type: "toggle" }, true),
  tok("motion.page-effect", "Page transition", "motion-tokens", sel("none", "fade", "rise", "slide", "zoom", "blur"), "fade"),
  tok("motion.page-duration", "Page duration", "motion-tokens", time, 360),
  tok("motion.page-easing", "Page easing", "motion-tokens", easing, ez([0.22, 1, 0.36, 1])),
];

/* ---------------- breakpoints & a11y ---------------- */

export const BREAKPOINT_TOKENS: PropertyDef[] = [
  tok("bp.sm", "sm", "breakpoints", num(320, 960, 1, "px"), 640),
  tok("bp.md", "md", "breakpoints", num(480, 1200, 1, "px"), 768),
  tok("bp.lg", "lg", "breakpoints", num(768, 1600, 1, "px"), 1024),
  tok("bp.xl", "xl", "breakpoints", num(1024, 1920, 1, "px"), 1280),
  tok("bp.2xl", "2xl", "breakpoints", num(1200, 2560, 1, "px"), 1536),
];

export const A11Y_TOKENS: PropertyDef[] = [
  tok("focus.width", "Focus ring width", "a11y", len(0, 8, 0.5), "2px"),
  tok("focus.offset", "Focus ring offset", "a11y", len(-4, 8, 0.5), "2px"),
  tok("focus.style", "Focus ring style", "a11y", sel("solid", "dashed", "dotted", "double"), "solid"),
  tok("target.min", "Min target size", "a11y", len(0, 56), "24px", {
    description: "Minimum hit area for interactive controls (WCAG 2.5.8 recommends ≥ 24px).",
  }),
];

export const TOKENS: PropertyDef[] = [
  ...COLOR_TOKENS,
  ...TYPE_TOKENS,
  ...SPACE_TOKENS,
  ...SHAPE_TOKENS,
  ...ELEVATION_TOKENS,
  ...MOTION_TOKENS,
  ...BREAKPOINT_TOKENS,
  ...A11Y_TOKENS,
];

/** Tokens that are not CSS vars (consumed by the compiler / runtime directly). */
export const NON_VAR_TOKENS = new Set(["bp.sm", "bp.md", "bp.lg", "bp.xl", "bp.2xl", "motion.reduce", "motion.enabled"]);
