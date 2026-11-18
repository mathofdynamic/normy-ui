import { scopeKey } from "./cascade";
import type { DesignSystem, Value } from "./types";

/* Flatten two systems to path → JSON value and diff them. */

const v = (x: Value | undefined) => (x === undefined ? undefined : typeof x === "object" && x !== null ? JSON.stringify(x) : String(x));

export function flatten(s: DesignSystem): Record<string, string> {
  const out: Record<string, string> = {};
  out["meta.name"] = s.meta.name;
  if (s.meta.description) out["meta.description"] = s.meta.description;
  for (const [k, x] of Object.entries(s.tokens)) out[`token ${k}`] = v(x)!;
  for (const [k, x] of Object.entries(s.dark)) out[`token ${k} (dark)`] = v(x)!;
  for (const r of s.rules) for (const [k, x] of Object.entries(r.props)) out[`${scopeKey(r.scope)} › ${k}`] = v(x)!;
  for (const [c, cfg] of Object.entries(s.components)) {
    if (cfg.variants?.length) out[`${c} variants`] = cfg.variants.join(", ");
    if (cfg.sizes?.length) out[`${c} sizes`] = cfg.sizes.join(", ");
  }
  return out;
}

export interface DiffEntry {
  path: string;
  kind: "added" | "removed" | "changed";
  before?: string;
  after?: string;
}

export function diffSystems(a: DesignSystem, b: DesignSystem): DiffEntry[] {
  const fa = flatten(a);
  const fb = flatten(b);
  const keys = [...new Set([...Object.keys(fa), ...Object.keys(fb)])].sort();
  const out: DiffEntry[] = [];
  for (const k of keys) {
    if (!(k in fa)) out.push({ path: k, kind: "added", after: fb[k] });
    else if (!(k in fb)) out.push({ path: k, kind: "removed", before: fa[k] });
    else if (fa[k] !== fb[k]) out.push({ path: k, kind: "changed", before: fa[k], after: fb[k] });
  }
  return out;
}
