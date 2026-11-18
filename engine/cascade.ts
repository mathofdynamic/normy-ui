import { BREAKPOINTS, type DesignSystem, type Props, type RecipeRule, type Rule, type Scope, type Value } from "./types";
import type { ComponentDef } from "./types";

/* ------------------------------------------------------------------ *
 * The rule cascade:
 * Global < Component < Variant/size < Part < Instance < State < Breakpoint < Mode
 * ------------------------------------------------------------------ */

export const WEIGHTS = {
  component: 1,
  variant: 2,
  size: 2,
  part: 4,
  instance: 8,
  state: 16,
  bp: 32,
  mode: 64,
} as const;

export const SCOPE_ORDER: Array<keyof Scope> = ["component", "variant", "size", "part", "instance", "state", "bp", "mode"];

/** Normalise a scope: drop empty fields and the implicit root part. */
export function normalizeScope(scope: Scope): Scope {
  const out: Scope = {};
  for (const k of SCOPE_ORDER) {
    const v = scope[k];
    if (v === undefined || v === null || v === "") continue;
    if (k === "part" && v === "root") continue;
    (out as Record<string, string>)[k] = v;
  }
  return out;
}

export function score(scope: Scope): number {
  const s = normalizeScope(scope);
  let n = 0;
  for (const k of SCOPE_ORDER) if (s[k] !== undefined) n += WEIGHTS[k as keyof typeof WEIGHTS];
  return n;
}

/** Stable identity of a scope, used as rule id. */
export function scopeKey(scope: Scope): string {
  const s = normalizeScope(scope);
  const key = SCOPE_ORDER.filter((k) => s[k] !== undefined)
    .map((k) => `${k}=${s[k]}`)
    .join("|");
  return key || "global";
}

export function scopeLabel(scope: Scope): string {
  const s = normalizeScope(scope);
  if (!Object.keys(s).length) return "Global";
  const bits: string[] = [];
  if (s.component) bits.push(s.component);
  if (s.variant) bits.push(`·${s.variant}`);
  if (s.size) bits.push(`·${s.size}`);
  if (s.part) bits.push(` › ${s.part}`);
  if (s.instance) bits.push(` #${s.instance}`);
  if (s.state) bits.push(` :${s.state}`);
  if (s.bp) bits.push(` @${s.bp}`);
  if (s.mode) bits.push(` (${s.mode})`);
  return bits.join("");
}

/** Does a rule with `rule` scope apply to an element described by `target`? */
export function matches(rule: Scope, target: Scope): boolean {
  const r = normalizeScope(rule);
  const t = normalizeScope(target);
  if (!r.component) return true; // global rules reach everything (via inheritance)
  if (r.component !== t.component) return false;
  for (const k of ["variant", "size", "instance", "state", "mode"] as const) {
    if (r[k] !== undefined && r[k] !== t[k]) return false;
  }
  if ((r.part ?? "root") !== (t.part ?? "root")) return false;
  if (r.bp) {
    if (!t.bp) return false;
    if (BREAKPOINTS.indexOf(r.bp) > BREAKPOINTS.indexOf(t.bp)) return false;
  }
  return true;
}

export interface OrderedRule {
  scope: Scope;
  props: Props;
  source: "recipe" | "system";
  index: number;
  score: number;
  id: string;
}

/** Merge recipe + system rules and sort them into emission (= priority) order. */
export function orderRules(components: ComponentDef[], system: DesignSystem, extra: Rule[] = []): OrderedRule[] {
  const out: OrderedRule[] = [];
  let i = 0;
  for (const def of components) {
    for (const r of def.recipe as RecipeRule[]) {
      const scope = normalizeScope({ ...r.scope, component: def.type });
      out.push({ scope, props: r.props, source: "recipe", index: i++, score: score(scope), id: `recipe:${def.type}:${i}` });
    }
  }
  for (const r of [...system.rules, ...extra]) {
    const scope = normalizeScope(r.scope);
    out.push({ scope, props: r.props, source: "system", index: i++, score: score(scope), id: r.id });
  }
  out.sort((a, b) => a.score - b.score || (a.source === b.source ? 0 : a.source === "recipe" ? -1 : 1) || a.index - b.index);
  return out;
}

export interface Explanation {
  value: Value | undefined;
  /** Where the winning value comes from. */
  origin: "here" | "inherited" | "recipe" | "token-default" | "unset";
  /** Label of the scope that provided it. */
  from?: string;
  /** All contributing values, lowest priority first. */
  chain: Array<{ value: Value; source: "recipe" | "system"; scope: Scope; label: string }>;
}

/** Explain how a property resolves for a target scope. */
export function explain(ordered: OrderedRule[], target: Scope, propId: string): Explanation {
  const key = scopeKey(target);
  const chain: Explanation["chain"] = [];
  for (const r of ordered) {
    if (!(propId in r.props)) continue;
    if (!matches(r.scope, target)) continue;
    chain.push({ value: r.props[propId], source: r.source, scope: r.scope, label: scopeLabel(r.scope) });
  }
  const last = chain.at(-1);
  if (!last) return { value: undefined, origin: "unset", chain };
  const here = last.source === "system" && scopeKey(last.scope) === key;
  return {
    value: last.value,
    origin: here ? "here" : last.source === "recipe" ? "recipe" : "inherited",
    from: last.label,
    chain,
  };
}
