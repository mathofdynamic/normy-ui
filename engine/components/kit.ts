import type { ComponentDef, Props, RecipeRule } from "../types";

/* Small helpers that keep recipes readable. Recipes are still plain data. */

export const R = (scope: RecipeRule["scope"], props: Props): RecipeRule => ({ scope, props });
export const root = (props: Props): RecipeRule => R({}, props);
export const part = (name: string, props: Props, scope: RecipeRule["scope"] = {}): RecipeRule => R({ ...scope, part: name }, props);

export const motion: Props = {
  transitionProperty: "default",
  transitionDuration: "{duration.fast}",
  transitionEasing: "{easing.standard}",
};

export const focus = (partName?: string): RecipeRule => R({ state: "focus", part: partName }, { focusRing: "token" });
export const disabled = (partName?: string): RecipeRule =>
  R({ state: "disabled", part: partName }, { opacity: "{opacity.disabled}", cursor: "not-allowed" });

export const label: Props = {
  fontFamily: "{type.label-font}",
  fontSize: "{text.xs}",
  textTransform: "{type.label-case}",
  letterSpacing: "{tracking.caps}",
};

export const TONES = ["success", "warning", "danger", "info"] as const;

export const define = (d: ComponentDef): ComponentDef => d;
