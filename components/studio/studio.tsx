"use client";

import NextLink from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Badge, Button, CommandPalette, Dropdown, IconButton, SegmentedControl, Toaster, Tooltip, useCommandShortcut, useToast, type CommandItem } from "@/components/normy";
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
import { Inspector } from "./inspector";
import { ExportPanel, HistoryPanel, saveCurrent, SystemsPanel } from "./panels";
import { ScopeTree } from "./scope-tree";
import { DEVICES, useStudio, type Device } from "./store";

const DRAFT_KEY = "normy:studio-draft";

/** Autosave the draft, publish it as the active system for every other page/tab. */
function usePersistence() {
  useEffect(() => {
    // Restore draft
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        const sys = parseSystem(d.system);
        useStudio.getState().load(sys, d.savedId ?? null);
        if (d.baseline) useStudio.setState({ baseline: parseSystem(d.baseline) });
        if (d.page) useStudio.setState({ page: d.page });
      }
    } catch {
      /* ignore corrupt drafts */
    }
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
  }, []);
}

function TopBar({ onPalette }: { onPalette: () => void }) {
  const system = useStudio((s) => s.system);
  const baseline = useStudio((s) => s.baseline);
  const past = useStudio((s) => s.past);
  const future = useStudio((s) => s.future);
  const device = useStudio((s) => s.device);
  const mode = useStudio((s) => s.mode);
  const inspect = useStudio((s) => s.inspect);
  const compare = useStudio((s) => s.compare);
  const force = useStudio((s) => s.force);
  const speed = useStudio((s) => s.speed);
  const motionOff = useStudio((s) => s.motionOff);
  const st = useStudio.getState();
  const toast = useToast();
  const dirty = system !== baseline && JSON.stringify(system) !== JSON.stringify(baseline);

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
      <div className="st-top-group">
        <NextLink href="/" aria-label="Normy home" style={{ display: "inline-flex", color: "inherit" }}>
          <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden fill="none">
            <path d="M1 6V1h5M14 1h5v5M19 14v5h-5M6 19H1v-5" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="10" cy="10" r="3" fill="var(--n-color-accent)" />
          </svg>
        </NextLink>
        <input
          className="st-name"
          aria-label="System name"
          value={system.meta.name}
          onChange={(e) => st.commit({ ...system, meta: { ...system.meta, name: e.target.value } }, "rename", true)}
        />
        {dirty ? <span className="st-dirty" title="Unsaved changes" /> : null}
      </div>
      <span className="st-sep" />
      <div className="st-top-group">
        <Tooltip content="Undo" shortcut="Ctrl Z">
          <IconButton icon="arrow-left" label="Undo" size="sm" onClick={st.undo} disabled={!past.length} />
        </Tooltip>
        <Tooltip content="Redo" shortcut="Ctrl ⇧ Z">
          <IconButton icon="arrow-right" label="Redo" size="sm" onClick={st.redo} disabled={!future.length} />
        </Tooltip>
      </div>
      <span className="st-sep" />
      <div className="st-top-group">
        <SegmentedControl<Device>
          label="Device"
          size="sm"
          value={device}
          onValueChange={(d) => st.set({ device: d })}
          options={(Object.keys(DEVICES) as Device[]).map((d) => ({ value: d, label: d === "fit" ? "Fit" : DEVICES[d].width! }))}
        />
        <SegmentedControl
          label="Colour mode"
          size="sm"
          value={mode}
          onValueChange={(m) => st.set({ mode: m })}
          options={[
            { value: "light", label: "Light" },
            { value: "dark", label: "Dark" },
          ]}
        />
      </div>
      <span className="st-sep" />
      <div className="st-top-group">
        <Tooltip content="Inspect: click any element in the canvas" shortcut="I">
          <Button size="sm" variant={inspect ? "solid" : "outline"} icon="cursor" onClick={() => st.set({ inspect: !inspect })} aria-pressed={inspect}>
            Inspect
          </Button>
        </Tooltip>
        <Dropdown
          trigger={
            <Button size="sm" variant={force.length ? "soft" : "outline"} iconEnd="chevron-down">
              {force.length ? `Force: ${force.join(", ")}` : "Force state"}
            </Button>
          }
          items={[
            { type: "label", label: "Freeze the selected component in…" },
            ...STATES.map((s) => ({ label: `${force.includes(s) ? "✓ " : ""}${s}`, onSelect: () => st.set({ force: force.includes(s) ? force.filter((x) => x !== s) : [...force, s as StateName] }) })),
            { type: "separator" as const },
            { label: "Clear", onSelect: () => st.set({ force: [] }) },
          ]}
        />
        <Tooltip content="Before / after: last saved vs. current">
          <Button size="sm" variant={compare ? "solid" : "outline"} icon="layout" onClick={() => st.set({ compare: !compare })} aria-pressed={compare}>
            Compare
          </Button>
        </Tooltip>
        <Tooltip content="Replay entrance animations">
          <IconButton icon="play" label="Replay animations" size="sm" variant="outline" onClick={() => window.dispatchEvent(new Event("studio:replay"))} />
        </Tooltip>
        <Dropdown
          trigger={
            <Button size="sm" variant={speed !== 1 || motionOff ? "soft" : "outline"} icon="zap">
              {motionOff ? "Motion off" : `${speed}×`}
            </Button>
          }
          items={[
            { type: "label", label: "Preview motion (not saved)" },
            ...[0.25, 0.5, 1, 2].map((v) => ({ label: `${speed === v ? "✓ " : ""}Speed ${v}×`, onSelect: () => st.set({ speed: v }) })),
            { type: "separator" as const },
            { label: `${motionOff ? "✓ " : ""}Disable all motion`, onSelect: () => st.set({ motionOff: !motionOff }) },
          ]}
        />
      </div>
      <div className="st-top-group" style={{ marginLeft: "auto" }}>
        <Button size="sm" variant="ghost" icon="command" onClick={onPalette}>
          Commands
        </Button>
        <Button size="sm" variant="outline" icon="external" href={useStudio.getState().page}>
          Open page
        </Button>
        <Button size="sm" icon="download" onClick={save}>
          Save
        </Button>
      </div>
    </header>
  );
}

function RightPane() {
  const tab = useStudio((s) => s.rightTab);
  const set = useStudio((s) => s.set);
  const rules = useStudio((s) => s.system.rules.length);
  return (
    <aside className="st-pane st-pane-right" aria-label="Inspector">
      <div className="st-pane-head" style={{ paddingBottom: "var(--n-space-2)" }}>
        <SegmentedControl
          label="Right panel"
          size="sm"
          block
          value={tab}
          onValueChange={(v) => set({ rightTab: v })}
          options={[
            { value: "inspect", label: "Inspect" },
            { value: "systems", label: "Systems" },
            { value: "export", label: "Export" },
            { value: "history", label: "History" },
          ]}
        />
      </div>
      <div style={{ display: "flex", flexDirection: "column", minHeight: 0, flex: 1, borderTop: "1px solid var(--n-color-border)" }}>
        {tab === "inspect" ? <Inspector /> : tab === "systems" ? <SystemsPanel /> : tab === "export" ? <ExportPanel /> : <HistoryPanel />}
      </div>
      <div className="st-canvas-bar" style={{ borderTop: "1px solid var(--n-color-border)", borderBottom: 0 }}>
        <Badge size="sm">{rules} rules</Badge>
        <span className="st-unit">autosaved locally</span>
      </div>
    </aside>
  );
}

function CanvasBar() {
  const page = useStudio((s) => s.page);
  const picked = useStudio((s) => s.picked);
  const set = useStudio((s) => s.set);
  const current = PREVIEW_PAGES.find((p) => p.path === page);
  return (
    <div className="st-canvas-bar">
      <select className="st-in" style={{ flex: "0 0 14rem" }} aria-label="Preview page" value={current ? page : ""} onChange={(e) => set({ page: e.target.value, instances: [] })}>
        {!current ? <option value="">{page}</option> : null}
        {PREVIEW_PAGES.map((p) => (
          <option key={p.path} value={p.path}>
            {p.group} · {p.title}
          </option>
        ))}
      </select>
      <span className="st-unit" style={{ whiteSpace: "nowrap" }}>
        {picked ? `picked ${picked.label}` : "Tip: turn on Inspect and click anything"}
      </span>
    </div>
  );
}

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
      } else if (!typing && !mod && e.key.toLowerCase() === "i") st.set({ inspect: !st.inspect });
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
    return [
      { id: "save", group: "System", label: "Save system", icon: "download", shortcut: ["Ctrl", "S"], onSelect: () => void saveCurrent() },
      { id: "undo", group: "System", label: "Undo", icon: "arrow-left", onSelect: () => st().undo() },
      { id: "redo", group: "System", label: "Redo", icon: "arrow-right", onSelect: () => st().redo() },
      { id: "export", group: "System", label: "Export…", icon: "upload", onSelect: () => st().set({ rightTab: "export" }) },
      { id: "systems", group: "System", label: "Open systems & versions", icon: "layers", onSelect: () => st().set({ rightTab: "systems" }) },
      { id: "copy", group: "System", label: "Copy styles from current scope", icon: "copy", onSelect: () => st().copyScope() },
      { id: "paste", group: "System", label: "Paste styles into current scope", icon: "download", onSelect: () => st().pasteScope() },
      { id: "reset", group: "System", label: "Reset current scope", icon: "refresh", onSelect: () => st().resetScope() },
      ...STARTERS.map((s) => ({ id: `start-${s.meta.id}`, group: "Apply starter", label: s.meta.name, hint: s.meta.tags?.join(" · "), icon: "palette" as const, onSelect: () => st().load(cloneSystem(s, { id: s.meta.id, name: s.meta.name }), null) })),
      { id: "tokens", group: "Scope", label: "Global tokens", icon: "palette", onSelect: () => st().setScope({}) },
      ...COMPONENTS.map((c) => ({ id: `c-${c.type}`, group: "Scope", label: c.label, hint: c.category, icon: "box" as const, keywords: [c.type], onSelect: () => st().setScope({ component: c.type }) })),
      ...PREVIEW_PAGES.map((p) => ({ id: `p-${p.path}`, group: "Page", label: p.title, hint: p.group, icon: p.icon, onSelect: () => st().set({ page: p.path, instances: [] }) })),
      { id: "inspect", group: "Canvas", label: "Toggle inspect mode", icon: "cursor", shortcut: ["I"], onSelect: () => st().set({ inspect: !st().inspect }) },
      { id: "compare", group: "Canvas", label: "Toggle before / after", icon: "layout", onSelect: () => st().set({ compare: !st().compare }) },
      { id: "dark", group: "Canvas", label: "Toggle light / dark", icon: "moon", onSelect: () => st().set({ mode: st().mode === "dark" ? "light" : "dark" }) },
      ...(Object.keys(DEVICES) as Device[]).map((d) => ({ id: `d-${d}`, group: "Canvas", label: `Device: ${DEVICES[d].label}`, icon: "layout" as const, onSelect: () => st().set({ device: d }) })),
      { id: "replay", group: "Canvas", label: "Replay animations", icon: "play", onSelect: () => window.dispatchEvent(new Event("studio:replay")) },
    ];
  }, []);
  return <CommandPalette open={open} onOpenChange={setOpen} items={items} placeholder="Scope, page, starter, action…" label="Studio commands" />;
}

export function Studio() {
  const [palette, setPalette] = useState(false);
  usePersistence();
  // The Studio's chrome runs its own fixed system.
  useEffect(() => {
    applySystem(STUDIO_SYSTEM);
    applyMode("system", false);
  }, []);
  return (
    <Toaster>
      <div className="st-shell">
        <TopBar onPalette={() => setPalette(true)} />
        <div className="st-body">
          <aside className="st-pane st-pane-left" aria-label="Scopes and pages">
            <ScopeTree />
          </aside>
          <main className="st-center" aria-label="Canvas">
            <CanvasBar />
            <Canvas />
          </main>
          <RightPane />
        </div>
      </div>
      <Shortcuts openPalette={() => setPalette((v) => !v)} />
      <Palette open={palette} setOpen={setPalette} />
    </Toaster>
  );
}
