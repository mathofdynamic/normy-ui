"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/normy/icon";
import { explain, orderRules, scopeKey } from "@/engine/cascade";
import { COMPONENTS, getComponent, partLabel } from "@/engine/components";
import { GROUPS, propsFor } from "@/engine/registry";
import { findRule } from "@/engine/system";
import { BREAKPOINTS, type Category, type ComponentDef, type GroupId, type PropertyDef, type Scope, type StateName, type Value } from "@/engine/types";
import { PropertyControl } from "./controls";
import { Inspector, matchSearch } from "./inspector";
import { useStudio } from "./store";

/* ------------------------------------------------------------------ *
 * Edit panel — click something in the preview, change how it looks.
 * Plain language on top ("Every button / Only primary / Just this one",
 * Default / Hover / Pressed), a short list of essential properties, and
 * the complete registry one click away. "Advanced" is the full cascade
 * inspector, unchanged.
 * ------------------------------------------------------------------ */

const CATS: Array<{ id: Category; label: string }> = [
  { id: "actions", label: "Buttons & actions" },
  { id: "forms", label: "Forms" },
  { id: "navigation", label: "Navigation" },
  { id: "data", label: "Data display" },
  { id: "typography", label: "Text" },
  { id: "layout", label: "Layout" },
  { id: "overlay", label: "Overlays" },
  { id: "feedback", label: "Feedback" },
  { id: "media", label: "Media & motion" },
  { id: "blocks", label: "Page sections" },
];

export const STATE_LABEL: Record<StateName, string> = {
  hover: "Hover",
  focus: "Focus",
  active: "Pressed",
  disabled: "Disabled",
  loading: "Loading",
  selected: "Selected",
  error: "Error",
  open: "Open",
  current: "Current",
  dragging: "Dragging",
};

/** The short list. Order matters: it is the order people reach for things. */
const ESSENTIALS: Array<{ title: string; icon: Parameters<typeof Icon>[0]["name"]; props: string[] }> = [
  { title: "Colour", icon: "palette", props: ["bg", "color", "borderColor", "iconColor", "gradient"] },
  { title: "Shape", icon: "box", props: ["radius", "borderWidth", "borderStyle"] },
  { title: "Text", icon: "edit", props: ["fontFamily", "fontSize", "fontWeight", "letterSpacing", "textTransform", "lineHeight"] },
  { title: "Spacing & size", icon: "layout", props: ["paddingX", "paddingY", "padding", "gap", "minHeight", "maxWidth"] },
  { title: "Depth & effects", icon: "layers", props: ["shadow", "opacity", "backdropBlur"] },
  { title: "Motion", icon: "zap", props: ["transitionDuration", "enterEffect", "fxPressScale", "fxMagnetic", "fxTilt"] },
];

const SMALL_CONTROLS = new Set<Category>(["actions", "forms", "feedback"]);

/* ---------------- one property row ---------------- */

function PropRow({ def, scope, ordered, scopeName }: { def: PropertyDef; scope: Scope; ordered: ReturnType<typeof orderRules>; scopeName: string }) {
  const system = useStudio((s) => s.system);
  const setPropAt = useStudio((s) => s.setPropAt);
  const here = findRule(system, scope)?.props[def.id];
  const ex = explain(ordered, scope, def.id);
  const isHere = here !== undefined;
  const value: Value = isHere ? here : (ex.value ?? null);
  return (
    <div className="st-prop" data-inherited={!isHere ? "" : undefined} data-set={isHere ? "" : undefined}>
      <div className="st-prop-label">
        <span title={def.description ?? def.id}>{def.label}</span>
        {isHere ? (
          <button type="button" className="st-reset" onClick={() => setPropAt(def.id, undefined)} title={`Changed for ${scopeName}. Click to reset.`} aria-label={`Reset ${def.label}`}>
            <span className="st-dot" /> reset
          </button>
        ) : null}
      </div>
      <PropertyControl def={def} value={value} onChange={(v) => setPropAt(def.id, v)} />
    </div>
  );
}

/* ---------------- browse (nothing selected) ---------------- */

function Browse() {
  const system = useStudio((s) => s.system);
  const pageComponents = useStudio((s) => s.pageComponents);
  const inspect = useStudio((s) => s.inspect);
  const set = useStudio((s) => s.set);
  const setScope = useStudio((s) => s.setScope);
  const [q, setQ] = useState("");
  const [all, setAll] = useState(false);
  const hasPage = Object.keys(pageComponents).length > 0;
  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const r of system.rules) if (r.scope.component) m[r.scope.component] = (m[r.scope.component] ?? 0) + Object.keys(r.props).length;
    return m;
  }, [system]);
  const list = COMPONENTS.filter((c) => (!q || `${c.label} ${c.type} ${c.description}`.toLowerCase().includes(q.toLowerCase())) && (all || !hasPage || q || pageComponents[c.type]));
  return (
    <div className="st-panel-body">
      <div className="st-panel-intro">
        <h2>Edit</h2>
        <p>Click anything in the preview to change how it looks — or pick a component below.</p>
        <button type="button" className="st-hero-btn" data-active={inspect ? "" : undefined} onClick={() => set({ inspect: !inspect })}>
          <Icon name="cursor" />
          <span>
            <b>{inspect ? "Selecting — click an element" : "Select an element"}</b>
            <small>{inspect ? "Press Esc to interact with the page instead" : "Shortcut: I"}</small>
          </span>
        </button>
        <label className="st-search">
          <Icon name="search" />
          <input placeholder="Find a component…" aria-label="Find component" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        {hasPage ? (
          <div className="st-seg st-seg-sm" role="radiogroup" aria-label="Which components">
            <button type="button" role="radio" aria-checked={!all} data-active={!all ? "" : undefined} onClick={() => setAll(false)}>
              On this page
            </button>
            <button type="button" role="radio" aria-checked={all} data-active={all ? "" : undefined} onClick={() => setAll(true)}>
              All {COMPONENTS.length}
            </button>
          </div>
        ) : null}
      </div>
      {CATS.map((cat) => {
        const items = list.filter((c) => c.category === cat.id);
        if (!items.length) return null;
        return (
          <section key={cat.id} className="st-sec st-sec-list">
            <h4 className="st-list-title">{cat.label}</h4>
            {items.map((c) => (
              <button
                key={c.type}
                type="button"
                className="st-item"
                onClick={() => {
                  setScope({ component: c.type });
                  set({ picked: null });
                  window.dispatchEvent(new CustomEvent("studio:highlight", { detail: { component: c.type, label: `Every ${c.label.toLowerCase()}`, scroll: true } }));
                }}
              >
                <span className="st-item-main">
                  <b>{c.label}</b>
                  <small>{c.description}</small>
                </span>
                {counts[c.type] ? <span className="st-count" title="Customised properties">{counts[c.type]}</span> : <Icon name="arrow-right" />}
              </button>
            ))}
          </section>
        );
      })}
    </div>
  );
}

/* ---------------- editor (something selected) ---------------- */

function Target({ def }: { def: ComponentDef }) {
  const scope = useStudio((s) => s.scope);
  const picked = useStudio((s) => s.picked);
  const system = useStudio((s) => s.system);
  const instances = useStudio((s) => s.instances);
  const patch = useStudio((s) => s.patchScope);
  const variants = [...def.variants, ...(system.components[def.type]?.variants ?? [])];
  const instance = scope.instance ?? (picked?.component === def.type ? picked.instance : undefined);
  const variant = scope.variant ?? (picked?.component === def.type ? picked.variant : undefined) ?? def.defaultVariant;
  const plural = def.label.endsWith("s") ? def.label : `${def.label}s`;
  const which = scope.instance ? "one" : scope.variant ? "variant" : "all";
  const hasInstance = !!instance || instances.some((i) => i.component === def.type);
  return (
    <div className="st-target">
      <span className="st-label">Apply changes to</span>
      <div className="st-choices">
        <button type="button" className="st-choice" data-active={which === "all" ? "" : undefined} onClick={() => patch({ variant: undefined, instance: undefined })}>
          <b>Every {def.label.toLowerCase()}</b>
          <small>All {plural.toLowerCase()} on every page</small>
        </button>
        {variants.length ? (
          <div className="st-choice" data-active={which === "variant" ? "" : undefined}>
            <button type="button" className="st-choice-hit" onClick={() => patch({ variant: variant ?? variants[0], instance: undefined })}>
              <b>Only one style</b>
              <small>Just the “{scope.variant ?? variant ?? variants[0]}” {plural.toLowerCase()}</small>
            </button>
            {which === "variant" ? (
              <select className="st-in" aria-label="Variant" value={scope.variant} onChange={(e) => patch({ variant: e.target.value })}>
                {variants.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            ) : null}
          </div>
        ) : null}
        {hasInstance ? (
          <div className="st-choice" data-active={which === "one" ? "" : undefined}>
            <button
              type="button"
              className="st-choice-hit"
              onClick={() => patch({ instance: instance ?? instances.find((i) => i.component === def.type)?.id, variant: undefined })}
            >
              <b>Just this one</b>
              <small>{instance ? `The ${def.label.toLowerCase()} you clicked (#${instance})` : "One specific element on this page"}</small>
            </button>
            {which === "one" ? (
              <select className="st-in" aria-label="Instance" value={scope.instance} onChange={(e) => patch({ instance: e.target.value })}>
                {instances
                  .filter((i) => i.component === def.type)
                  .map((i) => (
                    <option key={i.id} value={i.id}>
                      #{i.id}
                    </option>
                  ))}
              </select>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Conditions({ def }: { def: ComponentDef }) {
  const scope = useStudio((s) => s.scope);
  const patch = useStudio((s) => s.patchScope);
  const parts = Object.keys(def.parts).filter((p) => p !== "root");
  const [more, setMore] = useState(!!(scope.bp || scope.mode || scope.size));
  return (
    <>
      {parts.length ? (
        <div className="st-field-block">
          <span className="st-label">Part</span>
          <div className="st-pills" role="radiogroup" aria-label="Part">
            <button type="button" role="radio" aria-checked={!scope.part} data-active={!scope.part ? "" : undefined} onClick={() => patch({ part: undefined })}>
              Whole {def.label.toLowerCase()}
            </button>
            {parts.map((p) => (
              <button key={p} type="button" role="radio" aria-checked={scope.part === p} data-active={scope.part === p ? "" : undefined} onClick={() => patch({ part: p })}>
                {partLabel(def, p)}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {def.states.length ? (
        <div className="st-field-block">
          <span className="st-label">State</span>
          <div className="st-tabs" role="tablist" aria-label="State">
            <button type="button" role="tab" aria-selected={!scope.state} data-active={!scope.state ? "" : undefined} onClick={() => patch({ state: undefined })}>
              Default
            </button>
            {def.states.map((s) => (
              <button key={s} type="button" role="tab" aria-selected={scope.state === s} data-active={scope.state === s ? "" : undefined} onClick={() => patch({ state: s })}>
                {STATE_LABEL[s]}
              </button>
            ))}
          </div>
          {scope.state ? <p className="st-note">The preview is frozen in “{STATE_LABEL[scope.state]}” so you can see it while editing.</p> : null}
        </div>
      ) : null}
      <button type="button" className="st-link st-more" aria-expanded={more} onClick={() => setMore(!more)}>
        {more ? "Hide" : "Only on…"} screen size, colour mode{def.sizes.length ? ", size" : ""}
      </button>
      {more ? (
        <div className="st-more-grid">
          <label>
            <span className="st-label">Screen</span>
            <select className="st-in" value={scope.bp ?? ""} onChange={(e) => patch({ bp: (e.target.value || undefined) as Scope["bp"] })} aria-label="Screen size">
              <option value="">Any screen</option>
              {BREAKPOINTS.map((b) => (
                <option key={b} value={b}>
                  {b} and wider
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="st-label">Mode</span>
            <select className="st-in" value={scope.mode ?? ""} onChange={(e) => patch({ mode: (e.target.value || undefined) as Scope["mode"] })} aria-label="Colour mode">
              <option value="">Light & dark</option>
              <option value="light">Light only</option>
              <option value="dark">Dark only</option>
            </select>
          </label>
          {def.sizes.length ? (
            <label>
              <span className="st-label">Size</span>
              <select className="st-in" value={scope.size ?? ""} onChange={(e) => patch({ size: e.target.value || undefined })} aria-label="Size">
                <option value="">All sizes</option>
                {def.sizes.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

function Editor({ def }: { def: ComponentDef }) {
  const system = useStudio((s) => s.system);
  const scope = useStudio((s) => s.scope);
  const setScope = useStudio((s) => s.setScope);
  const set = useStudio((s) => s.set);
  const resetScope = useStudio((s) => s.resetScope);
  const copyScope = useStudio((s) => s.copyScope);
  const pasteScope = useStudio((s) => s.pasteScope);
  const clipboard = useStudio((s) => s.clipboard);
  const [showAll, setShowAll] = useState(false);
  const [q, setQ] = useState("");
  const ordered = useMemo(() => orderRules(COMPONENTS, system), [system]);
  const available = useMemo(() => propsFor(def.type), [def.type]);
  const byId = useMemo(() => new Map(available.map((d) => [d.id, d])), [available]);
  const rule = findRule(system, scope);
  const setCount = Object.keys(rule?.props ?? {}).length;
  const scopeName = scopeKey(scope);
  const essentialIds = new Set(ESSENTIALS.flatMap((g) => g.props));
  const otherSet = Object.keys(rule?.props ?? {}).filter((id) => !essentialIds.has(id) && byId.has(id));
  const searching = q.trim().length > 0;

  return (
    <div className="st-panel-body">
      <div className="st-panel-intro">
        <button
          type="button"
          className="st-back"
          onClick={() => {
            setScope({});
            set({ picked: null });
          }}
        >
          <Icon name="arrow-left" /> All components
        </button>
        <h2>{def.label}</h2>
        <p>{def.description}</p>
      </div>
      <section className="st-sec">
        <Target def={def} />
        <Conditions def={def} />
      </section>
      <div className="st-sticky">
        <label className="st-search">
          <Icon name="search" />
          <input placeholder={`Search ${available.length} properties…`} aria-label="Search properties" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <div className="st-actions">
          <span className="st-count-pill" data-on={setCount ? "" : undefined}>
            {setCount} changed
          </span>
          <button type="button" className="st-icon" onClick={copyScope} title="Copy these changes" aria-label="Copy styles">
            <Icon name="copy" />
          </button>
          <button type="button" className="st-icon" onClick={pasteScope} disabled={!clipboard} title={clipboard ? `Paste from ${clipboard.from}` : "Nothing copied yet"} aria-label="Paste styles">
            <Icon name="download" />
          </button>
          <button type="button" className="st-icon" onClick={resetScope} disabled={!setCount} title="Reset all changes here" aria-label="Reset scope">
            <Icon name="refresh" />
          </button>
        </div>
      </div>
      {searching ? (
        <section className="st-sec">
          {available.filter((d) => matchSearch(d, q)).map((d) => (
            <PropRow key={d.id} def={d} scope={scope} ordered={ordered} scopeName={scopeName} />
          ))}
        </section>
      ) : (
        <>
          {ESSENTIALS.map((g) => {
            const defs = g.props.map((id) => byId.get(id)).filter(Boolean) as PropertyDef[];
            if (!defs.length) return null;
            return (
              <section key={g.title} className="st-sec">
                <h4 className="st-sec-title">
                  <Icon name={g.icon} /> {g.title}
                </h4>
                {defs.map((d) => (
                  <PropRow key={d.id} def={d} scope={scope} ordered={ordered} scopeName={scopeName} />
                ))}
              </section>
            );
          })}
          {otherSet.length ? (
            <section className="st-sec">
              <h4 className="st-sec-title">
                <Icon name="check" /> Also changed here
              </h4>
              {otherSet.map((id) => (
                <PropRow key={id} def={byId.get(id)!} scope={scope} ordered={ordered} scopeName={scopeName} />
              ))}
            </section>
          ) : null}
          <section className="st-sec">
            <button type="button" className="st-wide-btn" aria-expanded={showAll} onClick={() => setShowAll(!showAll)}>
              <Icon name="sliders" /> {showAll ? "Hide" : "Show"} all {available.length} properties
            </button>
          </section>
          {showAll
            ? GROUPS.filter((g) => g.section !== "foundations").map((g) => {
                const defs = available.filter((d) => d.group === (g.id as GroupId) && !essentialIds.has(d.id));
                if (!defs.length) return null;
                const n = defs.filter((d) => rule?.props[d.id] !== undefined).length;
                return (
                  <details key={g.id} className="st-group">
                    <summary>
                      {g.label}
                      {n ? <span className="st-group-count">{n}</span> : null}
                      <span className="st-group-desc">{defs.length}</span>
                    </summary>
                    <p className="st-group-desc" style={{ margin: "0 0 var(--n-space-2)" }}>
                      {g.description}
                    </p>
                    {defs.map((d) => (
                      <PropRow key={d.id} def={d} scope={scope} ordered={ordered} scopeName={scopeName} />
                    ))}
                  </details>
                );
              })
            : null}
        </>
      )}
    </div>
  );
}

export function EditPanel() {
  const scope = useStudio((s) => s.scope);
  const advanced = useStudio((s) => s.advanced);
  const set = useStudio((s) => s.set);
  const def = scope.component ? getComponent(scope.component) : undefined;
  return (
    <div className="st-edit">
      <div className="st-mode-switch" role="radiogroup" aria-label="Editor mode">
        <button type="button" role="radio" aria-checked={!advanced} data-active={!advanced ? "" : undefined} onClick={() => set({ advanced: false })}>
          Simple
        </button>
        <button type="button" role="radio" aria-checked={advanced} data-active={advanced ? "" : undefined} onClick={() => set({ advanced: true })} title="Full cascade inspector: every scope, every property, value origins">
          Advanced
        </button>
      </div>
      {advanced ? <Inspector /> : def ? <Editor def={def} /> : <Browse />}
    </div>
  );
}

/** Plain-language name of what an edit at this scope touches. */
export function describeScope(scope: Scope): string {
  const def = scope.component ? getComponent(scope.component) : undefined;
  if (!def) return "Global";
  const name = def.label;
  let s = scope.instance ? `This ${name.toLowerCase()} (#${scope.instance})` : scope.variant ? `${name} · ${scope.variant}` : `Every ${name.toLowerCase()}`;
  if (scope.part) s += ` › ${partLabel(def, scope.part)}`;
  if (scope.state) s += ` · ${STATE_LABEL[scope.state]}`;
  if (scope.bp) s += ` · ${scope.bp}+`;
  if (scope.mode) s += ` · ${scope.mode}`;
  return s;
}

export const defaultPart = (def: ComponentDef | undefined, part: string | undefined) => (def && SMALL_CONTROLS.has(def.category) ? undefined : part);
