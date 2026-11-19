"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { DERIVED_TOKEN_IDS } from "@/engine/compile";
import { FONT_OPTIONS } from "@/engine/fonts";
import { getDef, TOKENS } from "@/engine/registry";
import { tokenVar } from "@/engine/registry/tokens";
import type { Control, EasingValue, GradientValue, PropertyDef, ShadowValue, TokenGroup, Value } from "@/engine/types";
import { easingSampler, gradientToCss, refs, shadowToCss } from "@/engine/values";
import "./studio.css";

/* ------------------------------------------------------------------ *
 * Inspector controls. One generic <PropertyControl> renders the right
 * editor for any registry property; adding a property to the registry
 * makes it editable here automatically.
 * ------------------------------------------------------------------ */

type OnChange = (v: Value | undefined) => void;

const tokenIdsFor = (groups: TokenGroup[] | undefined): string[] => {
  if (!groups?.length) return [];
  const ids = [...TOKENS.map((t) => t.id), ...DERIVED_TOKEN_IDS];
  return ids.filter((id) => groups.includes(id.split(".")[0] as TokenGroup));
};

/** Friendly name of a token id ("color.text-muted" → "Text muted", "radius.md" → "Radius md"). */
export const tokenName = (id: string) => getDef(id)?.label ?? id.replace(/[.-]/g, " ").replace(/^./, (c) => c.toUpperCase());

/** The token a value points at, whether written as {id} or var(--n-…). */
export function refId(value: Value): string | null {
  if (typeof value !== "string") return null;
  const t = value.trim();
  const m = t.match(/^\{([a-z0-9.-]+)\}$/i);
  if (m) return m[1];
  const v = t.match(/^var\((--n-[a-z0-9-]+)\)$/i);
  if (!v) return null;
  return [...TOKENS.map((x) => x.id), ...DERIVED_TOKEN_IDS].find((id) => tokenVar(id) === v[1]) ?? null;
}

function TokenSelect({ groups, value, onChange }: { groups?: TokenGroup[]; value: Value; onChange: OnChange }) {
  const ids = tokenIdsFor(groups);
  if (!ids.length) return null;
  const cur = refId(value) ?? "";
  return (
    <select className="st-token" aria-label="Token" value={ids.includes(cur) ? cur : ""} onChange={(e) => onChange(e.target.value ? `{${e.target.value}}` : undefined)} title="Link to a theme value">
      <option value="">Theme…</option>
      {ids.map((id) => (
        <option key={id} value={id}>
          {tokenName(id)}
        </option>
      ))}
    </select>
  );
}

/** Shows a theme-linked value as a readable chip; click it to type a custom value instead. */
function ValueText({ value, onChange, label, placeholder }: { value: Value; onChange: (v: string) => void; label: string; placeholder?: string }) {
  const [editing, setEditing] = useState(false);
  const id = refId(value);
  if (id && !editing) {
    return (
      <button type="button" className="st-linked" title="Linked to a theme value. Click to type your own." onClick={() => setEditing(true)} aria-label={`${label}: linked to ${tokenName(id)}`}>
        ↳ {tokenName(id)}
      </button>
    );
  }
  return <TextIn label={label} value={toStr(value)} placeholder={placeholder} onChange={onChange} />;
}

/** Text input that commits on change but keeps local typing state. */
function TextIn({ value, onChange, placeholder, label, mono = true }: { value: string; onChange: (v: string) => void; placeholder?: string; label: string; mono?: boolean }) {
  const [v, setV] = useState(value);
  const [focused, setFocused] = useState(false);
  const shown = focused ? v : value;
  return (
    <input
      className={mono ? "st-in st-mono" : "st-in"}
      aria-label={label}
      value={shown}
      placeholder={placeholder}
      onFocus={() => {
        setV(value);
        setFocused(true);
      }}
      onBlur={() => setFocused(false)}
      onChange={(e) => {
        setV(e.target.value);
        onChange(e.target.value);
      }}
    />
  );
}

const toStr = (v: Value) => (v === null || v === undefined ? "" : typeof v === "object" ? "" : String(v));

/* ---------------- colour ---------------- */

function toHex(input: string): string {
  if (/^#[0-9a-f]{6}$/i.test(input)) return input;
  if (typeof document === "undefined") return "#888888";
  try {
    const c = document.createElement("canvas").getContext("2d")!;
    c.fillStyle = "#000";
    c.fillStyle = refs(input);
    const s = c.fillStyle as string;
    return /^#/.test(s) ? s : "#888888";
  } catch {
    return "#888888";
  }
}

function ColorControl({ value, onChange, def, label }: { value: Value; onChange: OnChange; def?: PropertyDef; label: string }) {
  const s = toStr(value);
  return (
    <div className="st-row-ctl">
      <span className="st-swatch" style={{ background: s ? refs(s) : "transparent" }}>
        <input type="color" aria-label={`${label} picker`} value={toHex(s)} onChange={(e) => onChange(e.target.value)} />
      </span>
      <ValueText label={label} value={value} placeholder="Inherited · type #hex" onChange={(v) => onChange(v || undefined)} />
      <TokenSelect groups={def?.tokens ?? ["color"]} value={value} onChange={onChange} />
    </div>
  );
}

/* ---------------- length / number / time ---------------- */

function parseLen(v: Value): { n: number | null; unit: string } {
  if (typeof v === "number") return { n: v, unit: "" };
  const m = typeof v === "string" ? v.match(/^(-?[\d.]+)([a-z%]*)$/i) : null;
  return m ? { n: parseFloat(m[1]), unit: m[2] } : { n: null, unit: "" };
}

function LengthControl({ c, value, onChange, def, label }: { c: Extract<Control, { type: "length" }>; value: Value; onChange: OnChange; def: PropertyDef; label: string }) {
  const { n, unit } = parseLen(value);
  const units = c.units ?? ["px"];
  const u = unit || units[0];
  return (
    <div className="st-row-ctl">
      <input
        type="range"
        className="st-range"
        aria-label={`${label} slider`}
        min={c.min ?? 0}
        max={c.max ?? 100}
        step={c.step ?? 1}
        value={n ?? c.min ?? 0}
        onChange={(e) => onChange(u ? `${e.target.value}${u}` : Number(e.target.value))}
      />
      <ValueText label={label} value={value} placeholder="auto" onChange={(v) => onChange(v === "" ? undefined : /^-?[\d.]+$/.test(v) && u ? `${v}${u}` : v)} />
      <TokenSelect groups={def.tokens ?? c.tokens} value={value} onChange={onChange} />
    </div>
  );
}

function NumberControl({ c, value, onChange, label, def }: { c: { min?: number; max?: number; step?: number; unit?: string }; value: Value; onChange: OnChange; label: string; def?: PropertyDef }) {
  const n = typeof value === "number" ? value : parseFloat(toStr(value));
  return (
    <div className="st-row-ctl">
      <input type="range" className="st-range" aria-label={`${label} slider`} min={c.min ?? 0} max={c.max ?? 100} step={c.step ?? 1} value={Number.isFinite(n) ? n : (c.min ?? 0)} onChange={(e) => onChange(Number(e.target.value))} />
      <ValueText label={label} value={value} placeholder="—" onChange={(v) => onChange(v === "" ? undefined : /^-?[\d.]+$/.test(v) ? Number(v) : v)} />
      {c.unit ? <span className="st-unit">{c.unit}</span> : null}
      {def?.tokens ? <TokenSelect groups={def.tokens} value={value} onChange={onChange} /> : null}
    </div>
  );
}

/* ---------------- select / toggle / text / font ---------------- */

function SelectControl({ c, value, onChange, label }: { c: Extract<Control, { type: "select" }>; value: Value; onChange: OnChange; label: string }) {
  const s = toStr(value);
  return (
    <select className="st-in" aria-label={label} value={s} onChange={(e) => onChange(e.target.value || undefined)}>
      <option value="">Inherited</option>
      {c.options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
      {s && !c.options.some((o) => o.value === s) ? <option value={s}>{s}</option> : null}
    </select>
  );
}

function FontControl({ value, onChange, label }: { value: Value; onChange: OnChange; label: string }) {
  const s = toStr(value);
  const known = FONT_OPTIONS.find((f) => f.value === s);
  return (
    <div className="st-row-ctl">
      <select className="st-in" aria-label={label} value={known ? s : ""} onChange={(e) => onChange(e.target.value || undefined)} style={{ fontFamily: s ? refs(s) : undefined }}>
        <option value="">{s && !known ? "Custom stack" : "— inherit —"}</option>
        {FONT_OPTIONS.map((f) => (
          <option key={f.label} value={f.value}>
            {f.label}
          </option>
        ))}
      </select>
      <TokenSelect groups={["font", "type"]} value={value} onChange={onChange} />
    </div>
  );
}

/* ---------------- shadow ---------------- */

function ShadowControl({ value, onChange, label }: { value: Value; onChange: OnChange; label: string }) {
  const sv: ShadowValue = value && typeof value === "object" && value.kind === "shadow" ? value : { kind: "shadow", layers: [] };
  const isStr = typeof value === "string";
  const setLayers = (layers: ShadowValue["layers"]) => onChange({ kind: "shadow", layers });
  return (
    <div className="st-stack">
      <div className="st-row-ctl">
        <span className="st-preview-box" style={{ boxShadow: isStr ? refs(value as string) : shadowToCss(sv) }} />
        <TokenSelect groups={["shadow"]} value={value} onChange={onChange} />
        <button type="button" className="st-mini" onClick={() => setLayers([...sv.layers, { x: 0, y: 8, blur: 24, spread: -8, color: "color-mix(in oklch, var(--n-color-shadow) 30%, transparent)" }])}>
          + layer
        </button>
        <button type="button" className="st-mini" onClick={() => onChange("none")}>
          none
        </button>
      </div>
      {isStr ? <TextIn label={label} value={value as string} onChange={(v) => onChange(v || undefined)} /> : null}
      {sv.layers.map((l, i) => (
        <div key={i} className="st-layer">
          {(["x", "y", "blur", "spread"] as const).map((k) => (
            <label key={k} className="st-num">
              <span>{k}</span>
              <input type="number" value={l[k]} onChange={(e) => setLayers(sv.layers.map((x, j) => (j === i ? { ...x, [k]: Number(e.target.value) } : x)))} />
            </label>
          ))}
          <TextIn label="Layer colour" value={l.color} onChange={(v) => setLayers(sv.layers.map((x, j) => (j === i ? { ...x, color: v } : x)))} />
          <label className="st-check">
            <input type="checkbox" checked={!!l.inset} onChange={(e) => setLayers(sv.layers.map((x, j) => (j === i ? { ...x, inset: e.target.checked } : x)))} />
            inset
          </label>
          <button type="button" className="st-mini" aria-label="Remove layer" onClick={() => setLayers(sv.layers.filter((_, j) => j !== i))}>
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

/* ---------------- gradient ---------------- */

const DEFAULT_GRADIENT: GradientValue = {
  kind: "gradient",
  type: "linear",
  angle: 135,
  stops: [
    { color: "{color.accent}", pos: 0 },
    { color: "{color.chart-3}", pos: 100 },
  ],
};

function GradientControl({ value, onChange, label }: { value: Value; onChange: OnChange; label: string }) {
  const g: GradientValue | null = value && typeof value === "object" && value.kind === "gradient" ? value : null;
  if (!g) {
    return (
      <div className="st-stack">
        {typeof value === "string" ? <TextIn label={label} value={value} onChange={(v) => onChange(v || undefined)} /> : null}
        <button type="button" className="st-mini" onClick={() => onChange(DEFAULT_GRADIENT)}>
          + gradient
        </button>
      </div>
    );
  }
  const set = (p: Partial<GradientValue>) => onChange({ ...g, ...p });
  return (
    <div className="st-stack">
      <span className="st-preview-bar" style={{ backgroundImage: gradientToCss(g) }} />
      <div className="st-row-ctl">
        <select className="st-in" aria-label="Gradient type" value={g.type} onChange={(e) => set({ type: e.target.value as GradientValue["type"], blobs: e.target.value === "mesh" ? (g.blobs ?? g.stops.map((s, i) => ({ color: s.color, x: 20 + i * 50, y: 30 + i * 30, size: 55 }))) : g.blobs })}>
          {["linear", "radial", "conic", "mesh"].map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        {g.type !== "mesh" && g.type !== "radial" ? <input type="range" className="st-range" aria-label="Angle" min={0} max={360} value={g.angle ?? 180} onChange={(e) => set({ angle: Number(e.target.value) })} /> : null}
        <button type="button" className="st-mini" onClick={() => onChange(undefined)}>
          clear
        </button>
      </div>
      {g.type === "mesh"
        ? (g.blobs ?? []).map((b, i) => (
            <div key={i} className="st-layer">
              <TextIn label="Blob colour" value={b.color} onChange={(v) => set({ blobs: g.blobs!.map((x, j) => (j === i ? { ...x, color: v } : x)) })} />
              {(["x", "y", "size"] as const).map((k) => (
                <label key={k} className="st-num">
                  <span>{k}</span>
                  <input type="number" value={b[k]} onChange={(e) => set({ blobs: g.blobs!.map((x, j) => (j === i ? { ...x, [k]: Number(e.target.value) } : x)) })} />
                </label>
              ))}
              <button type="button" className="st-mini" aria-label="Remove blob" onClick={() => set({ blobs: g.blobs!.filter((_, j) => j !== i) })}>
                ×
              </button>
            </div>
          ))
        : g.stops.map((s, i) => (
            <div key={i} className="st-layer">
              <span className="st-swatch st-swatch-sm" style={{ background: refs(s.color) }}>
                <input type="color" aria-label="Stop colour" value={toHex(s.color)} onChange={(e) => set({ stops: g.stops.map((x, j) => (j === i ? { ...x, color: e.target.value } : x)) })} />
              </span>
              <TextIn label="Stop colour" value={s.color} onChange={(v) => set({ stops: g.stops.map((x, j) => (j === i ? { ...x, color: v } : x)) })} />
              <input type="range" className="st-range" aria-label="Stop position" min={0} max={100} value={s.pos} onChange={(e) => set({ stops: g.stops.map((x, j) => (j === i ? { ...x, pos: Number(e.target.value) } : x)) })} />
              <button type="button" className="st-mini" aria-label="Remove stop" onClick={() => set({ stops: g.stops.filter((_, j) => j !== i) })}>
                ×
              </button>
            </div>
          ))}
      <button
        type="button"
        className="st-mini"
        onClick={() =>
          g.type === "mesh"
            ? set({ blobs: [...(g.blobs ?? []), { color: "{color.chart-4}", x: 50, y: 50, size: 50 }] })
            : set({ stops: [...g.stops, { color: "{color.chart-5}", pos: 100 }] })
        }
      >
        + {g.type === "mesh" ? "blob" : "stop"}
      </button>
    </div>
  );
}

/* ---------------- easing ---------------- */

export function EasingCurve({ easing, size = 120, playing }: { easing?: EasingValue; size?: number; playing?: number }) {
  const f = easingSampler(easing);
  const pts = Array.from({ length: 61 }, (_, i) => {
    const x = i / 60;
    return `${8 + x * (size - 16)},${size - 8 - f(x) * (size - 16) * 0.8 - (size - 16) * 0.1}`;
  }).join(" ");
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="st-curve" aria-label="Easing curve" role="img">
      <rect x="8" y="8" width={size - 16} height={size - 16} className="st-curve-frame" />
      <polyline points={pts} className="st-curve-line" />
      {playing !== undefined ? <circle key={playing} r="3.5" className="st-curve-dot" cx={8} cy={size - 8} style={{ offsetPath: `path("M${pts.replace(/ /g, " L")}")`, animationDuration: "900ms" }} /> : null}
    </svg>
  );
}

function BezierPad({ p, onChange }: { p: [number, number, number, number]; onChange: (p: [number, number, number, number]) => void }) {
  const ref = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState<0 | 1 | null>(null);
  const S = 140;
  const toXY = (x: number, y: number) => [10 + x * (S - 20), S - 30 - y * (S - 60)] as const;
  const a = toXY(p[0], p[1]);
  const b = toXY(p[2], p[3]);
  const s0 = toXY(0, 0);
  const s1 = toXY(1, 1);
  useEffect(() => {
    if (drag === null) return;
    const move = (e: PointerEvent) => {
      const r = ref.current!.getBoundingClientRect();
      const x = Math.min(1, Math.max(0, (e.clientX - r.left - 10) / (S - 20)));
      const y = Math.min(1.6, Math.max(-0.6, (S - 30 - (e.clientY - r.top)) / (S - 60)));
      const next = [...p] as [number, number, number, number];
      next[drag * 2] = +x.toFixed(2);
      next[drag * 2 + 1] = +y.toFixed(2);
      onChange(next);
    };
    const up = () => setDrag(null);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [drag, p, onChange]);
  return (
    <svg ref={ref} width={S} height={S} className="st-curve" role="img" aria-label="Cubic bezier editor (drag the handles)">
      <rect x="10" y="30" width={S - 20} height={S - 60} className="st-curve-frame" />
      <line x1={s0[0]} y1={s0[1]} x2={a[0]} y2={a[1]} className="st-curve-handle" />
      <line x1={s1[0]} y1={s1[1]} x2={b[0]} y2={b[1]} className="st-curve-handle" />
      <path d={`M${s0[0]},${s0[1]} C${a[0]},${a[1]} ${b[0]},${b[1]} ${s1[0]},${s1[1]}`} className="st-curve-line" />
      {[a, b].map((pt, i) => (
        <circle key={i} cx={pt[0]} cy={pt[1]} r="6" className="st-curve-knob" onPointerDown={() => setDrag(i as 0 | 1)} />
      ))}
    </svg>
  );
}

const PRESET_BEZIERS: Record<string, [number, number, number, number]> = {
  "ease-out-expo": [0.16, 1, 0.3, 1],
  "ease-out-quart": [0.25, 1, 0.5, 1],
  "ease-in-out-cubic": [0.65, 0, 0.35, 1],
  "back-out": [0.34, 1.56, 0.64, 1],
  anticipate: [0.68, -0.6, 0.32, 1.6],
  linear: [0, 0, 1, 1],
};

function EasingControl({ value, onChange, label }: { value: Value; onChange: OnChange; label: string }) {
  const e: EasingValue | undefined = value && typeof value === "object" && value.kind === "easing" ? value : undefined;
  const isRef = typeof value === "string";
  const [play, setPlay] = useState(0);
  const mode = isRef ? "token" : (e?.type ?? "none");
  return (
    <div className="st-stack">
      <div className="st-row-ctl">
        <select
          className="st-in"
          aria-label={`${label} type`}
          value={mode}
          onChange={(ev) => {
            const t = ev.target.value;
            if (t === "none") onChange(undefined);
            else if (t === "token") onChange("{easing.standard}");
            else if (t === "bezier") onChange({ kind: "easing", type: "bezier", p: [0.22, 1, 0.36, 1] });
            else if (t === "spring") onChange({ kind: "easing", type: "spring", stiffness: 300, damping: 22, mass: 1 });
            else onChange({ kind: "easing", type: "preset", name: "ease-out" });
          }}
        >
          <option value="none">— inherit —</option>
          <option value="token">Token</option>
          <option value="preset">CSS keyword</option>
          <option value="bezier">Cubic bézier</option>
          <option value="spring">Spring</option>
        </select>
        <button type="button" className="st-mini" onClick={() => setPlay((n) => n + 1)}>
          ▶ replay
        </button>
      </div>
      {isRef ? <TokenSelect groups={["easing"]} value={value} onChange={onChange} /> : null}
      {e?.type === "preset" ? (
        <select className="st-in" aria-label="Keyword" value={e.name} onChange={(ev) => onChange({ ...e, name: ev.target.value })}>
          {["linear", "ease", "ease-in", "ease-out", "ease-in-out", "step-end"].map((k) => (
            <option key={k}>{k}</option>
          ))}
        </select>
      ) : null}
      <div className="st-row-ctl" style={{ alignItems: "flex-start" }}>
        {e?.type === "bezier" ? <BezierPad p={e.p} onChange={(p) => onChange({ ...e, p })} /> : <EasingCurve easing={e} playing={play} />}
        <div className="st-stack" style={{ flex: 1 }}>
          {e?.type === "bezier" ? (
            <>
              <select className="st-in" aria-label="Bezier preset" value="" onChange={(ev) => ev.target.value && onChange({ ...e, p: PRESET_BEZIERS[ev.target.value] })}>
                <option value="">Presets…</option>
                {Object.keys(PRESET_BEZIERS).map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
              <TextIn label="cubic-bezier" value={e.p.join(", ")} onChange={(v) => {
                const n = v.split(",").map(Number);
                if (n.length === 4 && n.every(Number.isFinite)) onChange({ ...e, p: n as [number, number, number, number] });
              }} />
            </>
          ) : null}
          {e?.type === "spring"
            ? (["stiffness", "damping", "mass"] as const).map((k) => (
                <label key={k} className="st-num st-num-wide">
                  <span>{k}</span>
                  <input type="range" className="st-range" min={k === "mass" ? 0.1 : 1} max={k === "stiffness" ? 1000 : k === "damping" ? 80 : 5} step={k === "mass" ? 0.1 : 1} value={e[k]} onChange={(ev) => onChange({ ...e, [k]: Number(ev.target.value) })} />
                  <output>{e[k]}</output>
                </label>
              ))
            : null}
        </div>
      </div>
    </div>
  );
}

/* ---------------- dispatcher ---------------- */

export function PropertyControl({ def, value, onChange }: { def: PropertyDef; value: Value; onChange: OnChange }): ReactNode {
  const c = def.control;
  const label = def.label;
  switch (c.type) {
    case "color":
      return <ColorControl value={value} onChange={onChange} def={def} label={label} />;
    case "length":
      return <LengthControl c={c} value={value} onChange={onChange} def={def} label={label} />;
    case "number":
      return <NumberControl c={c} value={value} onChange={onChange} label={label} def={def} />;
    case "time":
      return (
        <div className="st-row-ctl">
          <NumberControl c={{ ...c, unit: "ms" }} value={value} onChange={onChange} label={label} />
          <TokenSelect groups={["duration"]} value={value} onChange={onChange} />
        </div>
      );
    case "select":
      return <SelectControl c={c} value={value} onChange={onChange} label={label} />;
    case "toggle":
      return (
        <label className="st-check">
          <input type="checkbox" checked={value === true || value === "true"} onChange={(e) => onChange(e.target.checked)} /> {value === false ? "off" : "on"}
        </label>
      );
    case "font":
      return <FontControl value={value} onChange={onChange} label={label} />;
    case "shadow":
      return <ShadowControl value={value} onChange={onChange} label={label} />;
    case "gradient":
      return <GradientControl value={value} onChange={onChange} label={label} />;
    case "easing":
      return <EasingControl value={value} onChange={onChange} label={label} />;
    default:
      return <TextIn label={label} value={toStr(value)} onChange={(v) => onChange(v || undefined)} placeholder={(c as { placeholder?: string }).placeholder} />;
  }
}
