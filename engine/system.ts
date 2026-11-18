import { scopeKey, normalizeScope } from "./cascade";
import type { DesignSystem, Props, Rule, Scope, Value } from "./types";

/* Helpers for building and editing systems immutably. */

export function createSystem(meta: Partial<DesignSystem["meta"]> & { id: string; name: string }, rest: Partial<Omit<DesignSystem, "meta" | "schema">> = {}): DesignSystem {
  const now = new Date().toISOString();
  return {
    schema: 1,
    meta: { createdAt: now, updatedAt: now, ...meta },
    tokens: rest.tokens ?? {},
    dark: rest.dark ?? {},
    rules: (rest.rules ?? []).map((r) => ({ ...r, id: r.id || scopeKey(r.scope), scope: normalizeScope(r.scope) })),
    components: rest.components ?? {},
  };
}

/** Shorthand for authoring rules in presets: r({ component: "button" }, { radius: 0 }). */
export function r(scope: Scope, props: Props, note?: string): Rule {
  return { id: scopeKey(scope), scope: normalizeScope(scope), props, note };
}

export function findRule(system: DesignSystem, scope: Scope): Rule | undefined {
  const key = scopeKey(scope);
  return system.rules.find((x) => scopeKey(x.scope) === key);
}

/** Set (or with value === undefined, remove) a property at an exact scope. */
export function setProp(system: DesignSystem, scope: Scope, prop: string, value: Value | undefined): DesignSystem {
  const key = scopeKey(scope);
  const rules = [...system.rules];
  const idx = rules.findIndex((x) => scopeKey(x.scope) === key);
  if (idx === -1) {
    if (value === undefined) return system;
    rules.push({ id: key, scope: normalizeScope(scope), props: { [prop]: value } });
  } else {
    const props = { ...rules[idx].props };
    if (value === undefined) delete props[prop];
    else props[prop] = value;
    if (Object.keys(props).length === 0) rules.splice(idx, 1);
    else rules[idx] = { ...rules[idx], props };
  }
  return touch({ ...system, rules });
}

export function setProps(system: DesignSystem, scope: Scope, props: Props): DesignSystem {
  let next = system;
  for (const [k, v] of Object.entries(props)) next = setProp(next, scope, k, v);
  return next;
}

export function clearScope(system: DesignSystem, scope: Scope): DesignSystem {
  const key = scopeKey(scope);
  return touch({ ...system, rules: system.rules.filter((x) => scopeKey(x.scope) !== key) });
}

export function setToken(system: DesignSystem, id: string, value: Value | undefined, mode: "light" | "dark" = "light"): DesignSystem {
  const field = mode === "dark" ? "dark" : "tokens";
  const map = { ...system[field] };
  if (value === undefined) delete map[id];
  else map[id] = value;
  return touch({ ...system, [field]: map });
}

export function touch(system: DesignSystem): DesignSystem {
  return { ...system, meta: { ...system.meta, updatedAt: new Date().toISOString() } };
}

export function cloneSystem(system: DesignSystem, meta: Partial<DesignSystem["meta"]>): DesignSystem {
  const now = new Date().toISOString();
  return {
    ...structuredClone(system),
    meta: { ...system.meta, createdAt: now, updatedAt: now, basedOn: system.meta.id, ...meta },
  };
}

/** Defensive parse of imported JSON. */
export function parseSystem(input: unknown): DesignSystem {
  const s = input as Partial<DesignSystem>;
  if (!s || typeof s !== "object" || !s.meta || typeof s.meta.id !== "string") throw new Error("Not a Normy design system (missing meta.id).");
  return createSystem(
    { ...s.meta, id: s.meta.id, name: s.meta.name ?? s.meta.id },
    { tokens: s.tokens ?? {}, dark: s.dark ?? {}, rules: Array.isArray(s.rules) ? s.rules : [], components: s.components ?? {} },
  );
}
