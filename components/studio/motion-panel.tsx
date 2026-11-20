"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/normy/icon";
import { INTERACTIVE_LIST as INTERACTIVE_TARGETS, LOOP_TYPES, MOTION_PATH, MOTION_TABS, type MotionTab } from "@/components/preview/motion-list";
import { COMPONENTS_PATH } from "@/components/preview/component-list";
import { explain, orderRules } from "@/engine/cascade";
import { COMPONENTS, getComponent } from "@/engine/components";
import { getDef, TOKENS } from "@/engine/registry";
import { enterKeyframes, PRESETS, type EnterConfig } from "@/engine/runtime/motion";
import { findRule, setProp } from "@/engine/system";
import type { DesignSystem, Scope, Value } from "@/engine/types";
import { PropertyControl } from "./controls";
import { useStudio } from "./store";

/* ------------------------------------------------------------------ *
 * Motion panel — one place for every kind of movement:
 *   Entrance      how things appear: effect, speed, and the sequence
 *                 (all at once / overlap / one after another), order, trigger
 *   Open & close  pop-ups, menus, dialogs, drawers, toasts — closing faster
 *   Interactive   hover, press, focus, timing, pointer effects
 *   Loops         seamless loop components, global loop speed, ambient loops
 * Every control writes ordinary rules/tokens, so exports and agents get it too.
 * The canvas shows the matching live page (/preview/motion-studio/<tab>).
 * ------------------------------------------------------------------ */

type Patch = Record<string, Value | undefined>;

function useCascade() {
  const system = useStudio((s) => s.system);
  const ordered = useMemo(() => orderRules(COMPONENTS, system), [system]);
  const get = (scope: Scope, prop: string): Value | undefined => {
    const here = findRule(system, scope)?.props[prop];
    return here !== undefined ? here : explain(ordered, scope, prop).value;
  };
  return { system, get };
}

function writeAll(system: DesignSystem, scopes: Scope[], patch: Patch): DesignSystem {
  let next = system;
  for (const sc of scopes) for (const [k, v] of Object.entries(patch)) next = setProp(next, sc, k, v);
  return next;
}

function useWrite() {
  const commit = useStudio((s) => s.commit);
  return (scopes: Scope[], patch: Patch, label: string, merge = true) => commit(writeAll(useStudio.getState().system, scopes, patch), `motion · ${label}`, merge);
}

const numOf = (v: Value | undefined, fb: number) => {
  if (typeof v === "number") return v;
  const n = parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : fb;
};

/** Resolve a {duration.x} reference to ms for display. */
function ms(system: DesignSystem, v: Value | undefined, fb: number) {
  if (typeof v === "string") {
    const m = v.match(/^\{(.+)\}$/);
    if (m) return numOf(system.tokens[m[1]] ?? TOKENS.find((t) => t.id === m[1])?.default, fb);
  }
  return numOf(v, fb);
}

/* ---------------- small UI parts ---------------- */

function Sec({ title, hint, children, aside }: { title: string; hint?: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="st-sec">
      <header className="st-sec-head">
        <div>
          <h3>{title}</h3>
          {hint ? <p>{hint}</p> : null}
        </div>
        {aside}
      </header>
      {children}
    </section>
  );
}

function Seg<T extends string>({ label, value, options, onChange }: { label: string; value: T | undefined; options: Array<{ id: T; label: string; title?: string }>; onChange: (v: T) => void }) {
  return (
    <div className="st-seg st-seg-wrap" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.id} type="button" role="radio" aria-checked={value === o.id} data-active={value === o.id ? "" : undefined} title={o.title} onClick={() => onChange(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Slider({ label, value, min, max, step = 1, unit = "", format, onChange }: { label: string; value: number; min: number; max: number; step?: number; unit?: string; format?: (v: number) => string; onChange: (v: number) => void }) {
  return (
    <label className="st-slider">
      <span className="st-slider-top">
        <span>{label}</span>
        <b>{format ? format(value) : `${Math.round(value * 100) / 100}${unit}`}</b>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} aria-label={label} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="st-field-block">
      <span className="st-label">{label}</span>
      {children}
    </div>
  );
}

/** A registry control (easing editor, etc.) bound to several scopes at once. */
function Prop({ id, scopes, label }: { id: string; scopes: Scope[]; label?: string }) {
  const { get } = useCascade();
  const write = useWrite();
  const def = getDef(id)!;
  const shown = label ? { ...def, label } : def;
  return (
    <div className="st-prop">
      <div className="st-prop-label">
        <span title={def.description ?? def.id}>{shown.label}</span>
      </div>
      <PropertyControl def={shown} value={(scopes[0] ? get(scopes[0], id) : undefined) ?? null} onChange={(v) => write(scopes, { [id]: v }, def.label)} />
    </div>
  );
}

const replay = () => window.dispatchEvent(new Event("studio:replay"));

/* ---------------- entrance ---------------- */

interface Target {
  id: string;
  label: string;
  scopes: Scope[];
}

const ENTER_TARGETS: Target[] = [
  { id: "hero", label: "Hero text", scopes: [{ component: "hero", part: "copy" }] },
  { id: "heroMedia", label: "Hero image", scopes: [{ component: "hero", part: "media" }] },
  { id: "pageHeader", label: "Page headers", scopes: [{ component: "pageHeader" }] },
  { id: "feature", label: "Features", scopes: [{ component: "feature" }] },
  { id: "card", label: "Cards", scopes: [{ component: "card" }] },
  { id: "stat", label: "Stats", scopes: [{ component: "stat" }] },
  { id: "price", label: "Prices", scopes: [{ component: "price" }] },
  { id: "media", label: "Images", scopes: [{ component: "media" }] },
  { id: "timeline", label: "Timeline items", scopes: [{ component: "timeline", part: "item" }] },
  { id: "tableRow", label: "Table rows", scopes: [{ component: "table", part: "row" }] },
];

const EFFECTS: Array<{ id: string; label: string }> = [
  { id: "fade", label: "Fade" },
  { id: "rise", label: "Rise" },
  { id: "fall", label: "Fall" },
  { id: "slide-left", label: "Slide ←" },
  { id: "slide-right", label: "Slide →" },
  { id: "zoom", label: "Grow" },
  { id: "zoom-out", label: "Settle" },
  { id: "blur", label: "Focus in" },
  { id: "flip", label: "Flip" },
  { id: "swing", label: "Swing" },
  { id: "skew", label: "Skew" },
  { id: "drop", label: "Drop" },
  { id: "clip-up", label: "Wipe up" },
  { id: "clip-right", label: "Wipe →" },
  { id: "iris", label: "Iris" },
];

/** Plays the real entrance keyframes on hover, so a tile shows exactly what it does. */
function EffectTile({ id, label, active, onPick }: { id: string; label: string; active: boolean; onPick: () => void }) {
  const box = useRef<HTMLSpanElement>(null);
  const play = () => {
    const c = { opacity: 1, x: "0px", y: "0px", scale: 1, rotate: 0, blur: 0, skew: 0, clip: "none", ...PRESETS[id] } as EnterConfig;
    box.current?.animate(enterKeyframes({ ...c, y: c.y.replace(/(-?\d+)px/, (_, n) => `${Number(n) / 2}px`), x: c.x.replace(/(-?\d+)px/, (_, n) => `${Number(n) / 2}px`) }), { duration: 700, easing: "cubic-bezier(0.22, 1, 0.36, 1)" });
  };
  return (
    <button type="button" role="radio" aria-checked={active} className="st-tile st-fx-tile" data-active={active ? "" : undefined} onPointerEnter={play} onFocus={play} onClick={onPick}>
      <span className="st-fx-stage">
        <span ref={box} className="st-fx-box" />
      </span>
      <span className="st-tile-label">{label}</span>
    </button>
  );
}

const SCENARIOS: Array<{ id: string; label: string; hint: string; patch: Patch }> = [
  { id: "calm", label: "Calm", hint: "Rise, gentle overlap", patch: { enterEffect: "rise", enterY: "16px", enterDuration: 600, enterLead: 33, enterStaggerFrom: "first", enterEasing: undefined } },
  { id: "snappy", label: "Snappy", hint: "Short and quick", patch: { enterEffect: "rise", enterY: "10px", enterDuration: 280, enterLead: 25, enterStaggerFrom: "first" } },
  { id: "cinematic", label: "Cinematic", hint: "Slow focus-in", patch: { enterEffect: "blur", enterBlur: "12px", enterDuration: 1200, enterLead: 45, enterStaggerFrom: "first" } },
  { id: "playful", label: "Playful", hint: "Springy grow", patch: { enterEffect: "zoom", enterScale: 0.85, enterDuration: 700, enterLead: 30, enterEasing: { kind: "easing", type: "spring", stiffness: 320, damping: 14, mass: 1 } } },
  { id: "one-by-one", label: "One by one", hint: "Each waits its turn", patch: { enterEffect: "rise", enterY: "12px", enterDuration: 380, enterLead: 100, enterStaggerFrom: "first" } },
  { id: "together", label: "All at once", hint: "Everything together", patch: { enterEffect: "fade", enterDuration: 500, enterLead: 0 } },
  { id: "minimal", label: "Minimal", hint: "Just a soft fade", patch: { enterEffect: "fade", enterDuration: 400, enterLead: 20 } },
  { id: "off", label: "No entrance", hint: "Content is simply there", patch: { enterEffect: "none" } },
];

function Timeline({ duration, step, order, n = 5 }: { duration: number; step: number; order: string; n?: number }) {
  const idx = (i: number) => (order === "last" ? n - 1 - i : order === "center" ? Math.abs(i - (n - 1) / 2) : order === "random" ? [2, 0, 4, 1, 3][i] : i);
  const total = Math.max(...Array.from({ length: n }, (_, i) => idx(i) * step)) + duration;
  return (
    <div className="st-timeline" aria-label="Sequence preview">
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="st-tl-row">
          <span>{i + 1}</span>
          <div className="st-tl-track">
            <i style={{ left: `${((idx(i) * step) / total) * 100}%`, width: `${(duration / total) * 100}%` }} />
          </div>
        </div>
      ))}
      <p className="st-note">
        Whole sequence: <b>{Math.round(total)} ms</b> for {n} items.
      </p>
    </div>
  );
}

function EntranceTab() {
  const { system, get } = useCascade();
  const write = useWrite();
  const setToken = useStudio((s) => s.setTokenValue);
  const [sel, setSel] = useState<string>("all");
  const isOn = (t: Target) => {
    const v = get(t.scopes[0], "enterEffect");
    return !!v && v !== "none";
  };
  const enabled = ENTER_TARGETS.filter(isOn);
  const editing = sel === "all" ? enabled : ENTER_TARGETS.filter((t) => t.id === sel);
  const scopes = editing.flatMap((t) => t.scopes);
  const at = scopes[0];
  const g = (p: string) => (at ? get(at, p) : undefined);
  const set = (patch: Patch, label: string) => write(scopes, patch, label);

  const effect = String(g("enterEffect") ?? "rise");
  const duration = ms(system, g("enterDuration"), 600);
  const leadRaw = g("enterLead");
  const lead = leadRaw === undefined || leadRaw === null ? null : numOf(leadRaw, 33);
  const stagger = ms(system, g("enterStagger"), 60);
  const cap = ms(system, g("enterCap"), 0);
  const order = String(g("enterStaggerFrom") ?? "first");
  const step = (() => {
    const s = lead !== null ? (duration * lead) / 100 : stagger;
    return cap > 0 && s * 4 > cap ? cap / 4 : s;
  })();
  const seqMode = lead === null ? "fixed" : lead === 0 ? "together" : lead >= 100 ? "one" : "overlap";

  // Travel distance: which property it maps to depends on the effect.
  const travel = (() => {
    if (effect.startsWith("slide")) return { prop: "enterX", label: "How far it slides", value: Math.abs(numOf(g("enterX"), 40)), max: 200, unit: "px", sign: effect === "slide-left" ? 1 : -1 };
    if (effect === "zoom" || effect === "zoom-out") return { prop: "enterScale", label: effect === "zoom" ? "Starts at size" : "Starts at size", value: numOf(g("enterScale"), effect === "zoom" ? 0.92 : 1.08), max: 2, unit: "×", sign: 0 };
    if (effect === "blur") return { prop: "enterBlur", label: "How blurred it starts", value: numOf(g("enterBlur"), 12), max: 40, unit: "px", sign: 1 };
    if (["rise", "fall", "flip", "skew", "drop"].includes(effect)) return { prop: "enterY", label: "How far it travels", value: Math.abs(numOf(g("enterY"), 24)), max: 200, unit: "px", sign: effect === "fall" || effect === "drop" ? -1 : 1 };
    return null;
  })();

  const pageFx = String(system.tokens["motion.page-effect"] ?? "fade");
  const pageDur = numOf(system.tokens["motion.page-duration"], 360);
  const enableDefault = () => ENTER_TARGETS.filter((t) => ["hero", "pageHeader", "feature", "card", "stat"].includes(t.id));

  return (
    <>
      <Sec title="Scenario" hint="One click sets the whole entrance: effect, speed and sequence. Fine-tune below.">
        <div className="st-tiles" style={{ ["--cols" as string]: 2 }}>
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              type="button"
              className="st-tile st-tile-row"
              onClick={() => {
                const targets = sel === "all" ? (enabled.length ? enabled : enableDefault()) : editing;
                write(
                  targets.flatMap((t) => t.scopes),
                  { ...s.patch, enterTrigger: s.id === "off" ? undefined : "inview" },
                  `scenario ${s.label}`,
                  false,
                );
                setTimeout(replay, 120);
              }}
            >
              <span className="st-tile-label">{s.label}</span>
              <span className="st-tile-hint">{s.hint}</span>
            </button>
          ))}
        </div>
      </Sec>

      <Sec title="What animates" hint="Turn entrance on or off per kind of block. Click a name to tune just that one.">
        <div className="st-targets">
          <button type="button" className="st-target-all" data-active={sel === "all" ? "" : undefined} onClick={() => setSel("all")}>
            All that animate <small>{enabled.length}</small>
          </button>
          {ENTER_TARGETS.map((t) => {
            const on = isOn(t);
            return (
              <div key={t.id} className="st-target-row" data-active={sel === t.id ? "" : undefined}>
                <button type="button" className="st-target-name" onClick={() => setSel(t.id)}>
                  {t.label}
                </button>
                <label className="st-toggle" title={on ? "Animates" : "No entrance"}>
                  <input
                    type="checkbox"
                    checked={on}
                    aria-label={`${t.label} entrance`}
                    onChange={(e) => {
                      const model = enabled.find((x) => x !== t);
                      const base: Patch = model
                        ? Object.fromEntries(["enterEffect", "enterY", "enterX", "enterScale", "enterBlur", "enterDuration", "enterEasing", "enterLead", "enterStaggerFrom", "enterTrigger"].map((p) => [p, get(model.scopes[0], p)]))
                        : { enterEffect: "rise", enterY: "16px", enterDuration: 600, enterLead: 33 };
                      write(t.scopes, e.target.checked ? base : { enterEffect: "none" }, `${t.label} entrance ${e.target.checked ? "on" : "off"}`, false);
                    }}
                  />
                  <span />
                </label>
              </div>
            );
          })}
        </div>
      </Sec>

      {scopes.length ? (
        <>
          <Sec title="Look" hint={sel === "all" ? "Applies to everything that animates." : `Only ${editing[0]?.label}.`} aside={<button type="button" className="st-btn st-btn-ghost" onClick={replay}><Icon name="play" /> Replay</button>}>
            <div className="st-tiles" role="radiogroup" aria-label="Entrance effect" style={{ ["--cols" as string]: 3 }}>
              {EFFECTS.map((e) => (
                <EffectTile key={e.id} id={e.id} label={e.label} active={effect === e.id} onPick={() => (set({ enterEffect: e.id }, "effect"), setTimeout(replay, 80))} />
              ))}
            </div>
            {travel ? (
              <Slider
                label={travel.label}
                value={travel.value}
                min={travel.prop === "enterScale" ? 0.3 : 0}
                max={travel.max}
                step={travel.prop === "enterScale" ? 0.01 : 1}
                unit={travel.unit}
                onChange={(v) => set({ [travel.prop]: travel.prop === "enterScale" ? v : `${travel.sign < 0 ? -v : v}px` }, travel.label)}
              />
            ) : null}
            <Slider label="Duration" value={duration} min={80} max={2400} step={10} unit=" ms" onChange={(v) => set({ enterDuration: v }, "duration")} />
            <Prop id="enterEasing" scopes={scopes} label="Easing" />
          </Sec>

          <Sec title="Sequence" hint="When several items appear together, how do they follow each other?">
            <Seg
              label="Sequence"
              value={seqMode}
              options={[
                { id: "together", label: "All at once" },
                { id: "overlap", label: "Overlap" },
                { id: "one", label: "One by one" },
                { id: "fixed", label: "Fixed gap" },
              ]}
              onChange={(m) => set(m === "together" ? { enterLead: 0 } : m === "overlap" ? { enterLead: 33 } : m === "one" ? { enterLead: 100 } : { enterLead: undefined, enterStagger: 80 }, "sequence")}
            />
            {lead !== null ? (
              <Slider label="Next one starts after" value={lead} min={0} max={150} step={1} format={(v) => (v === 0 ? "together" : `${v}% of the previous`)} onChange={(v) => set({ enterLead: v }, "overlap")} />
            ) : (
              <Slider label="Gap between starts" value={stagger} min={0} max={600} step={5} unit=" ms" onChange={(v) => set({ enterStagger: v }, "gap")} />
            )}
            <Timeline duration={duration} step={step} order={order} />
            <Row label="Order">
              <Seg
                label="Order"
                value={order}
                options={[
                  { id: "first", label: "First → last" },
                  { id: "last", label: "Last → first" },
                  { id: "center", label: "Centre out" },
                  { id: "random", label: "Random" },
                ]}
                onChange={(v) => set({ enterStaggerFrom: v }, "order")}
              />
            </Row>
            <Row label="Items share one sequence when they are…">
              <Seg
                label="Sequence across"
                value={String(g("enterGroup") ?? "siblings")}
                options={[
                  { id: "siblings", label: "In the same group", title: "Items with the same parent cascade together" },
                  { id: "section", label: "In the same section", title: "Everything revealed inside one section follows one sequence" },
                  { id: "none", label: "Each on its own", title: "No sequence: each item animates by itself" },
                ]}
                onChange={(v) => set({ enterGroup: v }, "group")}
              />
            </Row>
            <Slider label="Longest sequence" value={cap} min={0} max={4000} step={50} format={(v) => (v === 0 ? "no limit" : `${v} ms`)} onChange={(v) => set({ enterCap: v || undefined }, "cap")} />
          </Sec>

          <Sec title="When" hint="What starts the entrance.">
            <Seg
              label="Trigger"
              value={String(g("enterTrigger") ?? "inview")}
              options={[
                { id: "inview", label: "When scrolled into view" },
                { id: "load", label: "As the page opens" },
              ]}
              onChange={(v) => set({ enterTrigger: v }, "trigger")}
            />
            {String(g("enterTrigger") ?? "inview") === "inview" ? (
              <Slider label="How much must be visible" value={Math.round(numOf(g("enterThreshold"), 0.15) * 100)} min={0} max={100} step={5} unit="%" onChange={(v) => set({ enterThreshold: v / 100 }, "threshold")} />
            ) : null}
            <Seg
              label="Repeat"
              value={String(g("enterOnce") ?? "once")}
              options={[
                { id: "once", label: "Only the first time" },
                { id: "every", label: "Every time it enters" },
              ]}
              onChange={(v) => set({ enterOnce: v }, "repeat")}
            />
          </Sec>
        </>
      ) : (
        <p className="st-note">Nothing animates yet. Pick a scenario above or switch a block on.</p>
      )}

      <Sec title="Page change" hint="How a whole page appears when you move between pages.">
        <Seg
          label="Page transition"
          value={pageFx}
          options={["none", "fade", "rise", "slide", "zoom", "blur"].map((v) => ({ id: v, label: v === "none" ? "None" : v[0].toUpperCase() + v.slice(1) }))}
          onChange={(v) => setToken("motion.page-effect", v)}
        />
        <Slider label="Page duration" value={pageDur} min={0} max={1200} step={10} unit=" ms" onChange={(v) => setToken("motion.page-duration", v)} />
      </Sec>
    </>
  );
}

/* ---------------- open & close ---------------- */

const POPUPS: Array<Target & { note?: string; fixedEffect?: boolean }> = [
  { id: "dialog", label: "Dialogs", scopes: [{ component: "dialog", part: "panel" }] },
  { id: "drawer", label: "Drawers", scopes: [{ component: "drawer", part: "panel" }], fixedEffect: true, note: "Drawers always slide in from their own edge; speed and closing are yours." },
  { id: "popover", label: "Popovers", scopes: [{ component: "popover" }] },
  { id: "dropdown", label: "Menus", scopes: [{ component: "dropdown" }] },
  { id: "select", label: "Select lists", scopes: [{ component: "select", part: "content" }], note: "Select lists animate when they open; they close instantly." },
  { id: "tooltip", label: "Tooltips", scopes: [{ component: "tooltip" }] },
  { id: "toast", label: "Toasts", scopes: [{ component: "toast" }] },
  { id: "commandPalette", label: "Command palette", scopes: [{ component: "commandPalette", part: "panel" }] },
];
const BACKDROPS: Scope[] = [
  { component: "dialog", part: "overlay" },
  { component: "drawer", part: "overlay" },
  { component: "commandPalette", part: "overlay" },
];
const MENU_ITEMS: Scope[] = [
  { component: "dropdown", part: "item" },
  { component: "select", part: "item" },
  { component: "commandPalette", part: "item" },
];

const OPEN_FX = [
  { id: "fade", label: "Fade" },
  { id: "pop", label: "Pop" },
  { id: "rise", label: "Rise" },
  { id: "fall", label: "Drop down" },
  { id: "zoom", label: "Grow" },
  { id: "blur", label: "Focus in" },
  { id: "flip", label: "Flip" },
  { id: "none", label: "Instant" },
];
const CLOSE_FX = [
  { id: "mirror", label: "Reverse" },
  { id: "fade", label: "Fade" },
  { id: "shrink", label: "Shrink" },
  { id: "sink", label: "Sink" },
  { id: "none", label: "Instant" },
];

function OpenCloseTab() {
  const { system, get } = useCascade();
  const write = useWrite();
  const [sel, setSel] = useState<string>("all");
  const targets = sel === "all" ? POPUPS : POPUPS.filter((p) => p.id === sel);
  const scopes = targets.flatMap((t) => t.scopes);
  const effectScopes = targets.filter((t) => !t.fixedEffect).flatMap((t) => t.scopes);
  const at = targets[0].scopes[0];
  const g = (p: string) => get(at, p);
  const set = (patch: Patch, label: string, sc = scopes) => write(sc, patch, label);
  const openFx = String(get(effectScopes[0] ?? at, "openEffect") ?? "pop");
  const openDur = ms(system, g("openDuration"), 200);
  const closeFx = String(g("closeEffect") ?? "mirror");
  const closeSpeed = numOf(g("closeSpeed"), 1.6);
  const distance = numOf(get(effectScopes[0] ?? at, "openDistance"), 6);
  const itemsOn = (() => {
    const v = get(MENU_ITEMS[0], "enterEffect");
    return !!v && v !== "none";
  })();
  const note = targets.length === 1 ? targets[0].note : undefined;

  return (
    <>
      <Sec title="Which pop-ups" hint="Tune all of them together, or one kind on its own. Try them on the canvas.">
        <div className="st-pills" role="radiogroup" aria-label="Pop-up kind">
          <button type="button" className="st-pill" role="radio" aria-checked={sel === "all"} data-active={sel === "all" ? "" : undefined} onClick={() => setSel("all")}>
            All pop-ups
          </button>
          {POPUPS.map((p) => (
            <button key={p.id} type="button" className="st-pill" role="radio" aria-checked={sel === p.id} data-active={sel === p.id ? "" : undefined} onClick={() => setSel(p.id)}>
              {p.label}
            </button>
          ))}
        </div>
        {note ? <p className="st-note">{note}</p> : null}
      </Sec>

      <Sec title="Opening">
        {effectScopes.length ? (
          <div className="st-tiles" role="radiogroup" aria-label="Open animation" style={{ ["--cols" as string]: 4 }}>
            {OPEN_FX.map((f) => (
              <button key={f.id} type="button" role="radio" aria-checked={openFx === f.id} className="st-tile" data-active={openFx === f.id ? "" : undefined} onClick={() => set({ openEffect: f.id }, "open effect", effectScopes)}>
                <span className="st-tile-label">{f.label}</span>
              </button>
            ))}
          </div>
        ) : null}
        <Slider label="Open duration" value={openDur} min={60} max={900} step={10} unit=" ms" onChange={(v) => set({ openDuration: v }, "open duration")} />
        {effectScopes.length && ["pop", "rise", "fall", "flip"].includes(openFx) ? (
          <Slider label="Travel distance" value={distance} min={0} max={48} step={1} unit=" px" onChange={(v) => set({ openDistance: `${v}px` }, "distance", effectScopes)} />
        ) : null}
        <Prop id="openEasing" scopes={scopes} label="Open easing" />
      </Sec>

      <Sec title="Closing" hint="Closing clears the way, so it should be quicker than opening.">
        <div className="st-tiles" role="radiogroup" aria-label="Close animation" style={{ ["--cols" as string]: 5 }}>
          {CLOSE_FX.map((f) => (
            <button key={f.id} type="button" role="radio" aria-checked={closeFx === f.id} className="st-tile" data-active={closeFx === f.id ? "" : undefined} onClick={() => set({ closeEffect: f.id }, "close effect")}>
              <span className="st-tile-label">{f.label}</span>
            </button>
          ))}
        </div>
        <Slider label="Close speed" value={closeSpeed} min={0.5} max={4} step={0.1} format={(v) => `${Math.round(v * 10) / 10}× faster · ${Math.round(openDur / v)} ms`} onChange={(v) => set({ closeSpeed: v }, "close speed")} />
        <Prop id="closeEasing" scopes={scopes} label="Close easing" />
      </Sec>

      <Sec title="Backdrop and contents">
        <Slider label="Backdrop fade" value={ms(system, get(BACKDROPS[0], "openDuration"), 200)} min={0} max={900} step={10} unit=" ms" onChange={(v) => write(BACKDROPS, { openDuration: v }, "backdrop fade")} />
        <label className="st-check-row">
          <span>
            <b>Menu items open one by one</b>
            <small>Rows in menus, select lists and the command palette cascade in after the panel.</small>
          </span>
          <span className="st-toggle">
            <input
              type="checkbox"
              checked={itemsOn}
              aria-label="Menu items open one by one"
              onChange={(e) => write(MENU_ITEMS, e.target.checked ? { enterEffect: "rise", enterY: "6px", enterDuration: 220, enterLead: 33, enterCap: 240, enterTrigger: "load", enterOnce: "every" } : { enterEffect: "none" }, "menu items cascade", false)}
            />
            <span />
          </span>
        </label>
      </Sec>
    </>
  );
}

/* ---------------- interactive ---------------- */

const HOVER: Array<{ id: string; label: string; hint: string; hover: Patch; root: Patch }> = [
  { id: "none", label: "None", hint: "Colour change only", hover: { translateY: undefined, scale: undefined, shadow: undefined }, root: { fxTilt: undefined, fxMagnetic: undefined, fxSpotlight: undefined } },
  { id: "lift", label: "Lift", hint: "Rises with a shadow", hover: { translateY: "-2px", scale: undefined, shadow: "{shadow.3}" }, root: { fxTilt: undefined, fxMagnetic: undefined, fxSpotlight: undefined } },
  { id: "grow", label: "Grow", hint: "Gets a little bigger", hover: { translateY: undefined, scale: 1.03, shadow: undefined }, root: { fxTilt: undefined, fxMagnetic: undefined, fxSpotlight: undefined } },
  {
    id: "glow",
    label: "Glow",
    hint: "Soft accent glow",
    hover: { translateY: undefined, scale: undefined, shadow: { kind: "shadow", layers: [{ x: 0, y: 0, blur: 22, spread: 0, color: "color-mix(in oklch, var(--n-color-accent) 45%, transparent)" }] } },
    root: { fxTilt: undefined, fxMagnetic: undefined, fxSpotlight: undefined },
  },
  { id: "sink", label: "Sink", hint: "Settles down a bit", hover: { translateY: "1px", scale: undefined, shadow: undefined }, root: { fxTilt: undefined, fxMagnetic: undefined, fxSpotlight: undefined } },
  { id: "tilt", label: "3D tilt", hint: "Leans toward the cursor", hover: { translateY: undefined, scale: undefined, shadow: undefined }, root: { fxTilt: 8, fxTiltGlare: 0.3, fxMagnetic: undefined, fxSpotlight: undefined } },
  { id: "magnetic", label: "Magnetic", hint: "Follows the cursor", hover: { translateY: undefined, scale: undefined, shadow: undefined }, root: { fxMagnetic: 0.35, fxTilt: undefined, fxSpotlight: undefined } },
  { id: "spotlight", label: "Spotlight", hint: "Light under the cursor", hover: { translateY: undefined, scale: undefined, shadow: undefined }, root: { fxSpotlight: "on", fxTilt: undefined, fxMagnetic: undefined } },
];

function InteractiveTab() {
  const { get } = useCascade();
  const write = useWrite();
  const set = useStudio((s) => s.set);
  const setScope = useStudio((s) => s.setScope);
  const [sel, setSel] = useState(INTERACTIVE_TARGETS[0].id);
  const t = INTERACTIVE_TARGETS.find((x) => x.id === sel)!;
  const root: Scope = { component: t.component, variant: t.variant };
  const hover: Scope = { ...root, state: "hover" };
  const activeHover = (() => {
    if (get(root, "fxTilt")) return "tilt";
    if (get(root, "fxMagnetic")) return "magnetic";
    if (get(root, "fxSpotlight") === "on") return "spotlight";
    const here = findRule(useStudio.getState().system, hover)?.props ?? {};
    if (here.scale) return "grow";
    if (typeof here.shadow === "object" && here.shadow) return "glow";
    if (here.translateY === "1px") return "sink";
    if (here.translateY) return "lift";
    return "none";
  })();
  const press = numOf(get(root, "fxPressScale"), 1);
  const ripple = get(root, "fxRipple") === "on";
  const def = getComponent(t.component);

  return (
    <>
      <Sec title="Which element" hint="Each kind reacts on its own. The canvas shows every state side by side.">
        <div className="st-pills" role="radiogroup" aria-label="Element">
          {INTERACTIVE_TARGETS.map((x) => (
            <button key={x.id} type="button" className="st-pill" role="radio" aria-checked={sel === x.id} data-active={sel === x.id ? "" : undefined} onClick={() => setSel(x.id)}>
              {x.label}
            </button>
          ))}
        </div>
      </Sec>
      <Sec title="On hover" hint="What happens when the pointer is over it.">
        <div className="st-tiles" role="radiogroup" aria-label="Hover effect" style={{ ["--cols" as string]: 2 }}>
          {HOVER.map((h) => (
            <button
              key={h.id}
              type="button"
              role="radio"
              aria-checked={activeHover === h.id}
              className="st-tile st-tile-row"
              data-active={activeHover === h.id ? "" : undefined}
              onClick={() => {
                const sys = writeAll(writeAll(useStudio.getState().system, [hover], h.hover), [root], h.root);
                useStudio.getState().commit(sys, `motion · ${t.label} hover ${h.label}`);
              }}
            >
              <span className="st-tile-label">{h.label}</span>
              <span className="st-tile-hint">{h.hint}</span>
            </button>
          ))}
        </div>
      </Sec>
      <Sec title="On press" hint="Feedback the moment it is clicked or tapped.">
        <Slider label="Shrinks to" value={press} min={0.85} max={1} step={0.005} format={(v) => (v >= 1 ? "no shrink" : `${Math.round(v * 1000) / 10}%`)} onChange={(v) => write([root], { fxPressScale: v >= 1 ? undefined : v }, `${t.label} press`)} />
        <label className="st-check-row">
          <span>
            <b>Ripple</b>
            <small>A soft wave spreads from where it was pressed.</small>
          </span>
          <span className="st-toggle">
            <input type="checkbox" checked={ripple} aria-label="Ripple" onChange={(e) => write([root], { fxRipple: e.target.checked ? "on" : undefined }, `${t.label} ripple`, false)} />
            <span />
          </span>
        </label>
      </Sec>
      <Sec title="Timing" hint="How fast colours, shadows and movement change between states.">
        <Prop id="transitionDuration" scopes={[root]} label="Change duration" />
        <Prop id="transitionEasing" scopes={[root]} label="Change easing" />
      </Sec>
      <Sec title="Pointer extras">
        <Prop id="fxCursor" scopes={[root]} label="Custom cursor" />
        <Prop id="fxMagnetic" scopes={[root]} label="Magnetic pull" />
        <Prop id="fxTilt" scopes={[root]} label="3D tilt" />
      </Sec>
      {def ? (
        <button
          type="button"
          className="st-btn st-btn-ghost st-wide"
          onClick={() => {
            setScope({ component: t.component, variant: t.variant, state: "hover" });
            set({ panel: "edit", panelOpen: true });
          }}
        >
          Edit every detail of {t.label.toLowerCase()} (focus, loading…) <Icon name="arrow-right" />
        </button>
      ) : null}
    </>
  );
}

/* ---------------- loops ---------------- */

const AMBIENT = ["none", "float", "breathe", "pulse", "glow", "wiggle", "bounce", "spin", "shimmer"];
const AMBIENT_TARGETS = ["badge", "button", "iconButton", "card", "feature", "avatar", "media", "stat", "heading"];

function LoopsTab() {
  const { system, get } = useCascade();
  const write = useWrite();
  const set = useStudio((s) => s.set);
  const setToken = useStudio((s) => s.setTokenValue);
  const loopScopes: Scope[] = LOOP_TYPES.filter((x) => getComponent(x)?.category === "loops").map((component) => ({ component }));
  const speed = numOf(system.tokens["motion.loop-speed"], 1);
  const pause = loopScopes.length ? get(loopScopes[0], "loopPauseOnHover") === "yes" : false;
  const always = loopScopes.length ? get(loopScopes[0], "loopPlay") === "always" : false;
  const [amb, setAmb] = useState(AMBIENT_TARGETS[0]);
  const ambScope: Scope = { component: amb };
  const ambFx = String(get(ambScope, "ambientEffect") ?? "none");

  return (
    <>
      <Sec title="All loops" hint="Applies to every loop component on every page.">
        <Slider label="Loop speed" value={speed} min={0.1} max={3} step={0.05} format={(v) => `${Math.round(v * 100) / 100}×`} onChange={(v) => setToken("motion.loop-speed", v)} />
        <label className="st-check-row">
          <span>
            <b>Pause on hover</b>
            <small>Loops hold still while the pointer is over them, so people can read.</small>
          </span>
          <span className="st-toggle">
            <input type="checkbox" checked={pause} aria-label="Pause loops on hover" onChange={(e) => write(loopScopes, { loopPauseOnHover: e.target.checked ? "yes" : "no" }, "loops pause on hover", false)} />
            <span />
          </span>
        </label>
        <label className="st-check-row">
          <span>
            <b>Keep playing off screen</b>
            <small>Off by default: loops rest while nobody can see them, which saves battery.</small>
          </span>
          <span className="st-toggle">
            <input type="checkbox" checked={always} aria-label="Keep loops playing off screen" onChange={(e) => write(loopScopes, { loopPlay: e.target.checked ? "always" : undefined }, "loops off screen", false)} />
            <span />
          </span>
        </label>
        <p className="st-note">People who ask their device for less motion see every loop at rest.</p>
      </Sec>

      <Sec title="Loop components" hint="Open one to edit its length, direction, intensity and look.">
        <div className="st-list-tight">
          {LOOP_TYPES.map((type) => {
            const c = getComponent(type);
            if (!c) return null;
            return (
              <button key={type} type="button" className="st-item" onClick={() => set({ page: `${COMPONENTS_PATH}/${type}`, instances: [] })}>
                <span className="st-item-main">
                  <b>{c.label}</b>
                  <small>{c.description}</small>
                </span>
                <Icon name="arrow-right" />
              </button>
            );
          })}
        </div>
      </Sec>

      <Sec title="Make anything breathe" hint="A gentle ambient loop on any kind of element.">
        <select className="st-in" aria-label="Element" value={amb} onChange={(e) => setAmb(e.target.value)}>
          {AMBIENT_TARGETS.map((x) => (
            <option key={x} value={x}>
              {getComponent(x)?.label ?? x}
            </option>
          ))}
        </select>
        <div className="st-tiles" role="radiogroup" aria-label="Ambient loop" style={{ ["--cols" as string]: 3 }}>
          {AMBIENT.map((a) => (
            <button
              key={a}
              type="button"
              role="radio"
              aria-checked={ambFx === a}
              className="st-tile"
              data-active={ambFx === a ? "" : undefined}
              onClick={() => write([ambScope], a === "none" ? { ambientEffect: undefined, ambientDuration: undefined, ambientIterations: undefined } : { ambientEffect: a, ambientDuration: a === "spin" ? 6000 : 3200, ambientIterations: "infinite", ambientEasing: a === "spin" || a === "shimmer" ? "{easing.linear}" : "{easing.emphasized}" }, `ambient ${a}`, false)}
            >
              <span className="st-tile-label">{a === "none" ? "None" : a[0].toUpperCase() + a.slice(1)}</span>
            </button>
          ))}
        </div>
        {ambFx !== "none" ? (
          <>
            <Prop id="ambientDuration" scopes={[ambScope]} label="One cycle" />
            <Prop id="ambientAmplitude" scopes={[ambScope]} label="Strength" />
          </>
        ) : null}
      </Sec>
    </>
  );
}

/* ---------------- shell ---------------- */

export function motionTabOf(page: string): MotionTab {
  const m = page.match(/^\/preview\/motion-studio\/([^/?#]+)/);
  const id = m?.[1];
  return (MOTION_TABS.find((t) => t.id === id)?.id ?? "entrance") as MotionTab;
}

export function MotionPanel() {
  const page = useStudio((s) => s.page);
  const set = useStudio((s) => s.set);
  const speed = useStudio((s) => s.speed);
  const system = useStudio((s) => s.system);
  const setToken = useStudio((s) => s.setTokenValue);
  const tab = page.startsWith(MOTION_PATH) ? motionTabOf(page) : "entrance";
  const master = numOf(system.tokens["motion.speed"], 1);
  const reduce = String(system.tokens["motion.reduce"] ?? "system");
  return (
    <div className="st-panel-body">
      <div className="st-panel-intro">
        <h2>Motion</h2>
        <p>Every movement in one place: how things appear, how pop-ups open and close, how elements react, and what loops on its own.</p>
        <div className="st-motion-tabs" role="tablist" aria-label="Kind of motion">
          {MOTION_TABS.map((t) => (
            <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} data-active={tab === t.id ? "" : undefined} onClick={() => set({ page: `${MOTION_PATH}/${t.id}`, instances: [] })}>
              <b>{t.label}</b>
              <small>{t.hint}</small>
            </button>
          ))}
        </div>
      </div>
      {tab === "entrance" ? <EntranceTab /> : tab === "open-close" ? <OpenCloseTab /> : tab === "interactive" ? <InteractiveTab /> : <LoopsTab />}
      <Sec title="Everything" hint="Master controls for all motion in this system.">
        <Slider label="Master speed" value={master} min={0.25} max={3} step={0.05} format={(v) => `${Math.round(v * 100) / 100}× ${v > 1 ? "(faster)" : v < 1 ? "(slower)" : ""}`} onChange={(v) => setToken("motion.speed", v)} />
        <Row label="People who prefer less motion">
          <Seg
            label="Reduced motion"
            value={reduce}
            options={[
              { id: "system", label: "Follow their device" },
              { id: "always", label: "Always calm" },
              { id: "never", label: "Ignore" },
            ]}
            onChange={(v) => setToken("motion.reduce", v)}
          />
        </Row>
        <Row label="Preview only (not saved)">
          <Seg
            label="Preview speed"
            value={String(speed)}
            options={[
              { id: "0.25", label: "¼ slow-mo" },
              { id: "0.5", label: "½" },
              { id: "1", label: "Normal" },
            ]}
            onChange={(v) => set({ speed: Number(v), motionOff: false })}
          />
        </Row>
      </Sec>
    </div>
  );
}
