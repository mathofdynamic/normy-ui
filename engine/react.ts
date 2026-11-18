import type { CSSProperties } from "react";

/* Attribute helpers shared by every Normy component. Server-safe (no hooks). */

export interface NProps {
  /** Variant name (library or user-defined in the Studio). */
  variant?: string;
  /** Size name. */
  size?: string;
  /** Instance id: target this exact element with Instance-scope rules. */
  nid?: string;
}

export interface NStates {
  disabled?: boolean;
  loading?: boolean;
  selected?: boolean;
  invalid?: boolean;
  open?: boolean;
  current?: boolean;
  dragging?: boolean;
}

const flag = (b: boolean | undefined) => (b ? "" : undefined);

export function nRoot(type: string, p: NProps, defaults: { variant?: string; size?: string } = {}, s: NStates = {}) {
  return {
    "data-n": type,
    "data-n-variant": p.variant ?? defaults.variant,
    "data-n-size": p.size ?? defaults.size,
    "data-n-id": p.nid,
    "data-disabled": flag(s.disabled),
    "data-loading": flag(s.loading),
    "data-selected": flag(s.selected),
    "data-invalid": flag(s.invalid),
    "data-open": flag(s.open),
    "data-current": flag(s.current),
    "data-dragging": flag(s.dragging),
  } as Record<string, string | undefined>;
}

export const nPart = (type: string, part: string, s: NStates = {}) =>
  ({
    "data-n-part": `${type}.${part}`,
    "data-disabled": flag(s.disabled),
    "data-selected": flag(s.selected),
    "data-current": flag(s.current),
    "data-open": flag(s.open),
    "data-invalid": flag(s.invalid),
  }) as Record<string, string | undefined>;

/* ---------------- token-based layout props ---------------- */

export type SpaceStep = 0 | 0.5 | 1 | 1.5 | 2 | 2.5 | 3 | 4 | 5 | 6 | 7 | 8 | 10 | 12 | 14 | 16 | 20 | 24 | 32;
export type Responsive<T> = T | { base?: T; md?: T; lg?: T };

/** Space step → token var. Pages never pass raw lengths. */
export const space = (n: SpaceStep) => `var(--n-space-${String(n).replace(".", "-")})`;

export function responsive<T>(name: string, v: Responsive<T> | undefined, map: (x: T) => string): CSSProperties {
  if (v === undefined) return {};
  const out: Record<string, string> = {};
  if (typeof v === "object" && v !== null && ("base" in v || "md" in v || "lg" in v)) {
    const r = v as { base?: T; md?: T; lg?: T };
    if (r.base !== undefined) out[name] = map(r.base);
    if (r.md !== undefined) out[`${name}-md`] = map(r.md);
    if (r.lg !== undefined) out[`${name}-lg`] = map(r.lg);
  } else out[name] = map(v as T);
  return out as CSSProperties;
}

export const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(" ") || undefined;
