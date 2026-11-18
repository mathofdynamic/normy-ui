"use client";

import { memo, useMemo, useState } from "react";
import { Badge, IconButton, Tooltip } from "@/components/normy";
import { explain, orderRules, scopeLabel, type OrderedRule } from "@/engine/cascade";
import { COMPONENTS, getComponent, partLabel } from "@/engine/components";
import { GROUPS, propsFor, TOKENS } from "@/engine/registry";
import { findRule } from "@/engine/system";
import { BREAKPOINTS, STATES, type DesignSystem, type GroupId, type PropertyDef, type Scope, type Value } from "@/engine/types";
import { PropertyControl } from "./controls";
import { useStudio } from "./store";

/* ------------------------------------------------------------------ *
 * Inspector — generated entirely from the registry. Shows the scope,
 * a searchable list of grouped controls, and for every property where
 * its value comes from (set here / inherited from scope X / recipe).
 * ------------------------------------------------------------------ */

const matchSearch = (d: PropertyDef, q: string) => {
  if (!q) return true;
  const hay = `${d.label} ${d.id} ${d.group} ${(d.keywords ?? []).join(" ")}`.toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .every((t) => hay.includes(t));
};

function ScopeEditor() {
  const scope = useStudio((s) => s.scope);
  const system = useStudio((s) => s.system);
  const instances = useStudio((s) => s.instances);
  const patch = useStudio((s) => s.patchScope);
  const setScope = useStudio((s) => s.setScope);
  const commit = useStudio((s) => s.commit);
  const def = scope.component ? getComponent(scope.component) : undefined;
  const extra = scope.component ? system.components[scope.component] : undefined;
  const variants = [...(def?.variants ?? []), ...(extra?.variants ?? [])];
  const sizes = [...(def?.sizes ?? []), ...(extra?.sizes ?? [])];

  const addName = (kind: "variants" | "sizes") => {
    const name = window.prompt(`New ${kind === "variants" ? "variant" : "size"} name for ${def?.label}`)?.trim();
    if (!name || !scope.component) return;
    const cur = system.components[scope.component] ?? {};
    commit({ ...system, components: { ...system.components, [scope.component]: { ...cur, [kind]: [...(cur[kind] ?? []), name] } } }, `add ${kind} ${name}`);
    patch(kind === "variants" ? { variant: name } : { size: name });
  };

  const sel = (label: string, value: string | undefined, options: string[], onChange: (v: string | undefined) => void, add?: () => void) => (
    <label>
      {label}
      <span className="st-row-ctl">
        <select className="st-in" value={value ?? ""} onChange={(e) => onChange(e.target.value || undefined)} aria-label={label}>
          <option value="">any</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        {add ? (
          <button type="button" className="st-mini" onClick={add} aria-label={`Add ${label}`}>
            +
          </button>
        ) : null}
      </span>
    </label>
  );

  return (
    <div className="st-scope">
      <div className="st-crumb">
        <span>Scope</span>
        <b>{scopeLabel(scope)}</b>
        {scope.part ? (
          <button type="button" className="st-mini" style={{ marginLeft: "auto" }} onClick={() => patch({ part: undefined })} title="Edit the component root instead of this part">
            ↑ root
          </button>
        ) : null}
      </div>
      <label>
        Component
        <select className="st-in" value={scope.component ?? ""} onChange={(e) => setScope(e.target.value ? { component: e.target.value } : {})} aria-label="Component">
          <option value="">Global (tokens)</option>
          {COMPONENTS.map((c) => (
            <option key={c.type} value={c.type}>
              {c.label}
            </option>
          ))}
        </select>
      </label>
      {def ? (
        <>
          {sel("Part", scope.part, Object.keys(def.parts).filter((p) => p !== "root"), (v) => patch({ part: v }))}
          {sel("Variant", scope.variant, variants, (v) => patch({ variant: v }), () => addName("variants"))}
          {sel("Size", scope.size, sizes, (v) => patch({ size: v }), () => addName("sizes"))}
          {sel("State", scope.state, def.states.length ? def.states : STATES, (v) => patch({ state: v as Scope["state"] }))}
          {sel("Breakpoint", scope.bp, BREAKPOINTS, (v) => patch({ bp: v as Scope["bp"] }))}
          {sel("Mode", scope.mode, ["light", "dark"], (v) => patch({ mode: v as Scope["mode"] }))}
          {sel(
            "Instance",
            scope.instance,
            instances.filter((i) => i.component === scope.component).map((i) => i.id),
            (v) => patch({ instance: v }),
          )}
        </>
      ) : null}
    </div>
  );
}

const Row = memo(function Row({ def, ordered, scope, system }: { def: PropertyDef; ordered: OrderedRule[]; scope: Scope; system: DesignSystem }) {
  const setPropAt = useStudio((s) => s.setPropAt);
  const setScope = useStudio((s) => s.setScope);
  const here = findRule(system, scope)?.props[def.id];
  const ex = explain(ordered, scope, def.id);
  const isHere = here !== undefined;
  const value: Value = isHere ? here : (ex.value ?? null);
  return (
    <div className="st-prop" data-inherited={!isHere && ex.value !== undefined ? "" : undefined}>
      <div className="st-prop-label">
        <span title={def.description ?? def.id}>{def.label}</span>
        {isHere ? (
          <span className="st-origin" data-o="here">
            ● set here
            <button type="button" onClick={() => setPropAt(def.id, undefined)} aria-label={`Reset ${def.label}`}>
              reset
            </button>
          </span>
        ) : ex.value !== undefined ? (
          <span className="st-origin" title={ex.chain.map((c) => `${c.source}: ${c.label}`).join("\n")}>
            ↳ {ex.origin === "recipe" ? "default" : ""} {ex.from}
            {ex.origin === "inherited" && ex.chain.at(-1) ? (
              <button type="button" onClick={() => setScope(ex.chain.at(-1)!.scope)} aria-label="Go to source scope">
                go
              </button>
            ) : null}
          </span>
        ) : (
          <span className="st-origin">unset</span>
        )}
      </div>
      <PropertyControl def={def} value={value} onChange={(v) => setPropAt(def.id, v)} />
    </div>
  );
});

function TokenRow({ def, system }: { def: PropertyDef; system: DesignSystem }) {
  const setTokenValue = useStudio((s) => s.setTokenValue);
  const light = system.tokens[def.id];
  const dark = system.dark[def.id];
  const hasDark = def.darkDefault !== undefined;
  return (
    <div className="st-prop">
      <div className="st-prop-label">
        <span title={def.description ?? def.id}>{def.label}</span>
        {light !== undefined ? (
          <span className="st-origin" data-o="here">
            ● set
            <button type="button" onClick={() => setTokenValue(def.id, undefined)}>
              reset
            </button>
          </span>
        ) : (
          <span className="st-origin">default</span>
        )}
      </div>
      <div className="st-stack">
        <PropertyControl def={def} value={light ?? def.default ?? null} onChange={(v) => setTokenValue(def.id, v)} />
        {hasDark ? (
          <div className="st-row-ctl">
            <span className="st-unit">dark</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <PropertyControl def={def} value={dark ?? def.darkDefault ?? null} onChange={(v) => setTokenValue(def.id, v, "dark")} />
            </div>
            {dark !== undefined ? (
              <button type="button" className="st-mini" onClick={() => setTokenValue(def.id, undefined, "dark")} aria-label="Reset dark value">
                ×
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function Inspector() {
  const system = useStudio((s) => s.system);
  const scope = useStudio((s) => s.scope);
  const resetScope = useStudio((s) => s.resetScope);
  const copyScope = useStudio((s) => s.copyScope);
  const pasteScope = useStudio((s) => s.pasteScope);
  const clipboard = useStudio((s) => s.clipboard);
  const [q, setQ] = useState("");
  const ordered = useMemo(() => orderRules(COMPONENTS, system), [system]);
  const isGlobal = !scope.component;
  const rule = findRule(system, scope);
  const setCount = isGlobal ? Object.keys(system.tokens).length + Object.keys(system.dark).length : Object.keys(rule?.props ?? {}).length;

  const groups = useMemo(() => {
    if (isGlobal) {
      const tokenGroups = GROUPS.filter((g) => g.section === "foundations").map((g) => ({ g, defs: TOKENS.filter((t) => t.group === g.id && matchSearch(t, q)), token: true }));
      const text = GROUPS.find((g) => g.id === "text")!;
      return [...tokenGroups, { g: { ...text, label: "Global text (inherited)", description: "Applied to <html>; flows into everything" }, defs: propsFor().filter((d) => d.group === "text" && matchSearch(d, q)), token: false }];
    }
    const available = propsFor(scope.component);
    return GROUPS.filter((g) => g.section !== "foundations").map((g) => ({ g, defs: available.filter((d) => d.group === (g.id as GroupId) && matchSearch(d, q)), token: false }));
  }, [isGlobal, scope.component, q]);

  const def = scope.component ? getComponent(scope.component) : undefined;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: 0, flex: 1 }}>
      <ScopeEditor />
      <div style={{ display: "flex", gap: "var(--n-space-1-5)", alignItems: "center", padding: "var(--n-space-2) var(--n-space-3)", borderBottom: "1px solid var(--n-color-border)" }}>
        <input className="st-in" placeholder={`Search ${isGlobal ? "tokens" : "properties"}…`} aria-label="Search properties" value={q} onChange={(e) => setQ(e.target.value)} />
        <Badge variant={setCount ? "accent" : "neutral"} size="sm">
          {setCount} set
        </Badge>
        <Tooltip content="Copy this scope's values">
          <IconButton icon="copy" label="Copy styles" size="sm" onClick={copyScope} />
        </Tooltip>
        <Tooltip content={clipboard ? `Paste from ${clipboard.from}` : "Nothing copied"}>
          <IconButton icon="download" label="Paste styles" size="sm" onClick={pasteScope} disabled={!clipboard} />
        </Tooltip>
        <Tooltip content="Reset everything at this scope">
          <IconButton icon="refresh" label="Reset scope" size="sm" onClick={resetScope} disabled={!setCount} />
        </Tooltip>
      </div>
      <div className="st-scroll">
        {def ? (
          <p className="st-group-desc" style={{ margin: "var(--n-space-2) 0" }}>
            {def.description} Parts: {Object.keys(def.parts).map((p) => partLabel(def, p)).join(", ")}.
          </p>
        ) : null}
        {groups.map(({ g, defs, token }) => {
          if (!defs.length) return null;
          const count = token ? defs.filter((d) => system.tokens[d.id] !== undefined || system.dark[d.id] !== undefined).length : defs.filter((d) => rule?.props[d.id] !== undefined).length;
          return (
            <details key={g.id + String(token)} className="st-group" open={!!q || count > 0 || undefined}>
              <summary>
                {g.label}
                {count ? <span className="st-group-count">{count}</span> : null}
                <span className="st-group-desc">{defs.length}</span>
              </summary>
              <p className="st-group-desc" style={{ margin: "0 0 var(--n-space-2)" }}>
                {g.description}
              </p>
              {defs.map((d) => (token ? <TokenRow key={d.id} def={d} system={system} /> : <Row key={d.id} def={d} ordered={ordered} scope={scope} system={system} />))}
            </details>
          );
        })}
      </div>
    </div>
  );
}
