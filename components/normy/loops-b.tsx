"use client";

/* Loop components, batch B: animated background containers.
 * Each draws a decorative layer (aria-hidden, no pointer events) behind its children.
 * See engine/components/loops.ts for the contract. */
import type { CSSProperties, ReactNode } from "react";
import { nPart, nRoot, type NProps } from "@/engine/react";
import { loopRoot } from "./use-loop";

interface LoopBgProps extends NProps {
  children?: ReactNode;
}

/** Inline custom properties (--p, --x, …) set per item. */
const vars = (v: Record<string, string | number>) => v as CSSProperties;

/** Deterministic PRNG so server and client render identical particles (no Math.random at render). */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const n2 = (n: number) => n.toFixed(2);

/* ---------------------------- aurora ---------------------------- */

export function Aurora({ variant, size, nid, children }: LoopBgProps) {
  return (
    <div {...nRoot("aurora", { variant, size, nid }, { variant: "default", size: "md" })} {...loopRoot} suppressHydrationWarning>
      <div {...nPart("aurora", "bg")} aria-hidden="true">
        <div {...nPart("aurora", "blobA")} />
        <div {...nPart("aurora", "blobB")} />
        <div {...nPart("aurora", "blobC")} />
      </div>
      <div {...nPart("aurora", "content")}>{children}</div>
    </div>
  );
}

/* ---------------------------- gridGlow ---------------------------- */

const BEAM_ROWS = [
  { row: 1, p: 0.05 },
  { row: 3, p: 0.42 },
  { row: 5, p: 0.74 },
];
const BEAM_COLS = [
  { col: 2, p: 0.22 },
  { col: 6, p: 0.58 },
  { col: 9, p: 0.9 },
];

export function GridGlow({ variant, size, nid, children }: LoopBgProps) {
  return (
    <div {...nRoot("gridGlow", { variant, size, nid }, { variant: "lines", size: "md" })} {...loopRoot} suppressHydrationWarning>
      <div {...nPart("gridGlow", "glow")} aria-hidden="true" />
      <div {...nPart("gridGlow", "grid")} aria-hidden="true">
        {BEAM_ROWS.map((b) => (
          <span key={`x${b.row}`} {...nPart("gridGlow", "beamX")} style={vars({ "--row": b.row, "--p": b.p })} />
        ))}
        {BEAM_COLS.map((b) => (
          <span key={`y${b.col}`} {...nPart("gridGlow", "beamY")} style={vars({ "--col": b.col, "--p": b.p })} />
        ))}
      </div>
      <div {...nPart("gridGlow", "content")}>{children}</div>
    </div>
  );
}

/* ---------------------------- starfield ---------------------------- */

/** One seamless star tile as stacked radial gradients (positions in %, tile repeats vertically). */
const STAR_LAYERS = [
  { seed: 1177, count: 24, px: 0.9, tile: 12, lo: 0.55, p: 0 },
  { seed: 4093, count: 30, px: 1.2, tile: 24, lo: 0.8, p: 0.36 },
  { seed: 9001, count: 18, px: 1.7, tile: 36, lo: 1, p: 0.7 },
].map((l) => {
  const r = rng(l.seed);
  const stars: string[] = [];
  for (let i = 0; i < l.count; i++) {
    const x = 1 + r() * 98;
    const y = 3 + r() * 94;
    const s = l.px * (0.75 + r() * 0.5);
    const c = i % 7 === 3 ? "var(--star-accent)" : "var(--star)";
    stars.push(`radial-gradient(circle at ${n2(x)}% ${n2(y)}%, ${c} ${n2(s - 0.4)}px, transparent ${n2(s + 0.5)}px)`);
  }
  return { ...l, image: stars.join(",") };
});

export function Starfield({ variant, size, nid, children }: LoopBgProps) {
  return (
    <div {...nRoot("starfield", { variant, size, nid }, { variant: "drift", size: "md" })} {...loopRoot} suppressHydrationWarning>
      <div {...nPart("starfield", "bg")} aria-hidden="true">
        {STAR_LAYERS.map((l) => (
          <div
            key={l.seed}
            {...nPart("starfield", "layer")}
            style={vars({ "--tile": `${l.tile}rem`, "--lo": l.lo, "--p": l.p, backgroundImage: l.image })}
          />
        ))}
      </div>
      <div {...nPart("starfield", "content")}>{children}</div>
    </div>
  );
}

/* ---------------------------- meteors ---------------------------- */

const METEORS = (() => {
  const r = rng(2718);
  const total = 16;
  return Array.from({ length: total }, (_, i) => ({
    // spread x across 10–110% so streaks entering from the right edge still cross the area
    x: n2(10 + ((i * 0.618034) % 1) * 100 + r() * 4),
    // evenly staggered phases (different irrational step than x, so no diagonal alignment)
    p: n2((((i * 0.754878) % 1) * 0.96 + r() * 0.03) % 1),
    len: n2(6 + r() * 6),
  }));
})();

export function Meteors({ variant, size, nid, children }: LoopBgProps) {
  return (
    <div {...nRoot("meteors", { variant, size, nid }, { variant: "default", size: "md" })} {...loopRoot} suppressHydrationWarning>
      <div {...nPart("meteors", "field")} aria-hidden="true">
        {METEORS.map((m, i) => (
          <span
            key={i}
            {...nPart("meteors", i < 7 ? "meteor" : "meteorMore")}
            style={vars({ "--x": m.x, "--p": m.p, "--len": m.len })}
          />
        ))}
      </div>
      <div {...nPart("meteors", "content")}>{children}</div>
    </div>
  );
}
