import { createSystem, r } from "../system";

/**
 * The Studio chrome's own fixed system: neutral black/white with the Normy blue, comfortable sizes.
 * Never edited by the user. The UI-size setting scales the whole chrome through the root font size.
 */
export const STUDIO_SYSTEM = createSystem(
  { id: "normy-studio", name: "Normy Studio (chrome)" },
  {
    tokens: {
      "space.density": 0.92,
      "radius.base": "8px",
      "type.heading-stretch": 100,
      "type.label-font": "var(--n-font-body)",
      "type.label-case": "none",
      "motion.page-effect": "none",
    },
    rules: [r({ component: "tooltip" }, { fontSize: "0.75rem" })],
  },
);
