"use client";

import { useEffect, useState, type RefObject } from "react";

/** Event the engine runtime dispatches on <document> after every (re)apply. */
export const APPLY_EVENT = "normy:apply";

/**
 * Read behaviour properties (registry group "behavior") from the cascade.
 * They arrive as CSS custom properties `--n-b-<id>` on the element, so
 * any scope (component, variant, instance, breakpoint, mode) can set them.
 */
export function useBehavior<T extends Record<string, string>>(ref: RefObject<HTMLElement | null>, defaults: T): T {
  const [values, setValues] = useState<T>(defaults);
  useEffect(() => {
    const read = () => {
      const el = ref.current;
      if (!el) return;
      const cs = getComputedStyle(el);
      const next = { ...defaults };
      let changed = false;
      for (const k of Object.keys(defaults)) {
        const v = cs.getPropertyValue(`--n-b-${k}`).trim();
        if (v) (next as Record<string, string>)[k] = v;
      }
      setValues((prev) => {
        for (const k of Object.keys(next)) if (prev[k] !== next[k]) changed = true;
        return changed ? next : prev;
      });
    };
    read();
    document.addEventListener(APPLY_EVENT, read);
    return () => document.removeEventListener(APPLY_EVENT, read);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return values;
}

export const ms = (v: string, fallback: number) => {
  const n = parseFloat(v);
  if (!Number.isFinite(n)) return fallback;
  return /ms\s*$/.test(v) || !/s\s*$/.test(v) ? n : n * 1000;
};

export function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  const m = document.documentElement.dataset.nMotion;
  if (m === "off" || m === "reduce") return true;
  if (m === "full") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
