"use client";

import { create } from "zustand";
import { normalizeScope, scopeKey } from "@/engine/cascade";
import { clearScope, cloneSystem, findRule, setProp, setProps, setToken, touch } from "@/engine/system";
import { DEFAULT_SYSTEM } from "@/engine/systems";
import type { DesignSystem, Props, Scope, StateName, Value } from "@/engine/types";
import type { PickedTarget } from "@/engine/runtime/channel";

export type Device = "mobile" | "tablet" | "desktop" | "fit";
export const DEVICES: Record<Device, { label: string; width: number | null }> = {
  mobile: { label: "Phone · 390", width: 390 },
  tablet: { label: "Tablet · 768", width: 768 },
  desktop: { label: "Desktop · 1440", width: 1440 },
  fit: { label: "Fit", width: null },
};

export type Panel = "style" | "edit" | "motion" | "pages" | "components" | "guide" | "library" | "export" | "history";

export interface HistoryEntry {
  system: DesignSystem;
  label: string;
  at: number;
}

export interface StudioState {
  system: DesignSystem;
  /** Last saved/loaded version, for compare + dirty state. */
  baseline: DesignSystem;
  savedId: string | null;
  past: HistoryEntry[];
  future: HistoryEntry[];
  lastLabel: string;

  scope: Scope;
  page: string;
  device: Device;
  mode: "light" | "dark";
  inspect: boolean;
  force: StateName[];
  compare: boolean;
  search: string;
  rightTab: "inspect" | "systems" | "export" | "history";
  leftTab: "scope" | "pages" | "instances";
  /** Which panel the rail shows. */
  panel: Panel;
  /** Last canvas page in each view, so the Pages | Components switch returns to it. */
  lastPage: string;
  lastComponentPage: string;
  lastMotionPage: string;
  panelOpen: boolean;
  /** Full cascade inspector instead of the simple editor. */
  advanced: boolean;
  clipboard: { props: Props; from: string } | null;
  instances: Array<{ id: string; component: string; variant?: string }>;
  pageComponents: Record<string, string[]>;
  picked: PickedTarget | null;
  speed: number;
  motionOff: boolean;

  commit: (next: DesignSystem, label: string, merge?: boolean) => void;
  undo: () => void;
  redo: () => void;
  jump: (index: number) => void;
  setScope: (s: Scope) => void;
  patchScope: (s: Partial<Scope>) => void;
  setPropAt: (prop: string, value: Value | undefined) => void;
  setTokenValue: (id: string, value: Value | undefined, mode?: "light" | "dark") => void;
  resetScope: () => void;
  copyScope: () => void;
  pasteScope: () => void;
  load: (s: DesignSystem, savedId?: string | null) => void;
  markSaved: (s: DesignSystem, id: string) => void;
  set: (p: Partial<StudioState>) => void;
}

const MAX_HISTORY = 200;

export const useStudio = create<StudioState>((set, get) => ({
  system: DEFAULT_SYSTEM,
  baseline: DEFAULT_SYSTEM,
  savedId: null,
  past: [],
  future: [],
  lastLabel: "",
  scope: {},
  page: "/preview/saas",
  device: "fit",
  mode: "light",
  inspect: false,
  force: [],
  compare: false,
  search: "",
  rightTab: "inspect",
  leftTab: "scope",
  panel: "style",
  lastPage: "/preview/saas",
  lastComponentPage: "/preview/components",
  lastMotionPage: "/preview/motion-studio/entrance",
  panelOpen: true,
  advanced: false,
  clipboard: null,
  instances: [],
  pageComponents: {},
  picked: null,
  speed: 1,
  motionOff: false,

  commit: (next, label, merge = false) => {
    const { system, past, lastLabel } = get();
    // Merge rapid edits of the same control (slider drags) into one history step.
    const coalesce = merge && lastLabel === label && past.length > 0;
    set({
      system: next,
      past: coalesce ? past : [...past, { system, label, at: Date.now() }].slice(-MAX_HISTORY),
      future: [],
      lastLabel: label,
    });
  },
  undo: () => {
    const { past, system, future, lastLabel } = get();
    const prev = past.at(-1);
    if (!prev) return;
    set({ system: prev.system, past: past.slice(0, -1), future: [{ system, label: lastLabel, at: Date.now() }, ...future], lastLabel: "" });
  },
  redo: () => {
    const { past, system, future, lastLabel } = get();
    const next = future[0];
    if (!next) return;
    set({ system: next.system, future: future.slice(1), past: [...past, { system, label: lastLabel, at: Date.now() }], lastLabel: next.label });
  },
  jump: (index) => {
    const { past, system, lastLabel } = get();
    const target = past[index];
    if (!target) return;
    const undone = [...past.slice(index + 1), { system, label: lastLabel, at: Date.now() }];
    set({ system: target.system, past: past.slice(0, index), future: undone, lastLabel: "" });
  },
  setScope: (s) => set({ scope: normalizeScope(s) }),
  patchScope: (s) => set({ scope: normalizeScope({ ...get().scope, ...s }) }),
  setPropAt: (prop, value) => {
    const { system, scope, commit } = get();
    commit(setProp(system, scope, prop, value), `${scopeKey(scope)} · ${prop}`, true);
  },
  setTokenValue: (id, value, mode = "light") => {
    const { system, commit } = get();
    commit(setToken(system, id, value, mode), `token ${id}${mode === "dark" ? " (dark)" : ""}`, true);
  },
  resetScope: () => {
    const { system, scope, commit } = get();
    if (!scope.component && !scope.instance) {
      commit(touch({ ...system, tokens: {}, dark: {} }), "reset tokens");
      return;
    }
    commit(clearScope(system, scope), `reset ${scopeKey(scope)}`);
  },
  copyScope: () => {
    const { system, scope } = get();
    const rule = findRule(system, scope);
    set({ clipboard: { props: { ...(rule?.props ?? {}) }, from: scopeKey(scope) } });
  },
  pasteScope: () => {
    const { system, scope, clipboard, commit } = get();
    if (!clipboard) return;
    commit(setProps(system, scope, clipboard.props), `paste ${clipboard.from} → ${scopeKey(scope)}`);
  },
  load: (s, savedId = null) => set({ system: s, baseline: s, savedId, past: [], future: [], lastLabel: "" }),
  markSaved: (s, id) => set({ baseline: s, savedId: id, system: s }),
  set: (p) => set(p),
}));

export const newSystemFrom = (base: DesignSystem, name: string) =>
  cloneSystem(base, { id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `system-${Date.now()}`, name });
