import { createSystem } from "../system";

/** The default system: registry defaults are the Normy look, so this one is (almost) empty. */
export const normy = createSystem(
  { id: "normy", name: "Normy", description: "Calm, precise, spec-sheet editorial. Paper, ink and one vermilion accent.", tags: ["default", "editorial"] },
  { components: {} },
);
