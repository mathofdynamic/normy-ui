/* Wave shapes for WaveLine. Plain data shared by the React path (components/normy/loops-d.tsx)
   and the recipe's dot keyframes (engine/components/loops-d.ts), so the dot always rides the line. */

const TAU = Math.PI * 2;
const bump = (t: number, c: number, w: number) => Math.exp(-(((t - c) / w) ** 2) / 2);

/** One period of each wave, t in [0,1) → y in 0..1 (0 = top). Periodic: y(0) === y(1). */
export const WAVE_SHAPES: Record<"line" | "pulse", { samples: number; y: (t: number) => number }> = {
  line: {
    samples: 96,
    y: (t) => 0.5 - 0.26 * Math.sin(TAU * t) - 0.1 * Math.sin(2 * TAU * t + 0.8) + 0.05 * Math.sin(3 * TAU * t + 2),
  },
  pulse: {
    samples: 200,
    y: (t) => 0.62 - 0.06 * bump(t, 0.18, 0.03) + 0.08 * bump(t, 0.37, 0.008) - 0.5 * bump(t, 0.4, 0.01) + 0.16 * bump(t, 0.43, 0.01) - 0.1 * bump(t, 0.62, 0.04),
  },
};
