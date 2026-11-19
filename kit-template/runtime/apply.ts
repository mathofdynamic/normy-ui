/* Kit shim for the motion runtime: the system is pre-compiled into styles/normy.css,
 * so the runtime only needs the static motion manifest and the motion policy. */
import { MANIFEST } from "./manifest";

export function currentResult() {
  return { manifest: MANIFEST };
}

/** The kit's system never changes at runtime; nothing to subscribe to. */
export function onApply(fn: (...args: unknown[]) => void) {
  void fn;
  return () => {};
}

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
