"use client";

import { useMemo, useState } from "react";
import { SegmentedControl } from "@/components/normy";
import { Icon } from "@/components/normy/icon";
import { PREVIEW_PAGES } from "@/components/preview/pages";
import { scopeKey } from "@/engine/cascade";
import { COMPONENTS } from "@/engine/components";
import { GROUPS } from "@/engine/registry";
import type { Category } from "@/engine/types";
import { useStudio } from "./store";

const CATS: Array<{ id: Category; label: string }> = [
  { id: "layout", label: "Layout" },
  { id: "typography", label: "Typography" },
  { id: "actions", label: "Actions" },
  { id: "forms", label: "Forms" },
  { id: "navigation", label: "Navigation" },
  { id: "data", label: "Data display" },
  { id: "overlay", label: "Overlays" },
  { id: "feedback", label: "Feedback" },
  { id: "media", label: "Media & motion" },
  { id: "blocks", label: "Blocks" },
];

function ScopeList() {
  const scope = useStudio((s) => s.scope);
  const system = useStudio((s) => s.system);
  const pageComponents = useStudio((s) => s.pageComponents);
  const setScope = useStudio((s) => s.setScope);
  const [q, setQ] = useState("");
  const [onPage, setOnPage] = useState(false);

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const r of system.rules) if (r.scope.component) m[r.scope.component] = (m[r.scope.component] ?? 0) + Object.keys(r.props).length;
    return m;
  }, [system]);

  const list = COMPONENTS.filter((c) => (!q || `${c.label} ${c.type}`.toLowerCase().includes(q.toLowerCase())) && (!onPage || pageComponents[c.type]));
  const tokenCount = Object.keys(system.tokens).length + Object.keys(system.dark).length;

  return (
    <>
      <div className="st-row-ctl" style={{ marginTop: "var(--n-space-2)" }}>
        <input className="st-in" placeholder="Find component…" aria-label="Find component" value={q} onChange={(e) => setQ(e.target.value)} />
        <label className="st-check" title="Only components present on the current page">
          <input type="checkbox" checked={onPage} onChange={(e) => setOnPage(e.target.checked)} /> on page
        </label>
      </div>
      <div className="st-tree-label">Global</div>
      <button type="button" className="st-item" data-active={!scope.component ? "" : undefined} onClick={() => setScope({})}>
        <Icon name="palette" /> Tokens &amp; foundations
        {tokenCount ? <span className="st-count">{tokenCount}</span> : null}
      </button>
      <div className="st-sub" style={{ display: !scope.component ? undefined : "none" }}>
        {GROUPS.filter((g) => g.section === "foundations").map((g) => (
          <div key={g.id} className="st-item" style={{ cursor: "default", minHeight: "1.4rem", fontSize: "0.75rem" }}>
            {g.label}
          </div>
        ))}
      </div>
      {CATS.map((cat) => {
        const items = list.filter((c) => c.category === cat.id);
        if (!items.length) return null;
        return (
          <div key={cat.id}>
            <div className="st-tree-label">{cat.label}</div>
            {items.map((c) => {
              const active = scope.component === c.type;
              const custom = system.components[c.type];
              return (
                <div key={c.type}>
                  <button type="button" className="st-item" data-active={active && !scope.part && !scope.variant && !scope.state ? "" : undefined} onClick={() => setScope({ component: c.type })}>
                    {c.label}
                    {counts[c.type] ? <span className="st-count">{counts[c.type]}</span> : null}
                  </button>
                  {active ? (
                    <div className="st-sub">
                      <div className="st-chips" aria-label="Parts">
                        {Object.keys(c.parts).map((p) => (
                          <button key={p} type="button" className="st-chip" data-active={(scope.part ?? "root") === p ? "" : undefined} onClick={() => setScope({ ...scope, part: p })}>
                            {p}
                          </button>
                        ))}
                      </div>
                      {[...c.variants, ...(custom?.variants ?? [])].length ? (
                        <div className="st-chips" aria-label="Variants">
                          {[...c.variants, ...(custom?.variants ?? [])].map((v) => (
                            <button key={v} type="button" className="st-chip" data-active={scope.variant === v ? "" : undefined} onClick={() => setScope({ ...scope, variant: scope.variant === v ? undefined : v })}>
                              ·{v}
                            </button>
                          ))}
                        </div>
                      ) : null}
                      {c.states.length ? (
                        <div className="st-chips" aria-label="States">
                          {c.states.map((s) => (
                            <button key={s} type="button" className="st-chip" data-active={scope.state === s ? "" : undefined} onClick={() => setScope({ ...scope, state: scope.state === s ? undefined : s })}>
                              :{s}
                            </button>
                          ))}
                        </div>
                      ) : null}
                      {system.rules
                        .filter((r) => r.scope.component === c.type && scopeKey(r.scope) !== `component=${c.type}`)
                        .slice(0, 12)
                        .map((r) => (
                          <button key={r.id} type="button" className="st-item" style={{ fontSize: "0.6875rem", minHeight: "1.4rem" }} data-active={scopeKey(r.scope) === scopeKey(scope) ? "" : undefined} onClick={() => setScope(r.scope)}>
                            <span className="st-mono">{scopeKey(r.scope).replace(`component=${c.type}|`, "")}</span>
                            <span className="st-count">{Object.keys(r.props).length}</span>
                          </button>
                        ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        );
      })}
    </>
  );
}

function PageList() {
  const page = useStudio((s) => s.page);
  const set = useStudio((s) => s.set);
  return (
    <>
      {(["Landing", "Dashboard", "Labs"] as const).map((g) => (
        <div key={g}>
          <div className="st-tree-label">{g}</div>
          {PREVIEW_PAGES.filter((p) => p.group === g).map((p) => (
            <button key={p.path} type="button" className="st-item" data-active={page === p.path ? "" : undefined} onClick={() => set({ page: p.path, instances: [] })} title={p.description}>
              <Icon name={p.icon} /> {p.title}
            </button>
          ))}
        </div>
      ))}
    </>
  );
}

function InstanceList() {
  const instances = useStudio((s) => s.instances);
  const scope = useStudio((s) => s.scope);
  const setScope = useStudio((s) => s.setScope);
  if (!instances.length) return <p className="st-empty">No instances with an id on this page. Elements are given ids with the nid prop.</p>;
  return (
    <>
      <div className="st-tree-label">On this page · {instances.length}</div>
      {instances.map((i) => (
        <button
          key={i.id}
          type="button"
          className="st-item"
          data-active={scope.instance === i.id ? "" : undefined}
          onClick={() => {
            setScope({ component: i.component, instance: i.id });
            window.dispatchEvent(new CustomEvent("studio:highlight", { detail: { component: i.component, instance: i.id } }));
          }}
        >
          <span className="st-mono">#{i.id}</span>
          <span className="st-count" style={{ color: "var(--n-color-text-subtle)" }}>
            {i.component}
          </span>
        </button>
      ))}
    </>
  );
}

export function ScopeTree() {
  const tab = useStudio((s) => s.leftTab);
  const set = useStudio((s) => s.set);
  return (
    <>
      <div className="st-pane-head">
        <SegmentedControl
          label="Left panel"
          size="sm"
          block
          value={tab}
          onValueChange={(v) => set({ leftTab: v })}
          options={[
            { value: "scope", label: "Scopes" },
            { value: "pages", label: "Pages" },
            { value: "instances", label: "Instances" },
          ]}
        />
      </div>
      <div className="st-scroll">{tab === "scope" ? <ScopeList /> : tab === "pages" ? <PageList /> : <InstanceList />}</div>
    </>
  );
}
