/* ------------------------------------------------------------------ *
 * Normy engine — core types. Everything visual is data of these shapes.
 * ------------------------------------------------------------------ */

export type Mode = "light" | "dark";
export type Breakpoint = "sm" | "md" | "lg" | "xl" | "2xl";
export const BREAKPOINTS: Breakpoint[] = ["sm", "md", "lg", "xl", "2xl"];

export type StateName =
  | "hover"
  | "focus"
  | "active"
  | "disabled"
  | "loading"
  | "selected"
  | "error"
  | "open"
  | "current"
  | "dragging";
export const STATES: StateName[] = [
  "hover",
  "focus",
  "active",
  "disabled",
  "loading",
  "selected",
  "error",
  "open",
  "current",
  "dragging",
];

/** Where a rule applies. Every field is optional; an empty scope is Global. */
export interface Scope {
  component?: string;
  variant?: string;
  size?: string;
  part?: string;
  instance?: string;
  state?: StateName;
  bp?: Breakpoint;
  mode?: Mode;
}

/* ---------------- values ---------------- */

export interface ShadowLayer {
  x: number;
  y: number;
  blur: number;
  spread: number;
  /** Any CSS colour or token ref like {color.shadow}. */
  color: string;
  inset?: boolean;
}
export interface ShadowValue {
  kind: "shadow";
  layers: ShadowLayer[];
}

export interface GradientStop {
  color: string;
  /** 0–100 (%) */
  pos: number;
}
export interface MeshBlob {
  color: string;
  x: number;
  y: number;
  size: number;
}
export interface GradientValue {
  kind: "gradient";
  type: "linear" | "radial" | "conic" | "mesh";
  angle?: number;
  shape?: "circle" | "ellipse";
  /** e.g. "50% 50%" */
  at?: string;
  stops: GradientStop[];
  blobs?: MeshBlob[];
  repeating?: boolean;
}

export type EasingValue =
  | { kind: "easing"; type: "preset"; name: string }
  | { kind: "easing"; type: "bezier"; p: [number, number, number, number] }
  | { kind: "easing"; type: "spring"; stiffness: number; damping: number; mass: number };

export type ComplexValue = ShadowValue | GradientValue | EasingValue;
export type Value = string | number | boolean | ComplexValue | null;
export type Props = Record<string, Value>;

/* ---------------- rules & systems ---------------- */

export interface Rule {
  id: string;
  scope: Scope;
  props: Props;
  note?: string;
}

export interface ComponentConfig {
  /** Extra variant names defined by the user (in addition to the library ones). */
  variants?: string[];
  sizes?: string[];
}

export interface SystemMeta {
  id: string;
  name: string;
  description?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  basedOn?: string;
}

export interface DesignSystem {
  schema: 1;
  meta: SystemMeta;
  /** Token overrides (light / shared). Missing tokens use registry defaults. */
  tokens: Props;
  /** Dark-mode token overrides. */
  dark: Props;
  rules: Rule[];
  components: Record<string, ComponentConfig>;
  /** How agents must design with this system (exported into the Agent Kit). */
  guide?: Guide;
}

/* ---------------- guide (agent rules) ---------------- */

export interface GuideRule {
  id: string;
  kind: "do" | "dont";
  text: string;
}

export interface Guide {
  /** What the product should feel like, in the owner's words. */
  feel: string;
  /** Who it is for / what it is (one or two sentences). */
  product: string;
  /** Enabled rule pack ids (see engine/guide.ts). */
  packs: string[];
  /** Owner's own rules. */
  rules: GuideRule[];
  /** Lessons learned from reviews (markdown, one "## " entry each). */
  lessons: string;
  /** Text direction / script notes, e.g. "Persian, RTL". */
  language: string;
}

/* ---------------- registry ---------------- */

export type GroupId =
  | "color"
  | "typography"
  | "space"
  | "shape"
  | "elevation"
  | "motion-tokens"
  | "breakpoints"
  | "a11y"
  | "layout"
  | "spacing"
  | "text"
  | "background"
  | "border"
  | "radius"
  | "shadow"
  | "effects"
  | "transform"
  | "interaction"
  | "icon"
  | "svg"
  | "content"
  | "transition"
  | "enter"
  | "fx"
  | "scroll"
  | "ambient"
  | "behavior";

export type TokenGroup =
  | "color"
  | "font"
  | "text"
  | "weight"
  | "leading"
  | "tracking"
  | "space"
  | "size"
  | "radius"
  | "border"
  | "shadow"
  | "z"
  | "blur"
  | "opacity"
  | "duration"
  | "easing"
  | "focus"
  | "type"
  | "shape"
  | "motion"
  | "bp"
  | "target";

export type Control =
  | { type: "color" }
  | { type: "length"; min?: number; max?: number; step?: number; units?: string[]; tokens?: TokenGroup[] }
  | { type: "number"; min?: number; max?: number; step?: number; unit?: string }
  | { type: "time"; min?: number; max?: number; step?: number }
  | { type: "select"; options: Array<{ value: string; label: string }> }
  | { type: "toggle" }
  | { type: "text"; placeholder?: string }
  | { type: "shadow" }
  | { type: "gradient" }
  | { type: "easing" }
  | { type: "font" };

export interface Decl {
  prop: string;
  value: string;
}

export interface PropertyDef {
  id: string;
  label: string;
  group: GroupId;
  kind: "token" | "style" | "motion" | "behavior";
  control: Control;
  description?: string;
  /** Default for tokens (light). Style props default to "unset" (no declaration). */
  default?: Value;
  darkDefault?: Value;
  /** Token CSS var name (tokens) or transport var (motion/behaviour). */
  cssVar?: string;
  /** Plain CSS property/properties this maps to. */
  css?: string | string[];
  /** Slot in a composite property (filter, backdrop, translate, transform, bg). */
  slot?: { composite: CompositeId; name: string; wrap?: (css: string) => string };
  /** Custom emission. Receives the compiled CSS value and the raw value. */
  emit?: (css: string, raw: Value) => Decl[];
  /** Target a pseudo-element/class instead of the element itself. */
  pseudo?: "::before" | "::after" | "::placeholder" | "::selection" | ":hover";
  /** Transport var should inherit (icon size flows into nested icons, etc.). */
  inherits?: boolean;
  animatable: boolean;
  /** Restrict to certain component types. Omitted = every component/part. */
  appliesTo?: string[];
  /** Token groups a value may reference. */
  tokens?: TokenGroup[];
  keywords?: string[];
  tokenGroup?: TokenGroup;
}

export type CompositeId = "filter" | "backdrop" | "translate" | "transform" | "bg";

/* ---------------- components ---------------- */

export type Category =
  | "layout"
  | "typography"
  | "actions"
  | "forms"
  | "navigation"
  | "data"
  | "overlay"
  | "feedback"
  | "media"
  | "blocks";

export interface RecipeRule {
  scope: Omit<Scope, "component">;
  props: Props;
}

/** A part is a label, or { label, stateful } when the part carries its own state (tab trigger, day…). */
export type PartDef = string | { label: string; stateful?: boolean };

export interface ComponentDef {
  type: string;
  label: string;
  category: Category;
  description: string;
  parts: Record<string, PartDef>;
  variants: string[];
  sizes: string[];
  states: StateName[];
  defaultVariant?: string;
  defaultSize?: string;
  recipe: RecipeRule[];
}
