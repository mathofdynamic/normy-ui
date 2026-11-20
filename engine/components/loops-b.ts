import type { ComponentDef } from "../types";
import { define, loopAnim, part, R, root } from "./kit";

/* Loop components, batch B: animated background containers.
 * Each renders a decorative layer (aria-hidden, pointer-events none) behind its children.
 * See engine/components/loops.ts for the contract. */

/** Shared container look: a calm bordered stage that clips the animated layer. */
const stage = (duration: number, extra: Record<string, string> = {}) =>
  root({
    position: "relative",
    overflow: "hidden",
    isolation: "isolate",
    display: "grid",
    placeItems: "center",
    radius: "{radius.lg}",
    bg: "{color.bg}",
    color: "{color.text}",
    borderWidth: "{border.thin}",
    borderStyle: "solid",
    borderColor: "{color.border}",
    minHeight: "22rem",
    loopDuration: duration,
    ...extra,
  });

const layer = { position: "absolute", inset: 0, pointerEvents: "none" } as const;

const content = part("content", {
  position: "relative",
  "z-index": "1",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "{space.4}",
  padding: "{space.8}",
  maxWidth: "40rem",
  textAlign: "center",
});

const sizes = [
  R({ size: "sm" }, { minHeight: "16rem" }),
  R({ size: "lg" }, { minHeight: "30rem" }),
];

/* ---------------------------- aurora ---------------------------- */

const accentA = "oklch(from var(--n-color-accent) l c h / var(--aur-1))";
const accentB = "oklch(from var(--n-color-accent) l c calc(h - 45) / var(--aur-2))";
const accentC = "color-mix(in oklch, color-mix(in oklch, var(--n-color-accent) 40%, var(--n-color-text-muted)) calc(var(--aur-3) * 100%), transparent)";
const blobFill = (c: string) => ({ "background-image": `radial-gradient(closest-side, ${c}, transparent)` });

export const aurora = define({
  type: "aurora",
  label: "Aurora",
  category: "loops",
  description: "Soft colour fields drifting slowly behind your content, like northern lights.",
  parts: { root: "Region", bg: "Background layer", blobA: "Field A", blobB: "Field B", blobC: "Field C", content: "Content" },
  variants: ["default", "subtle", "vivid"],
  sizes: ["sm", "md", "lg"],
  states: [],
  defaultVariant: "default",
  defaultSize: "md",
  keyframes: [
    "@keyframes n-loop-aurora-a{0%,100%{translate:0 0;scale:1}33%{translate:calc(var(--n-loop-intensity,1)*16%) calc(var(--n-loop-intensity,1)*10%);scale:1.12}66%{translate:calc(var(--n-loop-intensity,1)*-10%) calc(var(--n-loop-intensity,1)*-14%);scale:.94}}",
    "@keyframes n-loop-aurora-b{0%,100%{translate:0 0;scale:1}35%{translate:calc(var(--n-loop-intensity,1)*-18%) calc(var(--n-loop-intensity,1)*12%);scale:.92}70%{translate:calc(var(--n-loop-intensity,1)*8%) calc(var(--n-loop-intensity,1)*-10%);scale:1.14}}",
    "@keyframes n-loop-aurora-c{0%,100%{translate:0 0;scale:1.05}30%{translate:calc(var(--n-loop-intensity,1)*14%) calc(var(--n-loop-intensity,1)*-16%);scale:.9}65%{translate:calc(var(--n-loop-intensity,1)*-16%) calc(var(--n-loop-intensity,1)*-6%);scale:1.15}}",
  ].join(""),
  recipe: [
    stage(28000, { "--aur-1": "0.42", "--aur-2": "0.34", "--aur-3": "0.5" }),
    ...sizes,
    R({ variant: "subtle" }, { "--aur-1": "0.2", "--aur-2": "0.16", "--aur-3": "0.28" }),
    R({ variant: "vivid" }, { "--aur-1": "0.7", "--aur-2": "0.58", "--aur-3": "0.7" }),
    part("bg", { ...layer, overflow: "hidden" }),
    part("blobA", { position: "absolute", top: "-35%", left: "-10%", width: "70%", height: "130%", "border-radius": "50%", willChange: "transform", ...blobFill(accentA), ...loopAnim("n-loop-aurora-a", "28s", "ease-in-out") }),
    part("blobB", { position: "absolute", top: "-30%", right: "-15%", width: "65%", height: "125%", "border-radius": "50%", willChange: "transform", ...blobFill(accentB), ...loopAnim("n-loop-aurora-b", "28s", "ease-in-out", "0.33") }),
    part("blobC", { position: "absolute", bottom: "-55%", left: "22%", width: "60%", height: "120%", "border-radius": "50%", willChange: "transform", ...blobFill(accentC), ...loopAnim("n-loop-aurora-c", "28s", "ease-in-out", "0.66") }),
    content,
  ],
});

/* ---------------------------- gridGlow ---------------------------- */

const lineColor = "color-mix(in oklch, var(--n-color-border) 85%, transparent)";
const beamColor = "color-mix(in oklch, var(--n-color-accent) 85%, transparent)";
const beamShadow = "0 0 0.6rem color-mix(in oklch, var(--n-color-accent) 55%, transparent)";
const beamOpacity = "min(1, var(--n-loop-intensity, 1))";

export const gridGlow = define({
  type: "gridGlow",
  label: "Grid glow",
  category: "loops",
  description: "A faint grid with light beams travelling along its lines.",
  parts: { root: "Region", glow: "Soft glow", grid: "Grid layer", beamX: "Horizontal beam", beamY: "Vertical beam", content: "Content" },
  variants: ["lines", "dots"],
  sizes: ["sm", "md", "lg"],
  states: [],
  defaultVariant: "lines",
  defaultSize: "md",
  keyframes:
    "@keyframes n-loop-gridGlow-x{from{translate:-100% 0}to{translate:100cqw 0}}" +
    "@keyframes n-loop-gridGlow-y{from{translate:0 -100%}to{translate:0 100cqh}}",
  recipe: [
    stage(11000, { "--cell": "2.75rem", "--off": "0px" }),
    ...sizes,
    R({ variant: "dots" }, { "--off": "calc(var(--cell) / 2)" }),
    part("glow", {
      ...layer,
      "background-image": "radial-gradient(ellipse 70% 60% at 50% 0%, color-mix(in oklch, var(--n-color-accent) 14%, transparent), transparent)",
    }),
    part("grid", {
      ...layer,
      "container-type": "size",
      "background-image": `linear-gradient(to right, ${lineColor} 1px, transparent 1px), linear-gradient(to bottom, ${lineColor} 1px, transparent 1px)`,
      "background-size": "var(--cell) var(--cell)",
      "mask-image": "radial-gradient(ellipse 80% 80% at 50% 50%, var(--n-color-text) 25%, transparent 100%)",
    }),
    R({ variant: "dots", part: "grid" }, {
      "background-image": "radial-gradient(circle at center, color-mix(in oklch, var(--n-color-text-subtle) 90%, transparent) 1.2px, transparent 1.7px)",
    }),
    part("beamX", {
      position: "absolute",
      left: 0,
      top: "calc(var(--cell) * var(--row, 1) + var(--off, 0px))",
      width: "9rem",
      height: "1px",
      opacity: beamOpacity,
      willChange: "transform",
      "background-image": `linear-gradient(90deg, transparent, ${beamColor} 85%, var(--n-color-accent))`,
      "box-shadow": beamShadow,
      ...loopAnim("n-loop-gridGlow-x", "11s", "linear", "var(--p, 0)"),
    }),
    part("beamY", {
      position: "absolute",
      top: 0,
      left: "calc(var(--cell) * var(--col, 1) + var(--off, 0px))",
      width: "1px",
      height: "9rem",
      opacity: beamOpacity,
      willChange: "transform",
      "background-image": `linear-gradient(180deg, transparent, ${beamColor} 85%, var(--n-color-accent))`,
      "box-shadow": beamShadow,
      ...loopAnim("n-loop-gridGlow-y", "11s", "linear", "var(--p, 0)"),
    }),
    R({ variant: "dots", part: "beamX" }, { height: "2px", marginTop: "-1px", width: "6rem" }),
    R({ variant: "dots", part: "beamY" }, { width: "2px", marginLeft: "-1px", height: "6rem" }),
    content,
  ],
});

/* ---------------------------- starfield ---------------------------- */

export const starfield = define({
  type: "starfield",
  label: "Starfield",
  category: "loops",
  description: "Tiny particles at different depths, drifting up or twinkling in place.",
  parts: { root: "Region", bg: "Background layer", layer: "Star layer", content: "Content" },
  variants: ["drift", "twinkle"],
  sizes: ["sm", "md", "lg"],
  states: [],
  defaultVariant: "drift",
  defaultSize: "md",
  keyframes:
    "@keyframes n-loop-starfield-rise{from{translate:0 0}to{translate:0 calc(var(--tile) * -1)}}" +
    "@keyframes n-loop-starfield-twinkle{0%,100%{opacity:calc(var(--lo, 0.8) * 0.18 * var(--n-loop-intensity,1))}50%{opacity:min(1, calc(var(--lo, 0.8) * var(--n-loop-intensity,1)))}}",
  recipe: [
    stage(60000, {
      "--star": "color-mix(in oklch, var(--n-color-text) 55%, transparent)",
      "--star-accent": "color-mix(in oklch, var(--n-color-accent) 90%, transparent)",
    }),
    ...sizes,
    part("bg", { ...layer, overflow: "hidden" }),
    part("layer", {
      position: "absolute",
      left: 0,
      top: 0,
      width: "100%",
      height: "calc(100% + var(--tile))",
      "background-repeat": "repeat-y",
      "background-size": "100% var(--tile)",
      opacity: "min(1, calc(var(--lo, 0.8) * var(--n-loop-intensity, 1)))",
      willChange: "transform",
    }),
    R({ variant: "drift", part: "layer" }, { ...loopAnim("n-loop-starfield-rise", "60s") }),
    R({ variant: "twinkle", part: "layer" }, { ...loopAnim("n-loop-starfield-twinkle", "9s", "ease-in-out", "var(--p, 0)"), "--tile": "28rem" }),
    content,
  ],
});

/* ---------------------------- meteors ---------------------------- */

const streak = {
  position: "absolute",
  top: 0,
  left: "calc(var(--x, 50) * 1%)",
  width: "calc(var(--len, 9) * 1rem)",
  height: "1px",
  rotate: "135deg",
  opacity: 0,
  willChange: "transform",
  "background-image": "linear-gradient(90deg, transparent, color-mix(in oklch, var(--n-color-accent) 75%, transparent) 70%, var(--n-color-text))",
  ...loopAnim("n-loop-meteors-fall", "9s", "linear", "var(--p, 0)"),
} as const;

export const meteors = define({
  type: "meteors",
  label: "Meteors",
  category: "loops",
  description: "Thin diagonal streaks with fading tails falling across the area.",
  parts: { root: "Region", field: "Sky", meteor: "Streak", meteorMore: "Extra streak (dense)", content: "Content" },
  variants: ["default", "dense"],
  sizes: ["sm", "md", "lg"],
  states: [],
  defaultVariant: "default",
  defaultSize: "md",
  keyframes:
    "@keyframes n-loop-meteors-fall{" +
    "0%{translate:6rem -6rem;opacity:0}" +
    "4%{opacity:min(1, calc(var(--n-loop-intensity,1) * 0.9))}" +
    "46%{opacity:min(1, calc(var(--n-loop-intensity,1) * 0.9))}" +
    "52%{translate:calc(-100cqh - 6rem) calc(100cqh + 6rem);opacity:0}" +
    "100%{translate:calc(-100cqh - 6rem) calc(100cqh + 6rem);opacity:0}}",
  recipe: [
    stage(9000),
    ...sizes,
    part("field", { ...layer, overflow: "hidden", "container-type": "size" }),
    part("meteor", streak),
    part("meteorMore", streak),
    R({ variant: "default", part: "meteorMore" }, { display: "none" }),
    content,
  ],
});

export const LOOPS_B: ComponentDef[] = [aurora, gridGlow, starfield, meteors];
