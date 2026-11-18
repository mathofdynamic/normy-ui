"use client";

import { useLayoutEffect, useState, type CSSProperties, type RefObject } from "react";

/**
 * Measures the selected item inside a container and returns CSS vars
 * (--n-ind-x / --n-ind-w / --n-ind-y / --n-ind-h) for a sliding indicator.
 * The indicator's motion (duration, easing, spring) comes from rules.
 */
export function useIndicator(container: RefObject<HTMLElement | null>, selector: string, deps: unknown[]): CSSProperties {
  const [vars, setVars] = useState<CSSProperties>({ opacity: 0 });
  useLayoutEffect(() => {
    const root = container.current;
    if (!root) return;
    const measure = () => {
      const el = root.querySelector<HTMLElement>(selector);
      if (!el) {
        setVars({ opacity: 0 });
        return;
      }
      setVars({
        "--n-ind-x": `${el.offsetLeft}px`,
        "--n-ind-w": `${el.offsetWidth}px`,
        "--n-ind-y": `${el.offsetTop}px`,
        "--n-ind-h": `${el.offsetHeight}px`,
      } as CSSProperties);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return vars;
}
