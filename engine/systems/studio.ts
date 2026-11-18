import { createSystem, r } from "../system";

/** The Studio chrome's own fixed system: denser, quieter, neutral accent. Never edited by the user. */
export const STUDIO_SYSTEM = createSystem(
  { id: "normy-studio", name: "Normy Studio (chrome)" },
  {
    tokens: {
      "space.density": 0.82,
      "radius.base": "5px",
      "text.sm": "0.8125rem",
      "text.base": "0.875rem",
      "text.lg": "1rem",
      "text.xl": "1.125rem",
      "type.heading-stretch": 100,
      "motion.page-effect": "none",
    },
    rules: [r({ component: "tooltip" }, { fontSize: "0.6875rem" }), r({ component: "button" }, { minHeight: 0 }), r({ component: "iconButton" }, { minHeight: 0 })],
  },
);
