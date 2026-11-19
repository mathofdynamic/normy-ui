"use client";

import NextLink from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CommandPalette, Dialog, DialogContent, Dropdown, Toaster, Tooltip, useCommandShortcut, useToast, type CommandItem } from "@/components/normy";
import { Icon } from "@/components/normy/icon";
import { PREVIEW_PAGES } from "@/components/preview/pages";
import { COMPONENTS } from "@/engine/components";
import { applyMode, applySystem, LS_CSS, LS_SYSTEM } from "@/engine/runtime/apply";
import { broadcast } from "@/engine/runtime/channel";
import { compile } from "@/engine/compile";
import { cloneSystem, parseSystem } from "@/engine/system";
import { STARTERS } from "@/engine/systems";
import { STUDIO_SYSTEM } from "@/engine/systems/studio";
import { STATES, type StateName } from "@/engine/types";
import { Canvas } from "./canvas";
import { describeScope, EditPanel, STATE_LABEL } from "./edit-panel";
import { ExportPanel, HistoryPanel, saveCurrent, SystemsPanel } from "./panels";
import { GuidePanel } from "./guide-panel";
import { StylePanel } from "./style-panel";
import { DEVICES, useStudio, type Device, type Panel } from "./store";
import { SystemThumb } from "./system-thumb";

const DRAFT_KEY = "normy:studio-draft";
const UI_KEY = "normy:studio-ui";
const WELCOME_KEY = "normy:studio-welcomed";

/* ---------------- persistence ---------------- */

/** Autosave the draft, publish it as the active system for every other page/tab. */
function usePersistence(onFirstRun: () => void) {
  useEffect(() => {
    let restored = false;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        const sys = parseSystem(d.system);
        useStudio.getState().load(sys, d.savedId ?? null);
        if (d.baseline) useStudio.setState({ baseline: parseSystem(d.baseline) });
        if (d.page) useStudio.setState({ page: d.page });
        restored = true;
      }
    } catch {
      /* ignore corrupt drafts */
    }
    if (!restored && !localStorage.getItem(WELCOME_KEY)) onFirstRun();
    let timer: ReturnType<typeof setTimeout> | null = null;
    const bc = broadcast();
    const unsub = useStudio.subscribe((s, prev) => {
      if (s.system === prev.system && s.page === prev.page && s.baseline === prev.baseline) return;
      if (s.system !== prev.system) bc?.postMessage({ type: "system", system: s.system });
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        try {
          localStorage.setItem(DRAFT_KEY, JSON.stringify({ system: s.system, baseline: s.baseline, savedId: s.savedId, page: s.page }));
          localStorage.setItem(LS_SYSTEM, JSON.stringify(s.system));
          localStorage.setItem(LS_CSS, compile(s.system, COMPONENTS).css);
        } catch {
          /* quota */
        }
      }, 400);
    });
    return () => {
      unsub();
      if (timer) clearTimeout(timer);
    };
  }, [onFirstRun]);
}

/* ---------------- UI preferences (size + panel width) ---------------- */

export type UiSize = "compact" | "default" | "large";
const UI_PX: Record<UiSize, number> = { compact: 14, default: 16, large: 18 };

function useUiPrefs() {
  const [size, setSize] = useState<UiSize>("default");
  const [width, setWidth] = useState(400);
  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem(UI_KEY) ?? "{}");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restore persisted prefs on mount
      if (p.size) setSize(p.size);
      if (p.width) setWidth(p.width);
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    document.documentElement.style.fontSize = `${UI_PX[size]}px`;
    return () => {
      document.documentElement.style.fontSize = "";
    };
  }, [size]);
  const persist = (patch: { size?: UiSize; width?: number }) => {
    try {
      const cur = JSON.parse(localStorage.getItem(UI_KEY) ?? "{}");
      localStorage.setItem(UI_KEY, JSON.stringify({ ...cur, ...patch }));
    } catch {
      /* ignore */
    }
  };
  return {
    size,
    setSize: (s: UiSize) => {
      setSize(s);
      persist({ size: s });
    },
    width,
    setWidth: (w: number) => {
      setWidth(w);
      persist({ width: w });
    },
  };
}

/* ---------------- top bar ---------------- */

function Logo() {
  return (
    <svg viewBox="0 0 20 20" width="22" height="22" aria-hidden fill="none">
      <rect x="1" y="1" width="18" height="18" rx="5" fill="currentColor" />
      <circle cx="10" cy="10" r="3.4" fill="var(--n-color-accent)" />
    </svg>
  );
}

function TopBar({ onPalette, onHelp, ui }: { onPalette: () => void; onHelp: () => void; ui: ReturnType<typeof useUiPrefs> }) {
  const system = useStudio((s) => s.system);
  const baseline = useStudio((s) => s.baseline);
  const savedId = useStudio((s) => s.savedId);
  const past = useStudio((s) => s.past);
  const future = useStudio((s) => s.future);
  const device = useStudio((s) => s.device);
  const mode = useStudio((s) => s.mode);
  const page = useStudio((s) => s.page);
  const compare = useStudio((s) => s.compare);
  const force = useStudio((s) => s.force);
  const speed = useStudio((s) => s.speed);
  const motionOff = useStudio((s) => s.motionOff);
  const st = useStudio.getState();
  const toast = useToast();
  const dirty = system !== baseline && JSON.stringify(system) !== JSON.stringify(baseline);
  const current = PREVIEW_PAGES.find((p) => p.path === page);

  const save = async () => {
    try {
      await saveCurrent();
      toast({ title: `Saved “${system.meta.name}”`, description: `design-systems/${system.meta.id}/`, variant: "success" });
    } catch (e) {
      toast({ title: "Save failed", description: (e as Error).message, variant: "danger" });
    }
  };

  return (
    <header className="st-top">
      <div className="st-top-left">
        <NextLink href="/" aria-label="Normy home" className="st-logo">
          <Logo />
        </NextLink>
        <div className="st-title">
          <input className="st-name" aria-label="System name" value={system.meta.name} onChange={(e) => st.commit({ ...system, meta: { ...system.meta, name: e.target.value } }, "rename", true)} />
          <span className="st-status" data-dirty={dirty ? "" : undefined}>
            {dirty ? "Unsaved changes" : savedId ? "Saved" : "Draft · autosaved in this browser"}
          </span>
        </div>
      </div>

      <div className="st-top-center">
        <label className="st-page-pick">
          <Icon name={current?.icon ?? "layout"} />
          <select aria-label="Preview page" value={current ? page : ""} onChange={(e) => st.set({ page: e.target.value, instances: [] })}>
            {!current ? <option value="">{page}</option> : null}
            {(["Landing", "Dashboard", "Labs"] as const).map((g) => (
              <optgroup key={g} label={g}>
                {PREVIEW_PAGES.filter((p) => p.group === g).map((p) => (
                  <option key={p.path} value={p.path}>
                    {p.title}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <Icon name="chevron-down" />
        </label>
        <div className="st-seg st-seg-top" role="radiogroup" aria-label="Device">
          {(Object.keys(DEVICES) as Device[]).map((d) => (
            <button key={d} type="button" role="radio" aria-checked={device === d} data-active={device === d ? "" : undefined} onClick={() => st.set({ device: d })} title={DEVICES[d].label}>
              {d === "fit" ? "Fit" : d === "mobile" ? "Phone" : d === "tablet" ? "Tablet" : "Desktop"}
            </button>
          ))}
        </div>
        <select className="st-device-select" aria-label="Device (compact)" value={device} onChange={(e) => st.set({ device: e.target.value as Device })}>
          {(Object.keys(DEVICES) as Device[]).map((d) => (
            <option key={d} value={d}>
              {DEVICES[d].label}
            </option>
          ))}
        </select>
        <Tooltip content={mode === "dark" ? "Switch preview to light" : "Switch preview to dark"}>
          <button type="button" className="st-icon st-icon-lg" aria-label="Toggle light / dark preview" onClick={() => st.set({ mode: mode === "dark" ? "light" : "dark" })}>
            <Icon name={mode === "dark" ? "moon" : "sun"} />
          </button>
        </Tooltip>
      </div>

      <div className="st-top-right">
        <Tooltip content="Undo" shortcut="Ctrl Z">
          <button type="button" className="st-icon st-icon-lg" aria-label="Undo" onClick={st.undo} disabled={!past.length}>
            <Icon name="arrow-left" />
          </button>
        </Tooltip>
        <Tooltip content="Redo" shortcut="Ctrl ⇧ Z">
          <button type="button" className="st-icon st-icon-lg" aria-label="Redo" onClick={st.redo} disabled={!future.length}>
            <Icon name="arrow-right" />
          </button>
        </Tooltip>
        <Tooltip content="Before / after: last saved vs. now">
          <button type="button" className="st-icon st-icon-lg" aria-label="Compare" aria-pressed={compare} data-active={compare ? "" : undefined} onClick={() => st.set({ compare: !compare })}>
            <Icon name="layout" />
          </button>
        </Tooltip>
        <Dropdown
          trigger={
            <button type="button" className="st-icon st-icon-lg" aria-label="More options">
              <Icon name="menu" />
            </button>
          }
          items={[
            { type: "label", label: "Interface size" },
            ...(["compact", "default", "large"] as UiSize[]).map((s) => ({ label: `${ui.size === s ? "✓ " : ""}${s[0].toUpperCase()}${s.slice(1)}`, onSelect: () => ui.setSize(s) })),
            { type: "separator" as const },
            { type: "label", label: "Preview motion (not saved)" },
            { label: "Replay animations", onSelect: () => window.dispatchEvent(new Event("studio:replay")) },
            ...[0.25, 0.5, 1, 2].map((v) => ({ label: `${speed === v && !motionOff ? "✓ " : ""}Speed ${v}×`, onSelect: () => st.set({ speed: v, motionOff: false }) })),
            { label: `${motionOff ? "✓ " : ""}Pause all motion`, onSelect: () => st.set({ motionOff: !motionOff }) },
            { type: "separator" as const },
            { type: "label", label: "Freeze selected component in a state" },
            ...STATES.slice(0, 6).map((s) => ({ label: `${force.includes(s) ? "✓ " : ""}${STATE_LABEL[s]}`, onSelect: () => st.set({ force: force.includes(s) ? force.filter((x) => x !== s) : [...force, s as StateName] }) })),
            ...(force.length ? [{ label: "Clear frozen states", onSelect: () => st.set({ force: [] }) }] : []),
            { type: "separator" as const },
            { label: "Open this page in a new tab", onSelect: () => window.open(page, "_blank") },
            { label: "All commands…  Ctrl K", onSelect: onPalette },
            { label: "Welcome & tips", onSelect: onHelp },
          ]}
        />
        <button type="button" className="st-btn st-btn-ghost" onClick={() => st.set({ panel: "export", panelOpen: true })}>
          Export
        </button>
        <button type="button" className="st-btn st-btn-primary" onClick={save}>
          Save
        </button>
      </div>
    </header>
  );
}

/* ---------------- rail + panel ---------------- */

const RAIL: Array<{ id: Panel; label: string; icon: Parameters<typeof Icon>[0]["name"]; hint: string }> = [
  { id: "style", label: "Style", icon: "palette", hint: "Colours, type, shape, depth, motion" },
  { id: "edit", label: "Edit", icon: "cursor", hint: "Click anything and change it" },
  { id: "pages", label: "Pages", icon: "layout", hint: "Preview your system on real pages" },
  { id: "guide", label: "Guide", icon: "wand", hint: "The rules your AI agents follow" },
  { id: "library", label: "Library", icon: "layers", hint: "Saved systems, versions, import" },
  { id: "export", label: "Export", icon: "upload", hint: "Agent Kit for your AI agents, plus CSS, Tailwind, tokens" },
  { id: "history", label: "History", icon: "clock", hint: "Every change, jump back to any" },
];

function Rail({ ui }: { ui: ReturnType<typeof useUiPrefs> }) {
  const panel = useStudio((s) => s.panel);
  const open = useStudio((s) => s.panelOpen);
  const set = useStudio((s) => s.set);
  const rules = useStudio((s) => s.system.rules.length);
  return (
    <nav className="st-rail" aria-label="Studio sections">
      {RAIL.map((r) => (
        <Tooltip key={r.id} content={r.hint} side="right">
          <button
            type="button"
            className="st-rail-btn"
            aria-current={panel === r.id && open ? "page" : undefined}
            data-active={panel === r.id && open ? "" : undefined}
            onClick={() => set(panel === r.id ? { panelOpen: !open } : { panel: r.id, panelOpen: true })}
          >
            <Icon name={r.icon} />
            <span>{r.label}</span>
            {r.id === "edit" && rules ? <i className="st-rail-badge">{rules}</i> : null}
          </button>
        </Tooltip>
      ))}
      <span className="st-rail-spacer" />
      <Tooltip content={`Interface size: ${ui.size} — click to change`} side="right">
        <button
          type="button"
          className="st-rail-btn"
          aria-label={`Interface size: ${ui.size}`}
          onClick={() => ui.setSize(ui.size === "compact" ? "default" : ui.size === "default" ? "large" : "compact")}
        >
          <span className="st-size-glyph" data-size={ui.size}>
            Aa
          </span>
          <span>{ui.size === "compact" ? "Small" : ui.size === "default" ? "Medium" : "Large"}</span>
        </button>
      </Tooltip>
      <Tooltip content={open ? "Hide panel" : "Show panel"} side="right">
        <button type="button" className="st-rail-btn" aria-label={open ? "Hide panel" : "Show panel"} onClick={() => set({ panelOpen: !open })}>
          <Icon name={open ? "arrow-left" : "arrow-right"} />
          <span>{open ? "Hide" : "Show"}</span>
        </button>
      </Tooltip>
    </nav>
  );
}

function PagesPanel() {
  const page = useStudio((s) => s.page);
  const set = useStudio((s) => s.set);
  return (
    <div className="st-panel-body">
      <div className="st-panel-intro">
        <h2>Pages</h2>
        <p>Real product screens built only from Normy components. Check your system on each of them.</p>
      </div>
      {(["Landing", "Dashboard", "Labs"] as const).map((g) => (
        <section key={g} className="st-sec st-sec-list">
          <h4 className="st-list-title">{g === "Labs" ? "Tools" : g === "Landing" ? "Marketing pages" : "App screens"}</h4>
          {PREVIEW_PAGES.filter((p) => p.group === g).map((p) => (
            <button key={p.path} type="button" className="st-item" data-active={page === p.path ? "" : undefined} onClick={() => set({ page: p.path, instances: [] })}>
              <span className="st-item-icon">
                <Icon name={p.icon} />
              </span>
              <span className="st-item-main">
                <b>{p.title}</b>
                <small>{p.description}</small>
              </span>
            </button>
          ))}
        </section>
      ))}
    </div>
  );
}

function PanelHost({ width, setWidth }: { width: number; setWidth: (w: number) => void }) {
  const panel = useStudio((s) => s.panel);
  const open = useStudio((s) => s.panelOpen);
  const ref = useRef<HTMLDivElement>(null);
  const onDown = (e: React.PointerEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const start = ref.current?.getBoundingClientRect().width ?? width;
    document.body.dataset.resizing = "";
    const move = (ev: PointerEvent) => setWidth(Math.round(Math.min(Math.max(280, start + ev.clientX - startX), Math.min(760, window.innerWidth * 0.6))));
    const up = () => {
      delete document.body.dataset.resizing;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };
  if (!open) return null;
  return (
    <aside className="st-panel" ref={ref} style={{ width }} aria-label={`${panel} panel`}>
      <div className="st-panel-scroll" key={panel}>
        {panel === "style" ? <StylePanel /> : panel === "edit" ? <EditPanel /> : panel === "pages" ? <PagesPanel /> : panel === "guide" ? <GuidePanel /> : (
          <div className="st-panel-body">
            <div className="st-panel-intro">
              <h2>{panel === "library" ? "Library" : panel === "export" ? "Export" : "History"}</h2>
              <p>{panel === "library" ? "Save systems to disk, keep versions, compare and import." : panel === "export" ? "Hand your system to your AI agents with the Agent Kit, or take the raw formats." : "Every change you made. Click one to go back to just before it."}</p>
            </div>
            <div className="st-legacy">{panel === "library" ? <SystemsPanel /> : panel === "export" ? <ExportPanel /> : <HistoryPanel />}</div>
          </div>
        )}
      </div>
      <div
        className="st-resizer"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize panel"
        aria-valuenow={width}
        tabIndex={0}
        onPointerDown={onDown}
        onDoubleClick={() => setWidth(400)}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") setWidth(Math.max(280, width - 24));
          if (e.key === "ArrowRight") setWidth(Math.min(760, width + 24));
        }}
      />
    </aside>
  );
}

/* ---------------- canvas dock ---------------- */

function CanvasDock() {
  const inspect = useStudio((s) => s.inspect);
  const scope = useStudio((s) => s.scope);
  const set = useStudio((s) => s.set);
  return (
    <div className="st-dock" role="toolbar" aria-label="Canvas tools">
      <button type="button" className="st-dock-btn" data-active={inspect ? "" : undefined} aria-pressed={inspect} onClick={() => set({ inspect: !inspect, ...(inspect ? {} : { panel: "edit", panelOpen: true }) })} title="Select elements to edit (I)">
        <Icon name="cursor" /> {inspect ? "Selecting" : "Select"}
      </button>
      <button type="button" className="st-dock-btn" data-active={!inspect ? "" : undefined} aria-pressed={!inspect} onClick={() => set({ inspect: false })} title="Use the page normally (Esc)">
        <Icon name="eye" /> Interact
      </button>
      <span className="st-dock-sep" />
      <button type="button" className="st-dock-btn" onClick={() => window.dispatchEvent(new Event("studio:replay"))} title="Replay entrance animations">
        <Icon name="play" /> Replay
      </button>
      {scope.component ? (
        <span className="st-dock-chip" title="Currently editing">
          Editing: <b>{describeScope(scope)}</b>
        </span>
      ) : null}
    </div>
  );
}

/* ---------------- welcome ---------------- */

function Welcome({ open, setOpen }: { open: boolean; setOpen: (o: boolean) => void }) {
  const commit = useStudio((s) => s.commit);
  const set = useStudio((s) => s.set);
  const close = () => {
    localStorage.setItem(WELCOME_KEY, "1");
    setOpen(false);
  };
  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : close())}>
      <DialogContent size="lg" title="Design your UI, visually" description="Pick a starting point. You can change everything afterwards — nothing here is permanent.">
        <div className="st-welcome">
          <ol className="st-steps">
            <li>
              <b>1 · Style</b>
              <span>Choose brand colour, fonts, corners and motion.</span>
            </li>
            <li>
              <b>2 · Edit</b>
              <span>Click any element in the preview to fine-tune it.</span>
            </li>
            <li>
              <b>3 · Save &amp; export</b>
              <span>Keep versions, export CSS, Tailwind or tokens.</span>
            </li>
          </ol>
          <div className="st-welcome-grid">
            {STARTERS.map((s) => (
              <button
                key={s.meta.id}
                type="button"
                className="st-starter st-starter-lg"
                onClick={() => {
                  commit(cloneSystem(s, { id: s.meta.id, name: s.meta.name }), `start from ${s.meta.name}`);
                  set({ savedId: null, panel: "style", panelOpen: true });
                  close();
                }}
              >
                <SystemThumb system={s} />
                <span className="st-tile-label">{s.meta.name}</span>
                <span className="st-tile-hint">{s.meta.description}</span>
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- keyboard + palette ---------------- */

function Shortcuts({ openPalette }: { openPalette: () => void }) {
  useCommandShortcut(openPalette);
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing = t.closest("input, textarea, select, [contenteditable]");
      const st = useStudio.getState();
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "z" && !typing) {
        e.preventDefault();
        if (e.shiftKey) st.redo();
        else st.undo();
      } else if (mod && e.key.toLowerCase() === "y" && !typing) {
        e.preventDefault();
        st.redo();
      } else if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void saveCurrent();
      } else if (!typing && !mod && e.key.toLowerCase() === "i") st.set({ inspect: !st.inspect, ...(st.inspect ? {} : { panel: "edit" as const, panelOpen: true }) });
      else if (e.key === "Escape" && st.inspect) st.set({ inspect: false });
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, []);
  return null;
}

function Palette({ open, setOpen }: { open: boolean; setOpen: (o: boolean) => void }) {
  const items = useMemo<CommandItem[]>(() => {
    const st = () => useStudio.getState();
    const go = (panel: Panel) => st().set({ panel, panelOpen: true });
    return [
      { id: "save", group: "System", label: "Save system", icon: "download", shortcut: ["Ctrl", "S"], onSelect: () => void saveCurrent() },
      { id: "undo", group: "System", label: "Undo", icon: "arrow-left", onSelect: () => st().undo() },
      { id: "redo", group: "System", label: "Redo", icon: "arrow-right", onSelect: () => st().redo() },
      { id: "style", group: "Go to", label: "Style: colours, fonts, corners…", icon: "palette", onSelect: () => go("style") },
      { id: "edit", group: "Go to", label: "Edit components", icon: "cursor", onSelect: () => go("edit") },
      { id: "guide", group: "Go to", label: "Guide: rules for AI agents", icon: "wand", onSelect: () => go("guide") },
      { id: "export", group: "Go to", label: "Export / Agent Kit…", icon: "upload", onSelect: () => go("export") },
      { id: "systems", group: "Go to", label: "Library: saved systems & versions", icon: "layers", onSelect: () => go("library") },
      { id: "history", group: "Go to", label: "History", icon: "clock", onSelect: () => go("history") },
      { id: "advanced", group: "Go to", label: "Advanced inspector (full cascade)", icon: "sliders", onSelect: () => st().set({ panel: "edit", panelOpen: true, advanced: true }) },
      { id: "copy", group: "System", label: "Copy styles from current selection", icon: "copy", onSelect: () => st().copyScope() },
      { id: "paste", group: "System", label: "Paste styles into current selection", icon: "download", onSelect: () => st().pasteScope() },
      { id: "reset", group: "System", label: "Reset current selection", icon: "refresh", onSelect: () => st().resetScope() },
      ...STARTERS.map((s) => ({ id: `start-${s.meta.id}`, group: "Start from", label: s.meta.name, hint: s.meta.tags?.join(" · "), icon: "palette" as const, onSelect: () => st().commit(cloneSystem(s, { id: s.meta.id, name: s.meta.name }), `start from ${s.meta.name}`) })),
      ...COMPONENTS.map((c) => ({ id: `c-${c.type}`, group: "Edit component", label: c.label, hint: c.category, icon: "box" as const, keywords: [c.type], onSelect: () => (st().setScope({ component: c.type }), go("edit")) })),
      ...PREVIEW_PAGES.map((p) => ({ id: `p-${p.path}`, group: "Page", label: p.title, hint: p.group, icon: p.icon, onSelect: () => st().set({ page: p.path, instances: [] }) })),
      { id: "inspect", group: "Canvas", label: "Toggle select mode", icon: "cursor", shortcut: ["I"], onSelect: () => st().set({ inspect: !st().inspect }) },
      { id: "compare", group: "Canvas", label: "Toggle before / after", icon: "layout", onSelect: () => st().set({ compare: !st().compare }) },
      { id: "dark", group: "Canvas", label: "Toggle light / dark", icon: "moon", onSelect: () => st().set({ mode: st().mode === "dark" ? "light" : "dark" }) },
      ...(Object.keys(DEVICES) as Device[]).map((d) => ({ id: `d-${d}`, group: "Canvas", label: `Device: ${DEVICES[d].label}`, icon: "layout" as const, onSelect: () => st().set({ device: d }) })),
      { id: "replay", group: "Canvas", label: "Replay animations", icon: "play", onSelect: () => window.dispatchEvent(new Event("studio:replay")) },
    ];
  }, []);
  return <CommandPalette open={open} onOpenChange={setOpen} items={items} placeholder="Search actions, components, pages…" label="Studio commands" />;
}

/* ---------------- shell ---------------- */

export function Studio() {
  const [palette, setPalette] = useState(false);
  const [welcome, setWelcome] = useState(false);
  const ui = useUiPrefs();
  const firstRun = useCallback(() => setWelcome(true), []);
  usePersistence(firstRun);
  // The Studio's chrome runs its own fixed system.
  useEffect(() => {
    applySystem(STUDIO_SYSTEM);
    applyMode("system", false);
  }, []);
  return (
    <Toaster>
      <div className="st-shell">
        <TopBar onPalette={() => setPalette(true)} onHelp={() => setWelcome(true)} ui={ui} />
        <div className="st-body">
          <Rail ui={ui} />
          <PanelHost width={ui.width} setWidth={ui.setWidth} />
          <main className="st-center" aria-label="Canvas">
            <Canvas />
            <CanvasDock />
          </main>
        </div>
      </div>
      <Shortcuts openPalette={() => setPalette((v) => !v)} />
      <Palette open={palette} setOpen={setPalette} />
      <Welcome open={welcome} setOpen={setWelcome} />
    </Toaster>
  );
}
