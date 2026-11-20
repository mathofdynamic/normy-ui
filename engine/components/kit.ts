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

/**
 * A seamless infinite CSS animation driven by the "loop" registry group:
 * length (--n-loop-duration), speed, direction, pause on hover, master motion speed.
 * `phase` (0–1) offsets the start so several items share one loop out of step.
 */
export const loopAnim = (name: string, fallback = "20s", timing = "linear", phase?: string): Props => ({
  "animation-name": name,
  "animation-duration": `calc(var(--n-loop-duration, ${fallback}) / var(--n-loop-speed, 1) / var(--n-motion-loop-speed, 1) / var(--n-motion-speed, 1))`,
  "animation-timing-function": timing,
  "animation-iteration-count": "infinite",
  "animation-direction": "var(--n-loop-direction, normal)",
  "animation-play-state": "var(--n-loop-state, running)",
  ...(phase ? { "animation-delay": `calc(var(--n-loop-duration, ${fallback}) / var(--n-loop-speed, 1) / var(--n-motion-loop-speed, 1) / var(--n-motion-speed, 1) * -1 * ${phase})` } : {}),
});

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
