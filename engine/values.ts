import type { EasingValue, GradientValue, PropertyDef, ShadowValue, Value } from "./types";

/* ------------------------------------------------------------------ *
 * Value → CSS. Token refs look like {color.accent} and become
 * var(--n-color-accent). Raw CSS is always accepted.
 * ------------------------------------------------------------------ */

const REF = /\{([a-z0-9]+)\.([a-z0-9.\-_]+)\}/gi;

export function refs(input: string): string {
  return input.replace(REF, (_, group: string, name: string) => `var(--n-${group}-${name.replace(/\./g, "-")})`);
}

/** Token ids referenced inside a value (for usage analysis). */
export function refIds(value: Value): string[] {
  const text = typeof value === "string" ? value : value && typeof value === "object" ? JSON.stringify(value) : "";
  const out: string[] = [];
  for (const m of text.matchAll(REF)) out.push(`${m[1]}.${m[2]}`);
  return out;
}

export const isRef = (v: Value): v is string => typeof v === "string" && /^\{[a-z0-9]+\.[a-z0-9.\-_]+\}$/i.test(v);

/* ---------------- shadows ---------------- */

export function shadowToCss(v: ShadowValue): string {
  if (!v.layers.length) return "none";
  return v.layers
    .map((l) => `${l.inset ? "inset " : ""}${l.x}px ${l.y}px ${l.blur}px ${l.spread}px ${refs(l.color)}`)
    .join(", ");
}

/* ---------------- gradients ---------------- */

export function gradientToCss(g: GradientValue): string {
  const stops = g.stops.map((s) => `${refs(s.color)} ${s.pos}%`).join(", ");
  const rep = g.repeating ? "repeating-" : "";
  switch (g.type) {
    case "radial":
      return `${rep}radial-gradient(${g.shape ?? "ellipse"} at ${g.at ?? "50% 50%"}, ${stops})`;
    case "conic":
      return `${rep}conic-gradient(from ${g.angle ?? 0}deg at ${g.at ?? "50% 50%"}, ${stops})`;
    case "mesh":
      return (g.blobs ?? [])
        .slice(0, 8)
        .map((b) => `radial-gradient(circle at ${b.x}% ${b.y}%, ${refs(b.color)} 0%, transparent ${b.size}%)`)
        .join(", ");
    default:
      return `${rep}linear-gradient(${g.angle ?? 180}deg, ${stops})`;
  }
}

/* ---------------- easing / springs ---------------- */

export interface SpringSim {
  /** Seconds to settle. */
  duration: number;
  /** Normalised samples (progress 0..1, may overshoot). */
  samples: number[];
}

export function simulateSpring(stiffness: number, damping: number, mass: number, points = 48): SpringSim {
  const k = Math.max(1, stiffness);
  const c = Math.max(0, damping);
  const m = Math.max(0.05, mass);
  const dt = 1 / 1000;
  let x = 0;
  let v = 0;
  let t = 0;
  const trace: number[] = [0];
  while (t < 6) {
    const a = (-k * (x - 1) - c * v) / m;
    v += a * dt;
    x += v * dt;
    t += dt;
    trace.push(x);
    if (t > 0.05 && Math.abs(x - 1) < 0.0008 && Math.abs(v) < 0.01) break;
  }
  const samples: number[] = [];
  for (let i = 0; i <= points; i++) {
    const idx = Math.round((i / points) * (trace.length - 1));
    samples.push(i === points ? 1 : trace[idx]);
  }
  return { duration: t, samples };
}

export const EASING_KEYWORDS = ["linear", "ease", "ease-in", "ease-out", "ease-in-out", "step-start", "step-end"];

export function easingToCss(e: EasingValue): string {
  if (e.type === "preset") return EASING_KEYWORDS.includes(e.name) ? e.name : refs(`{easing.${e.name}}`);
  if (e.type === "bezier") return `cubic-bezier(${e.p.map((n) => +n.toFixed(3)).join(", ")})`;
  const { samples } = simulateSpring(e.stiffness, e.damping, e.mass);
  return `linear(${samples.map((s) => +s.toFixed(4)).join(", ")})`;
}

/** Sample any easing for curve previews: returns y for x∈[0,1]. */
export function easingSampler(e: EasingValue | undefined): (x: number) => number {
  if (!e) return (x) => x;
  if (e.type === "spring") {
    const { samples } = simulateSpring(e.stiffness, e.damping, e.mass, 120);
    return (x) => {
      const f = x * (samples.length - 1);
      const i = Math.floor(f);
      const a = samples[i] ?? 1;
      const b = samples[i + 1] ?? 1;
      return a + (b - a) * (f - i);
    };
  }
  const p: [number, number, number, number] =
    e.type === "bezier"
      ? e.p
      : ({
          linear: [0, 0, 1, 1],
          ease: [0.25, 0.1, 0.25, 1],
          "ease-in": [0.42, 0, 1, 1],
          "ease-out": [0, 0, 0.58, 1],
          "ease-in-out": [0.42, 0, 0.58, 1],
        } as Record<string, [number, number, number, number]>)[e.name] ?? [0.25, 0.1, 0.25, 1];
  return (x) => bezierY(p, x);
}

function bezierY([x1, y1, x2, y2]: [number, number, number, number], x: number) {
  // Newton–Raphson on t for x(t) = x, then y(t).
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  let t = x;
  for (let i = 0; i < 8; i++) {
    const xt = ((ax * t + bx) * t + cx) * t - x;
    const d = (3 * ax * t + 2 * bx) * t + cx;
    if (Math.abs(xt) < 1e-5 || d === 0) break;
    t -= xt / d;
  }
  return ((ay * t + by) * t + cy) * t;
}

/* ---------------- patterns & grain ---------------- */

const C = "var(--n-pat-color, color-mix(in oklch, currentColor 18%, transparent))";
export const PATTERNS: Record<string, string> = {
  dots: `radial-gradient(circle, ${C} 1px, transparent 1.5px)`,
  grid: `conic-gradient(from 90deg at 1px 1px, transparent 90deg, ${C} 0)`,
  lines: `linear-gradient(${C} 1px, transparent 1px)`,
  diagonal: `linear-gradient(45deg, transparent calc(50% - 0.5px), ${C} calc(50% - 0.5px) calc(50% + 0.5px), transparent 0)`,
  checker: `conic-gradient(${C} 25%, transparent 0 50%, ${C} 0 75%, transparent 0)`,
};

export function grainToCss(amount: number): string {
  const a = Math.max(0, Math.min(1, amount));
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 ${(a * 0.9).toFixed(3)} 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}

/* ---------------- main entry ---------------- */

const isObj = (v: Value): v is Exclude<Value, string | number | boolean | null> => !!v && typeof v === "object";

/**
 * Compile a value for a property. Returns null when nothing should be emitted.
 * `forCss` = true when the value lands in a real CSS property (durations get the
 * master-speed divisor); false for transport variables read by the runtime.
 */
export function valueToCss(def: PropertyDef, value: Value, forCss = true): string | null {
  if (value === null || value === undefined || value === "") return null;

  if (isObj(value)) {
    if (value.kind === "shadow") return shadowToCss(value);
    if (value.kind === "gradient") return gradientToCss(value);
    if (value.kind === "easing") return easingToCss(value);
  }

  const c = def.control;

  // Special slot types
  if (def.slot?.name === "pat") {
    const s = String(value);
    return s === "none" ? null : (PATTERNS[s] ?? refs(s));
  }
  if (def.slot?.name === "grain") {
    const n = Number(value);
    return n > 0 ? grainToCss(n) : null;
  }

  if (typeof value === "boolean") return value ? "1" : "0";

  if (typeof value === "number") {
    switch (c.type) {
      case "length": {
        const unit = c.units?.[0] ?? "px";
        return `${value}${unit}`;
      }
      case "number":
        return `${value}${c.unit && c.unit !== "×" && c.unit !== "%" ? c.unit : c.unit === "%" ? "%" : ""}`;
      case "time":
        return forCss ? `calc(${value}ms / var(--n-motion-speed, 1))` : `${value}ms`;
      default:
        return String(value);
    }
  }

  const s = refs(value);
  if (c.type === "time" && forCss && /^\d+(\.\d+)?m?s$/.test(value)) return `calc(${value} / var(--n-motion-speed, 1))`;
  if (c.type === "time" && forCss && s.startsWith("var(--n-duration")) return `calc(${s} / var(--n-motion-speed, 1))`;
  return s;
}
