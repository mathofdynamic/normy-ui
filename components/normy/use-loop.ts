"use client";

import { useEffect, useRef, type RefObject } from "react";
import { prefersReducedMotion } from "./use-behavior";

/* ------------------------------------------------------------------ *
 * Helpers for loop components (category "loops").
 * CSS loops only need loopRoot(); JS loops (canvas, rAF counters) also use
 * useLoopFrame(), which honours the same controls as CSS loops:
 * loop length/speed/direction from the cascade, pause on hover, pause off
 * screen (runtime sets data-n-paused), master motion speed and reduced motion.
 * ------------------------------------------------------------------ */

/**
 * Spread on the root element of every loop component. The runtime toggles data-n-paused on it
 * (off screen), which can happen before React hydrates streamed content: hence suppressHydrationWarning.
 */
export const loopRoot = { "data-n-loop": "", suppressHydrationWarning: true } as const;

export interface LoopValues {
  /** One cycle at 1× speed, ms. */
  duration: number;
  /** Effective speed: loop speed × master motion speed. */
  speed: number;
  /** 1 = normal, -1 = reverse. */
  direction: 1 | -1;
  intensity: number;
}

const msOf = (v: string, fb: number) => {
  const n = parseFloat(v);
  if (!Number.isFinite(n)) return fb;
  return /ms\s*$/.test(v) ? n : /s\s*$/.test(v) ? n * 1000 : n;
};

/** Read the loop controls that apply to an element right now. */
export function readLoop(el: Element, fallbackMs = 20000): LoopValues {
  const cs = getComputedStyle(el);
  const v = (n: string) => cs.getPropertyValue(n).trim();
  const speed = (parseFloat(v("--n-loop-speed")) || 1) * (parseFloat(v("--n-motion-loop-speed")) || 1) * (parseFloat(v("--n-motion-speed")) || 1);
  return {
    duration: msOf(v("--n-loop-duration"), fallbackMs),
    speed,
    direction: v("--n-loop-direction") === "reverse" ? -1 : 1,
    intensity: v("--n-loop-intensity") ? parseFloat(v("--n-loop-intensity")) : 1,
  };
}

/**
 * Run `frame(progress, values)` every animation frame, where progress is the
 * position in the current cycle (0–1, already respecting speed and direction).
 * Pauses while hovered (when the cascade says so), off screen and under reduced motion.
 */
export function useLoopFrame(ref: RefObject<HTMLElement | null>, frame: (progress: number, values: LoopValues) => void, fallbackMs = 20000) {
  const cb = useRef(frame);
  useEffect(() => {
    cb.current = frame;
  });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let values = readLoop(el, fallbackMs);
    let p = 0;
    let last = performance.now();
    let raf = 0;
    let hover = false;
    const refresh = () => (values = readLoop(el, fallbackMs));
    const enter = () => (hover = getComputedStyle(el).getPropertyValue("--n-loop-state").trim() === "paused");
    const leave = () => (hover = false);
    el.addEventListener("pointerenter", enter);
    el.addEventListener("pointerleave", leave);
    document.addEventListener("normy:apply", refresh);
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      if (!hover && !el.hasAttribute("data-n-paused") && !prefersReducedMotion()) {
        p = (p + (values.direction * dt * values.speed) / Math.max(1, values.duration) + 1) % 1;
      }
      cb.current(p, values);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointerenter", enter);
      el.removeEventListener("pointerleave", leave);
      document.removeEventListener("normy:apply", refresh);
    };
  }, [ref, fallbackMs]);
}
