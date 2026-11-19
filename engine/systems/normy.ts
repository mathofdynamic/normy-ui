import { createSystem } from "../system";

/** The default system: registry defaults are the Normy look (black, white, one blue), so this one is (almost) empty. */
export const normy = createSystem(
  { id: "normy", name: "Normy", description: "Crisp black and white with a single electric-blue accent. Clean, modern, product-grade.", tags: ["default", "modern"] },
  {
    tokens: {
      "type.label-font": "var(--n-font-body)",
      "type.label-case": "none",
      "tracking.caps": "0.02em",
      "radius.base": "8px",
    },
    components: {},
  },
);
