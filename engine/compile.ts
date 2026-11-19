import { orderRules, type OrderedRule } from "./cascade";
import { ALL_DEFS, getDef, NON_VAR_TOKENS, PROPERTIES, SPACE_STEPS, TOKENS } from "./registry";
import type { ComponentDef, CompositeId, Decl, DesignSystem, PropertyDef, Rule, Scope, StateName, Value } from "./types";
import { valueToCss } from "./values";

/* ------------------------------------------------------------------ *
 * DesignSystem + component recipes  →  one CSS string.
 * Every rule selector is wrapped in :where() so specificity is zero
 * and emission order IS the cascade.
 * ------------------------------------------------------------------ */

export const STATE_SELECTORS: Record<StateName, string[]> = {
  hover: [":hover", '[data-n-force~="hover"]'],
  focus: [":focus-visible", ":has(:focus-visible)", "[data-highlighted]", '[data-n-force~="focus"]'],
  active: [":active", '[data-n-force~="active"]', "[data-pressed]"],
  disabled: ["[data-disabled]", ":disabled", '[data-n-force~="disabled"]'],
  loading: ["[data-loading]", '[data-n-force~="loading"]'],
  selected: ["[data-selected]", '[aria-selected="true"]', '[data-state="active"]', '[data-state="checked"]', '[data-state="on"]', '[data-n-force~="selected"]'],
  error: ["[data-invalid]", '[aria-invalid="true"]', '[data-n-force~="error"]'],
  open: ["[data-open]", '[data-state="open"]', '[data-n-force~="open"]'],
  current: ["[data-current]", '[aria-current]:not([aria-current="false"])', '[data-n-force~="current"]'],
  dragging: ["[data-dragging]", '[data-n-force~="dragging"]'],
};

/** Layout vars passed inline by layout primitives; must not inherit into nested primitives. */
export const LAYOUT_VARS = ["--n-l-dir", "--n-l-dir-md", "--n-l-dir-lg", "--n-l-gap", "--n-l-align", "--n-l-justify", "--n-l-wrap", "--n-l-cols", "--n-l-cols-md", "--n-l-cols-lg", "--n-l-span", "--n-l-span-md", "--n-l-span-lg", "--n-l-w"];

const REG_INDEX = new Map(ALL_DEFS.map((d, i) => [d.id, i]));

/* ---------------- derived tokens ---------------- */

export const RADIUS_SCALE: Array<[string, string]> = [
  ["none", "0px"],
  ["xs", "calc(var(--n-radius-base) * 0.5)"],
  ["sm", "calc(var(--n-radius-base) * 0.75)"],
  ["md", "var(--n-radius-base)"],
  ["lg", "calc(var(--n-radius-base) * 1.75)"],
  ["xl", "calc(var(--n-radius-base) * 2.5)"],
  ["2xl", "calc(var(--n-radius-base) * 4)"],
  ["full", "9999px"],
];

export const spaceId = (n: number) => String(n).replace(".", "-");

export const DERIVED_TOKEN_IDS: string[] = [
  ...RADIUS_SCALE.map(([k]) => `radius.${k}`),
  ...SPACE_STEPS.map((n) => `space.${spaceId(n)}`),
];

/* ---------------- composites ---------------- */

const slotVar = (name: string) => `--n-c-${name}`;
const SLOT_NAMES: Record<CompositeId, string[]> = { filter: [], backdrop: [], translate: [], transform: [], bg: [] };
for (const d of PROPERTIES) if (d.slot) SLOT_NAMES[d.slot.composite].push(d.slot.name);

const T = "linear-gradient(#0000, #0000)";
function compositeDecls(id: CompositeId): Decl[] {
  const v = (n: string, fb = "") => `var(${slotVar(n)},${fb ? ` ${fb}` : ""})`;
  switch (id) {
    case "filter": {
      const value = SLOT_NAMES.filter.map((n) => v(n)).join(" ");
      return [{ prop: "filter", value }];
    }
    case "backdrop": {
      const value = SLOT_NAMES.backdrop.map((n) => v(n)).join(" ");
      return [
        { prop: "-webkit-backdrop-filter", value },
        { prop: "backdrop-filter", value },
      ];
    }
    case "translate":
      return [{ prop: "translate", value: `${v("tx", "0px")} ${v("ty", "0px")}` }];
    case "transform":
      return [{ prop: "transform", value: SLOT_NAMES.transform.map((n) => v(n)).join(" ") }];
    case "bg": {
      const rest = (x: string) => Array(8).fill(x).join(", ");
      return [
        { prop: "background-image", value: `${v("grain", T)}, ${v("pat", T)}, ${v("img", T)}, ${v("grad", T)}` },
        {
          prop: "background-size",
          value: `auto, var(--n-pat-size, 16px) var(--n-pat-size, 16px), var(--n-bg-size, cover), var(--n-bg-size, auto), ${rest("auto")}`,
        },
        {
          prop: "background-repeat",
          value: `repeat, repeat, var(--n-bg-repeat, no-repeat), var(--n-bg-repeat, no-repeat), ${rest("no-repeat")}`,
        },
        {
          prop: "background-position",
          value: `0 0, 0 0, var(--n-bg-pos, center), var(--n-bg-pos, center), ${rest("0 0")}`,
        },
      ];
    }
  }
}

/* ---------------- header (static engine CSS) ---------------- */

function header(): string {
  const regs: string[] = [];
  const reg = (name: string) => regs.push(`@property ${name}{syntax:"*";inherits:false}`);
  for (const names of Object.values(SLOT_NAMES)) for (const n of names) reg(slotVar(n));
  for (const d of PROPERTIES) if (d.cssVar && !d.inherits) reg(d.cssVar);
  reg("--n-amb-amp");
  for (const v of LAYOUT_VARS) reg(v);

  const keyframes = `
@keyframes n-amb-float{50%{translate:0 calc(-8px * var(--n-amb-amp, 1))}}
@keyframes n-amb-pulse{50%{opacity:calc(1 - 0.35 * var(--n-amb-amp, 1))}}
@keyframes n-amb-breathe{50%{scale:calc(1 + 0.04 * var(--n-amb-amp, 1))}}
@keyframes n-amb-shimmer{from{background-position:-200% 0}to{background-position:200% 0}}
@keyframes n-amb-gradient-shift{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
@keyframes n-amb-spin{to{rotate:1turn}}
@keyframes n-amb-wiggle{25%{rotate:calc(-3deg * var(--n-amb-amp, 1))}75%{rotate:calc(3deg * var(--n-amb-amp, 1))}}
@keyframes n-amb-bounce{0%,100%{translate:0 0;animation-timing-function:cubic-bezier(.8,0,1,1)}50%{translate:0 calc(-12px * var(--n-amb-amp, 1));animation-timing-function:cubic-bezier(0,0,.2,1)}}
@keyframes n-amb-blink{50%{opacity:0}}
@keyframes n-amb-glow{50%{box-shadow:0 0 calc(24px * var(--n-amb-amp, 1)) color-mix(in oklch, var(--n-color-accent) 60%, transparent)}}
@keyframes n-ripple{from{scale:0;opacity:.35}to{scale:1;opacity:0}}
@keyframes n-spin{to{rotate:1turn}}
@keyframes n-indeterminate{from{translate:-100% 0}to{translate:250% 0}}
@keyframes n-pop-in{from{opacity:0;scale:.96;translate:0 4px}}
@keyframes n-pop-out{to{opacity:0;scale:.98}}
@keyframes n-fade-in{from{opacity:0}}
@keyframes n-fade-out{to{opacity:0}}
@keyframes n-sheet-in{from{opacity:0;translate:0 16px}}
@keyframes n-drawer-in-right{from{translate:100% 0}}
@keyframes n-drawer-in-left{from{translate:-100% 0}}
@keyframes n-toast-in{from{opacity:0;translate:0 12px;scale:.97}}
@keyframes n-caret{50%{opacity:0}}`;

  const motionPolicy = `
html[data-n-motion="off"] *,html[data-n-motion="off"] *::before,html[data-n-motion="off"] *::after,
html[data-n-motion="reduce"] *,html[data-n-motion="reduce"] *::before,html[data-n-motion="reduce"] *::after{animation-duration:1ms!important;animation-iteration-count:1!important;transition-duration:1ms!important;scroll-behavior:auto!important}
@media (prefers-reduced-motion: reduce){html:not([data-n-motion="full"]) *,html:not([data-n-motion="full"]) *::before,html:not([data-n-motion="full"]) *::after{animation-duration:1ms!important;animation-iteration-count:1!important;transition-duration:1ms!important;scroll-behavior:auto!important}}`;

  const base = `
html{background-color:var(--n-color-bg);color:var(--n-color-text);font-family:var(--n-font-body);font-size:100%;line-height:var(--n-leading-normal);-webkit-text-size-adjust:100%;text-rendering:optimizeLegibility}
body{margin:0}
:where([data-n],[data-n-part]){box-sizing:border-box;corner-shape:var(--n-shape-corner)}
:where([data-n],[data-n-part])::before,:where([data-n],[data-n-part])::after{box-sizing:border-box}
::selection{background-color:var(--n-color-selection)}
[data-n-ripple]{position:absolute;border-radius:50%;pointer-events:none;background:var(--n-fx-ripple-color, currentColor);animation:n-ripple calc(600ms / var(--n-motion-speed,1)) var(--n-easing-standard) forwards}
[data-n-enter-pending]{visibility:hidden}`;

  return `${regs.join("\n")}\n${keyframes}\n${motionPolicy}\n${base}\n`;
}

/* ---------------- tokens ---------------- */

function tokenBlock(system: DesignSystem): string {
  const light: string[] = [];
  const dark: string[] = [];
  for (const def of TOKENS) {
    if (NON_VAR_TOKENS.has(def.id) || !def.cssVar) continue;
    const v = system.tokens[def.id] ?? def.default ?? null;
    const css = valueToCss(def, v, false);
    if (css !== null) light.push(`${def.cssVar}:${css}`);
    const dv = system.dark[def.id] ?? def.darkDefault;
    if (dv !== undefined && dv !== null) {
      const dcss = valueToCss(def, dv, false);
      if (dcss !== null) dark.push(`${def.cssVar}:${dcss}`);
    }
  }
  for (const [k, v] of RADIUS_SCALE) light.push(`--n-radius-${k}:${v}`);
  for (const n of SPACE_STEPS) light.push(`--n-space-${spaceId(n)}:calc(var(--n-space-unit) * ${n} * var(--n-space-density))`);
  return `:root{${light.join(";")}}\n:root.dark{color-scheme:dark;${dark.join(";")}}\n:root:not(.dark){color-scheme:light}\n`;
}

/* ---------------- selectors ---------------- */

const esc = (s: string) => s.replace(/["\\]/g, "\\$&");

export function selectorFor(scope: Scope, stateful?: Set<string>): string {
  if (!scope.component) {
    const html = scope.mode === "dark" ? ":root.dark" : scope.mode === "light" ? ":root:not(.dark)" : "html";
    return `:where(${html})`;
  }
  const c = esc(scope.component);
  let root = `[data-n="${c}"]`;
  if (scope.variant) root += `[data-n-variant="${esc(scope.variant)}"]`;
  if (scope.size) root += `[data-n-size="${esc(scope.size)}"]`;
  if (scope.instance) root += `[data-n-id="${esc(scope.instance)}"]`;
  const state = scope.state ? `:is(${STATE_SELECTORS[scope.state].join(",")})` : "";
  const hasPart = !!scope.part && scope.part !== "root";
  const partSel = hasPart ? `[data-n-part="${c}.${esc(scope.part!)}"]` : "";
  let list: string[];
  if (!hasPart) list = [root + state];
  else if (state && stateful?.has(scope.part!)) {
    // Interaction states bind to the part itself; ambient states may come from root or part.
    list = ["hover", "focus", "active"].includes(scope.state!) ? [`${root} ${partSel}${state}`] : [`${root} ${partSel}${state}`, `${root}${state} ${partSel}`];
  } else list = [`${root}${state} ${partSel}`];
  const prefix = scope.mode === "dark" ? ":root.dark " : scope.mode === "light" ? ":root:not(.dark) " : "";
  return `:where(${list.map((x) => prefix + x).join(",")})`;
}

export function statefulParts(components: ComponentDef[]): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const d of components) {
    const set = new Set<string>();
    for (const [name, p] of Object.entries(d.parts)) if (typeof p === "object" && p.stateful) set.add(name);
    map.set(d.type, set);
  }
  return map;
}

/* ---------------- declarations ---------------- */

export interface CompiledDecls {
  main: Decl[];
  pseudo: Partial<Record<NonNullable<PropertyDef["pseudo"]>, Decl[]>>;
}

export function declsFor(props: Record<string, Value>): CompiledDecls {
  const main: Decl[] = [];
  const pseudo: CompiledDecls["pseudo"] = {};
  const composites = new Set<CompositeId>();
  const ids = Object.keys(props).sort((a, b) => (REG_INDEX.get(a) ?? 1e6) - (REG_INDEX.get(b) ?? 1e6));

  for (const id of ids) {
    const raw = props[id];
    if (id.startsWith("--")) {
      if (raw !== null && raw !== undefined && raw !== "") main.push({ prop: id, value: String(raw) });
      continue;
    }
    const def = getDef(id);
    if (!def) {
      // Escape hatch: kebab-case keys are raw CSS declarations.
      if (id.includes("-") && raw !== null && raw !== undefined && raw !== "") main.push({ prop: id, value: String(raw) });
      continue;
    }
    if (def.kind === "token") continue;
    const isTransport = !!def.cssVar && !def.css && !def.emit && !def.slot;
    const css = valueToCss(def, raw, !isTransport);
    if (css === null) continue;

    let out: Decl[];
    if (def.emit) out = def.emit(css, raw);
    else if (def.slot) {
      out = [{ prop: slotVar(def.slot.name), value: def.slot.wrap ? def.slot.wrap(css) : css }];
      composites.add(def.slot.composite);
    } else if (def.cssVar && !def.css) out = [{ prop: def.cssVar, value: css }];
    else {
      const props = Array.isArray(def.css) ? def.css : def.css ? [def.css] : [];
      out = props.map((p) => ({ prop: p, value: css }));
    }

    if (def.pseudo) (pseudo[def.pseudo] ??= []).push(...out);
    else main.push(...out);
  }
  for (const c of composites) main.push(...compositeDecls(c));
  return { main, pseudo };
}

const block = (sel: string, decls: Decl[]) => (decls.length ? `${sel}{${decls.map((d) => `${d.prop}:${d.value}`).join(";")}}` : "");

/* ---------------- manifest (what the motion runtime should watch) ---------------- */

export interface MotionManifest {
  enter: string[];
  scroll: string[];
  fx: string[];
}

const hasAny = (props: Record<string, Value>, prefix: string[]) => Object.keys(props).some((k) => prefix.some((p) => k.startsWith(p)));

/* ---------------- compile ---------------- */

export interface CompileResult {
  css: string;
  manifest: MotionManifest;
  stats: { rules: number; declarations: number; bytes: number; ms: number };
}

export interface CompileOptions {
  /** Extra transient rules (Motion Lab, previews). */
  extra?: Rule[];
  /** Skip the static header (e.g. for "diff" exports). */
  bare?: boolean;
}

export function compile(system: DesignSystem, components: ComponentDef[], opts: CompileOptions = {}): CompileResult {
  const t0 = typeof performance !== "undefined" ? performance.now() : 0;
  const ordered: OrderedRule[] = orderRules(components, system, opts.extra);
  const statefulMap = statefulParts(components);
  const bpPx = (bp: string) => Number(system.tokens[`bp.${bp}`] ?? getDef(`bp.${bp}`)?.default ?? 0);

  const parts: string[] = [];
  if (!opts.bare) parts.push(header());
  parts.push(tokenBlock(system));

  const manifest: MotionManifest = { enter: [], scroll: [], fx: [] };
  let declarations = 0;

  for (const rule of ordered) {
    const sel = selectorFor(rule.scope, rule.scope.component ? statefulMap.get(rule.scope.component) : undefined);
    const { main, pseudo } = declsFor(rule.props);
    declarations += main.length;
    let css = block(sel, main);
    for (const [p, decls] of Object.entries(pseudo)) {
      declarations += decls!.length;
      css += block(`${sel}${p}`, decls!);
    }
    if (!css) continue;
    if (rule.scope.bp) css = `@media (min-width:${bpPx(rule.scope.bp)}px){${css}}`;
    parts.push(css);

    const bare = sel.slice(":where(".length, -1);
    if (hasAny(rule.props, ["enter"])) manifest.enter.push(bare);
    if (hasAny(rule.props, ["scrollEffect"])) manifest.scroll.push(bare);
    if (hasAny(rule.props, ["fx"])) manifest.fx.push(bare);
  }

  // Pre-paint hold: until the motion runtime takes over, entrance targets stay invisible
  // instead of flashing in fully drawn and then animating a second time.
  if (manifest.enter.length) parts.push(`${manifest.enter.map((s) => `html[data-n-pre] :where(${s})`).join(",")}{opacity:0}`);

  const out = parts.join("\n");
  const ms = typeof performance !== "undefined" ? performance.now() - t0 : 0;
  return { css: out, manifest, stats: { rules: ordered.length, declarations, bytes: out.length, ms } };
}
