import { setToken } from "@/engine/system";
import type { DesignSystem, ShadowValue, Value } from "@/engine/types";

/* ------------------------------------------------------------------ *
 * The "Style" panel's model. Each quick choice is a named preset that
 * expands into ordinary token values (light + dark). Nothing here is a
 * new engine concept: a preset is just a batch of setToken() calls, so
 * everything stays editable, exportable and undoable.
 * ------------------------------------------------------------------ */

export interface TokenPatch {
  light: Record<string, Value | undefined>;
  dark: Record<string, Value | undefined>;
}

export interface Choice {
  id: string;
  label: string;
  hint?: string;
  patch: TokenPatch;
}

const P = (light: TokenPatch["light"], dark: TokenPatch["dark"] = {}): TokenPatch => ({ light, dark });

/** Apply a patch (undefined = remove the override) as one system change. */
export function applyPatch(system: DesignSystem, patch: TokenPatch): DesignSystem {
  let s = system;
  for (const [k, v] of Object.entries(patch.light)) s = setToken(s, k, v, "light");
  for (const [k, v] of Object.entries(patch.dark)) s = setToken(s, k, v, "dark");
  return s;
}

const same = (a: Value | undefined, b: Value | undefined) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

/** Which choice of a group matches the system right now ("custom" if none). */
export function activeChoice(system: DesignSystem, choices: Choice[]): string {
  for (const c of choices) {
    const okL = Object.entries(c.patch.light).every(([k, v]) => same(system.tokens[k], v));
    const okD = Object.entries(c.patch.dark).every(([k, v]) => same(system.dark[k], v));
    if (okL && okD) return c.id;
  }
  return "custom";
}

/* ---------------- colour maths (sRGB hex ⇄ OKLCH) ---------------- */

export interface Lch {
  l: number;
  c: number;
  h: number;
}

const lin = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);

export function hexToOklch(hex: string): Lch | null {
  const m = hex.trim().match(/^#?([0-9a-f]{6})$/i);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  const r = lin(((n >> 16) & 255) / 255);
  const g = lin(((n >> 8) & 255) / 255);
  const b = lin((n & 255) / 255);
  const l_ = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m_ = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s_ = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const A = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const B = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;
  const c = Math.sqrt(A * A + B * B);
  let h = (Math.atan2(B, A) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { l: L, c, h };
}

const r3 = (n: number) => Math.round(n * 1000) / 1000;
const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));
export const oklch = ({ l, c, h }: Lch, alpha?: number) => `oklch(${r3(l)} ${r3(c)} ${Math.round(h)}${alpha !== undefined ? ` / ${alpha}` : ""})`;

/** Every accent role, derived from one brand colour. */
export function brandPatch(base: Lch): TokenPatch {
  const mono = base.c < 0.02;
  const L = base.l;
  const light: Lch = { ...base };
  const hover: Lch = { ...base, l: clamp(L - 0.06, 0.08, 0.95) };
  const text: Lch = { ...base, l: Math.min(L, 0.52) };
  // Dark mode: lift light-ish so the accent still reads on near-black.
  const dl: Lch = mono ? { l: 0.96, c: 0, h: 0 } : { ...base, l: clamp(L + 0.05, 0.6, 0.82), c: base.c * 0.93 };
  const dHover: Lch = { ...dl, l: clamp(dl.l + 0.06, 0, 0.98) };
  const dText: Lch = mono ? { l: 0.96, c: 0, h: 0 } : { ...base, l: Math.max(0.74, dl.l), c: base.c * 0.7 };
  const onLight = L > 0.72 ? "oklch(0.16 0.004 265)" : "oklch(1 0 0)";
  const onDark = dl.l > 0.72 ? "oklch(0.16 0.004 265)" : "oklch(1 0 0)";
  return P(
    {
      "color.accent": oklch(light),
      "color.accent-hover": oklch(hover),
      "color.accent-soft": oklch(mono ? { l: 0.16, c: 0, h: 0 } : light, mono ? 0.07 : 0.1),
      "color.accent-text": oklch(text),
      "color.text-on-accent": onLight,
      "color.focus": oklch(light),
      "color.selection": oklch(light, 0.22),
      "color.link": oklch(text),
      "color.chart-1": oklch(light),
    },
    {
      "color.accent": oklch(dl),
      "color.accent-hover": oklch(dHover),
      "color.accent-soft": oklch(dl, mono ? 0.1 : 0.18),
      "color.accent-text": oklch(dText),
      "color.text-on-accent": onDark,
      "color.focus": oklch(dHover),
      "color.selection": oklch(dl, 0.36),
      "color.link": oklch(dText),
      "color.chart-1": oklch(dl),
    },
  );
}

export interface BrandPreset {
  id: string;
  label: string;
  lch: Lch;
}

export const BRAND_PRESETS: BrandPreset[] = [
  { id: "blue", label: "Blue", lch: { l: 0.55, c: 0.215, h: 264 } },
  { id: "indigo", label: "Indigo", lch: { l: 0.51, c: 0.23, h: 277 } },
  { id: "violet", label: "Violet", lch: { l: 0.54, c: 0.25, h: 293 } },
  { id: "pink", label: "Pink", lch: { l: 0.6, c: 0.22, h: 355 } },
  { id: "red", label: "Red", lch: { l: 0.57, c: 0.22, h: 25 } },
  { id: "orange", label: "Orange", lch: { l: 0.65, c: 0.19, h: 45 } },
  { id: "amber", label: "Amber", lch: { l: 0.78, c: 0.16, h: 75 } },
  { id: "green", label: "Green", lch: { l: 0.58, c: 0.16, h: 150 } },
  { id: "teal", label: "Teal", lch: { l: 0.58, c: 0.11, h: 190 } },
  { id: "black", label: "Black", lch: { l: 0.16, c: 0, h: 265 } },
];

/** The Normy blue is the registry default, so "Blue" means "no overrides". */
export const BRAND_CHOICES: Choice[] = BRAND_PRESETS.map((b) => {
  const patch = brandPatch(b.lch);
  if (b.id === "blue") {
    for (const k of Object.keys(patch.light)) patch.light[k] = undefined;
    for (const k of Object.keys(patch.dark)) patch.dark[k] = undefined;
  }
  return { id: b.id, label: b.label, patch };
});

export const brandSwatch = (b: BrandPreset) => oklch(b.lch);

/* ---------------- neutrals ---------------- */

const NEUTRAL_KEYS = ["bg", "surface", "surface-raised", "surface-sunken", "surface-inverse", "overlay", "text", "text-muted", "text-subtle", "text-inverse", "border", "border-strong", "border-subtle", "shadow", "chart-2", "chart-6"] as const;

function neutralPatch(h: number, c: number, warmBg = false): TokenPatch {
  const n = (l: number, cm = 1, a?: number) => oklch({ l, c: c * cm, h }, a);
  const lightL: Record<(typeof NEUTRAL_KEYS)[number], string> = {
    bg: n(warmBg ? 0.975 : 0.99, 0.8),
    surface: n(warmBg ? 0.985 : 1, 0.5),
    "surface-raised": n(warmBg ? 0.993 : 1, 0.3),
    "surface-sunken": n(0.962, 1),
    "surface-inverse": n(0.16, 1),
    overlay: n(0.16, 1, 0.45),
    text: n(0.16, 1.2),
    "text-muted": n(0.43, 1.6),
    "text-subtle": n(0.56, 1.4),
    "text-inverse": n(0.98, 0.3),
    border: n(0.905, 1),
    "border-strong": n(0.62, 1.4),
    "border-subtle": n(0.94, 0.8),
    shadow: n(0.18, 3),
    "chart-2": n(0.2, 1),
    "chart-6": n(0.7, 1.5),
  };
  const darkL: Record<(typeof NEUTRAL_KEYS)[number], string> = {
    bg: n(0.145, 1),
    surface: n(0.175, 1),
    "surface-raised": n(0.21, 1),
    "surface-sunken": n(0.12, 1),
    "surface-inverse": n(0.97, 0.3),
    overlay: n(0.05, 0.5, 0.66),
    text: n(0.97, 0.3),
    "text-muted": n(0.75, 1),
    "text-subtle": n(0.6, 1),
    "text-inverse": n(0.16, 1),
    border: n(0.28, 1),
    "border-strong": n(0.52, 1),
    "border-subtle": n(0.23, 1),
    shadow: n(0, 0),
    "chart-2": n(0.92, 0.3),
    "chart-6": n(0.5, 1.5),
  };
  const light: TokenPatch["light"] = {};
  const dark: TokenPatch["dark"] = {};
  for (const k of NEUTRAL_KEYS) {
    light[`color.${k}`] = lightL[k];
    dark[`color.${k}`] = darkL[k];
  }
  return { light, dark };
}

const unsetNeutrals = (): TokenPatch => {
  const p: TokenPatch = { light: {}, dark: {} };
  for (const k of NEUTRAL_KEYS) {
    p.light[`color.${k}`] = undefined;
    p.dark[`color.${k}`] = undefined;
  }
  return p;
};

export const NEUTRAL_CHOICES: Array<Choice & { swatch: [string, string, string] }> = [
  { id: "cool", label: "Cool", hint: "Default", patch: unsetNeutrals(), swatch: ["oklch(0.99 0 0)", "oklch(0.91 0.003 265)", "oklch(0.16 0.004 265)"] },
  { id: "pure", label: "Pure", hint: "True greys", patch: neutralPatch(0, 0), swatch: ["oklch(0.99 0 0)", "oklch(0.905 0 0)", "oklch(0.16 0 0)"] },
  { id: "slate", label: "Slate", hint: "Blue-grey", patch: neutralPatch(255, 0.014), swatch: ["oklch(0.99 0.011 255)", "oklch(0.905 0.014 255)", "oklch(0.16 0.017 255)"] },
  { id: "warm", label: "Warm", hint: "Stone", patch: neutralPatch(70, 0.008, true), swatch: ["oklch(0.975 0.006 70)", "oklch(0.905 0.008 70)", "oklch(0.16 0.01 70)"] },
  { id: "sand", label: "Sand", hint: "Paper", patch: neutralPatch(85, 0.018, true), swatch: ["oklch(0.975 0.014 85)", "oklch(0.905 0.018 85)", "oklch(0.16 0.022 85)"] },
];

/* ---------------- shape ---------------- */

const shape = (base: string | undefined, pill = false): TokenPatch =>
  P({
    "radius.base": base,
    "radius.control": pill ? "999px" : undefined,
    "radius.input": pill ? "999px" : undefined,
    "radius.badge": pill ? "999px" : undefined,
  });

export const CORNER_CHOICES: Array<Choice & { r: string }> = [
  { id: "sharp", label: "Sharp", patch: shape("0px"), r: "0px" },
  { id: "subtle", label: "Subtle", patch: shape("4px"), r: "4px" },
  { id: "rounded", label: "Round", patch: shape(undefined), r: "8px" },
  { id: "soft", label: "Soft", patch: shape("14px"), r: "14px" },
  { id: "pill", label: "Pill", patch: shape("16px", true), r: "999px" },
];

/* ---------------- density ---------------- */

export const DENSITY_CHOICES: Choice[] = [
  { id: "compact", label: "Compact", hint: "Data-dense", patch: P({ "space.density": 0.85 }) },
  { id: "default", label: "Balanced", hint: "Default", patch: P({ "space.density": undefined }) },
  { id: "comfy", label: "Comfortable", hint: "Roomier", patch: P({ "space.density": 1.12 }) },
  { id: "spacious", label: "Spacious", hint: "Airy", patch: P({ "space.density": 1.25 }) },
];

/* ---------------- typography ---------------- */

const F = {
  geist: "var(--font-geist), ui-sans-serif, sans-serif",
  grotesk: "var(--font-space-grotesk), ui-sans-serif, sans-serif",
  dmSans: "var(--font-dm-sans), ui-sans-serif, sans-serif",
  manrope: "var(--font-manrope), ui-sans-serif, sans-serif",
  fredoka: "var(--font-fredoka), ui-rounded, sans-serif",
  nunito: "var(--font-nunito), ui-rounded, sans-serif",
  fraunces: "var(--font-fraunces), ui-serif, Georgia, serif",
  newsreader: "var(--font-newsreader), ui-serif, Georgia, serif",
  cormorant: "var(--font-cormorant), ui-serif, Georgia, serif",
  jost: "var(--font-jost), ui-sans-serif, sans-serif",
  archivo: "var(--font-archivo), ui-sans-serif, sans-serif",
  plex: "var(--font-plex-sans), ui-sans-serif, sans-serif",
  jetbrains: "var(--font-jetbrains), ui-monospace, monospace",
};

const type = (display: string | undefined, body: string | undefined, stretch?: number): TokenPatch => P({ "font.display": display, "font.body": body, "type.heading-stretch": stretch });

export const TYPE_CHOICES: Array<Choice & { display: string; body: string }> = [
  { id: "modern", label: "Modern", hint: "Geist", patch: type(undefined, undefined), display: F.geist, body: F.geist },
  { id: "grotesk", label: "Grotesk", hint: "Space Grotesk", patch: type(F.grotesk, F.dmSans), display: F.grotesk, body: F.dmSans },
  { id: "clean", label: "Clean", hint: "Manrope", patch: type(F.manrope, F.manrope), display: F.manrope, body: F.manrope },
  { id: "friendly", label: "Friendly", hint: "Fredoka", patch: type(F.fredoka, F.nunito), display: F.fredoka, body: F.nunito },
  { id: "editorial", label: "Editorial", hint: "Fraunces", patch: type(F.fraunces, F.newsreader), display: F.fraunces, body: F.newsreader },
  { id: "elegant", label: "Elegant", hint: "Cormorant", patch: type(F.cormorant, F.jost), display: F.cormorant, body: F.jost },
  { id: "wide", label: "Wide", hint: "Archivo", patch: type(F.archivo, F.plex, 112), display: F.archivo, body: F.plex },
  { id: "technical", label: "Technical", hint: "JetBrains Mono", patch: type(F.jetbrains, F.plex), display: F.jetbrains, body: F.plex },
];

export const TEXT_SIZE_CHOICES: Choice[] = [
  { id: "sm", label: "Small", patch: P({ "text.sm": "0.8125rem", "text.base": "0.9375rem", "text.lg": "1.0625rem" }) },
  { id: "md", label: "Medium", patch: P({ "text.sm": undefined, "text.base": undefined, "text.lg": undefined }) },
  { id: "lg", label: "Large", patch: P({ "text.sm": "0.9375rem", "text.base": "1.0625rem", "text.lg": "1.3125rem" }) },
];

export const HEADING_CHOICES: Choice[] = [
  { id: "light", label: "Light", patch: P({ "weight.heading": 400, "type.heading-case": undefined }) },
  { id: "medium", label: "Medium", patch: P({ "weight.heading": 560, "type.heading-case": undefined }) },
  { id: "bold", label: "Bold", patch: P({ "weight.heading": undefined, "type.heading-case": undefined }) },
  { id: "black", label: "Heavy", patch: P({ "weight.heading": 850, "type.heading-case": undefined }) },
  { id: "caps", label: "CAPS", patch: P({ "weight.heading": 750, "type.heading-case": "uppercase" }) },
];

/* ---------------- depth ---------------- */

const sh = (layers: ShadowValue["layers"]): ShadowValue => ({ kind: "shadow", layers });
const mix = (p: number) => `color-mix(in oklch, var(--n-color-shadow) ${p}%, transparent)`;
const depth = (s: Record<string, Value | undefined>): TokenPatch => P({ "shadow.1": s[1], "shadow.2": s[2], "shadow.3": s[3], "shadow.4": s[4], "shadow.5": s[5] });

export const DEPTH_CHOICES: Array<Choice & { preview: string }> = [
  { id: "flat", label: "Flat", hint: "Lines only", patch: depth({ 1: "none", 2: "none", 3: "none", 4: "none", 5: "none" }), preview: "none" },
  { id: "soft", label: "Soft", hint: "Default", patch: depth({}), preview: `0 1px 2px ${mix(6)}, 0 8px 20px -10px ${mix(22)}` },
  {
    id: "lifted",
    label: "Lifted",
    hint: "Floating cards",
    patch: depth({
      1: sh([{ x: 0, y: 1, blur: 3, spread: 0, color: mix(10) }]),
      2: sh([{ x: 0, y: 2, blur: 4, spread: 0, color: mix(8) }, { x: 0, y: 14, blur: 30, spread: -12, color: mix(34) }]),
      3: sh([{ x: 0, y: 4, blur: 8, spread: 0, color: mix(8) }, { x: 0, y: 24, blur: 48, spread: -16, color: mix(42) }]),
      4: sh([{ x: 0, y: 6, blur: 12, spread: 0, color: mix(8) }, { x: 0, y: 36, blur: 70, spread: -22, color: mix(50) }]),
      5: sh([{ x: 0, y: 8, blur: 16, spread: 0, color: mix(10) }, { x: 0, y: 50, blur: 100, spread: -28, color: mix(58) }]),
    }),
    preview: `0 2px 4px ${mix(8)}, 0 14px 30px -12px ${mix(34)}`,
  },
  {
    id: "hard",
    label: "Hard",
    hint: "Offset, brutal",
    patch: depth({
      1: sh([{ x: 2, y: 2, blur: 0, spread: 0, color: "var(--n-color-text)" }]),
      2: sh([{ x: 4, y: 4, blur: 0, spread: 0, color: "var(--n-color-text)" }]),
      3: sh([{ x: 6, y: 6, blur: 0, spread: 0, color: "var(--n-color-text)" }]),
      4: sh([{ x: 8, y: 8, blur: 0, spread: 0, color: "var(--n-color-text)" }]),
      5: sh([{ x: 10, y: 10, blur: 0, spread: 0, color: "var(--n-color-text)" }]),
    }),
    preview: "4px 4px 0 currentColor",
  },
];

export const BORDER_CHOICES: Choice[] = [
  { id: "fine", label: "Fine", hint: "1px", patch: P({ "border.thin": undefined, "border.hairline": undefined }) },
  { id: "bold", label: "Bold", hint: "2px", patch: P({ "border.thin": "2px", "border.hairline": "1.5px" }) },
];

/* ---------------- motion ---------------- */

export const MOTION_CHOICES: Choice[] = [
  { id: "off", label: "None", hint: "Instant", patch: P({ "motion.enabled": false, "motion.speed": undefined, "motion.page-effect": "none", "easing.standard": undefined }) },
  { id: "snappy", label: "Snappy", hint: "Quick & crisp", patch: P({ "motion.enabled": undefined, "motion.speed": 1.6, "motion.page-effect": "fade", "easing.standard": undefined }) },
  { id: "smooth", label: "Smooth", hint: "Default", patch: P({ "motion.enabled": undefined, "motion.speed": undefined, "motion.page-effect": undefined, "easing.standard": undefined }) },
  { id: "bouncy", label: "Bouncy", hint: "Springs", patch: P({ "motion.enabled": undefined, "motion.speed": undefined, "motion.page-effect": "rise", "easing.standard": { kind: "easing", type: "spring", stiffness: 320, damping: 16, mass: 1 } }) },
  { id: "cinematic", label: "Cinematic", hint: "Slow & soft", patch: P({ "motion.enabled": undefined, "motion.speed": 0.6, "motion.page-effect": "blur", "easing.standard": undefined }) },
];
