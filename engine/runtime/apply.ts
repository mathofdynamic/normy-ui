"use client";

import { compile, type CompileResult } from "../compile";
import { COMPONENTS } from "../components";
import { getDef } from "../registry";
import type { DesignSystem, Rule } from "../types";

/* ------------------------------------------------------------------ *
 * Client runtime: inject compiled CSS into one <style>, sync html
 * attributes (mode, motion policy), cache for the boot script and
 * tell the motion runtime to rescan.
 * ------------------------------------------------------------------ */

export const STYLE_ID = "normy-engine";
export const LS_SYSTEM = "normy:active-system";
export const LS_CSS = "normy:active-css";
export const LS_MODE = "normy:mode";

export type ModePref = "system" | "light" | "dark";

let current: { system: DesignSystem; result: CompileResult } | null = null;
const listeners = new Set<(r: CompileResult, s: DesignSystem) => void>();

export function onApply(fn: (r: CompileResult, s: DesignSystem) => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function currentSystem() {
  return current?.system ?? null;
}
export function currentResult() {
  return current?.result ?? null;
}

function styleEl(): HTMLStyleElement {
  let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.id = STYLE_ID;
    document.head.appendChild(el);
  }
  return el;
}

export interface ApplyOptions {
  extra?: Rule[];
  /** Persist as the active system for other pages / tabs / the boot script. */
  persist?: boolean;
}

export function applySystem(system: DesignSystem, opts: ApplyOptions = {}): CompileResult {
  const result = compile(system, COMPONENTS, { extra: opts.extra });
  const el = styleEl();
  if (el.textContent !== result.css) el.textContent = result.css;
  syncMotionAttrs(system);
  current = { system, result };
  if (opts.persist) {
    try {
      localStorage.setItem(LS_SYSTEM, JSON.stringify(system));
      localStorage.setItem(LS_CSS, result.css);
    } catch {
      /* quota / private mode */
    }
  }
  listeners.forEach((l) => l(result, system));
  document.dispatchEvent(new CustomEvent("normy:apply"));
  return result;
}

function syncMotionAttrs(system: DesignSystem) {
  const root = document.documentElement;
  const enabled = system.tokens["motion.enabled"] ?? getDef("motion.enabled")?.default;
  const reduce = (system.tokens["motion.reduce"] ?? getDef("motion.reduce")?.default) as string;
  root.dataset.nMotion = enabled === false ? "off" : reduce === "always" ? "reduce" : reduce === "never" ? "full" : "system";
}

/** True when animations should be skipped right now. */
export function motionReduced(): boolean {
  const m = document.documentElement.dataset.nMotion;
  if (m === "off" || m === "reduce") return true;
  if (m === "full") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function motionSpeed(): number {
  const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--n-motion-speed"));
  return Number.isFinite(v) && v > 0 ? v : 1;
}

/* ---------------- mode ---------------- */

export function resolveMode(pref: ModePref): "light" | "dark" {
  if (pref === "system") return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  return pref;
}

export function applyMode(pref: ModePref, persist = true) {
  document.documentElement.classList.toggle("dark", resolveMode(pref) === "dark");
  document.documentElement.dataset.nModePref = pref;
  if (persist) {
    try {
      localStorage.setItem(LS_MODE, pref);
    } catch {
      /* ignore */
    }
  }
}

export function storedMode(): ModePref {
  try {
    const v = localStorage.getItem(LS_MODE);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

export function storedSystem(): DesignSystem | null {
  try {
    const raw = localStorage.getItem(LS_SYSTEM);
    return raw ? (JSON.parse(raw) as DesignSystem) : null;
  } catch {
    return null;
  }
}

/** Inline script for <head>: paint the cached system + mode before hydration. */
export const BOOT_SCRIPT = `(function(){try{var d=document.documentElement;var p=location.pathname;if(p.indexOf('/studio')===0)return;var c=localStorage.getItem('${LS_CSS}');if(c){var s=document.getElementById('${STYLE_ID}');if(s){s.textContent=c;}}var m=localStorage.getItem('${LS_MODE}')||'system';var dk=m==='dark'||(m==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);if(dk)d.classList.add('dark');d.dataset.nModePref=m;if(!matchMedia('(prefers-reduced-motion: reduce)').matches){d.setAttribute('data-n-pre','');setTimeout(function(){d.removeAttribute('data-n-pre');},2500);}}catch(e){}})();`;
