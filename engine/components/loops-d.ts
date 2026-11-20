import type { ComponentDef } from "../types";
import { WAVE_SHAPES } from "../../components/normy/wave-shapes";
import { define, loopAnim, part, R, root } from "./kit";

export { WAVE_SHAPES };

/* Loop components, batch D. See engine/components/loops.ts for the contract. */

/* ---------------- shared wave shapes (used by the recipe's dot keyframes AND the React path) ---------------- */

const r4 = (n: number) => Math.round(n * 10000) / 10000;

/** The glowing dot rides the right edge: the window shows x∈[s, s+P], so its y is wave(s) as the track scrolls s: 0→P. */
const dotKeyframes = (name: string, shape: "line" | "pulse") => {
  const { samples, y } = WAVE_SHAPES[shape];
  let out = `@keyframes ${name}{`;
  for (let k = 0; k <= samples; k++) {
    out += `${r4((k / samples) * 100)}%{translate:0 calc(var(--n-wl-h) * ${r4(y((k % samples) / samples))} - 0.3rem)}`;
  }
  return out + "}";
};

/* ---------------- equalizer ---------------- */

export const equalizer = define({
  type: "equalizer",
  label: "Equalizer",
  category: "loops",
  description: "Audio-style bars bouncing out of phase. Seamless, calm.",
  parts: { root: "Region", bar: "Bar" },
  variants: ["bars", "rounded", "mirror"],
  sizes: ["sm", "md", "lg"],
  states: [],
  defaultVariant: "bars",
  defaultSize: "md",
  keyframes:
    "@keyframes n-loop-equalizer-bounce{0%,100%{scale:1 var(--n-eq-lo)}18%{scale:1 1}34%{scale:1 calc(var(--n-eq-lo) + 0.25)}55%{scale:1 0.8}78%{scale:1 calc(var(--n-eq-lo) + 0.1)}}",
  recipe: [
    root({ display: "inline-flex", alignItems: "flex-end", justifyContent: "center", gap: "var(--n-eq-gap)", height: "var(--n-eq-h)", color: "{color.accent}", loopDuration: 1300, loopPauseOnHover: "yes", "--n-eq-h": "1.5rem", "--n-eq-w": "0.25rem", "--n-eq-gap": "0.15rem" }),
    part("bar", {
      ...loopAnim("n-loop-equalizer-bounce", "1.3s", "ease-in-out", "var(--i, 0)"),
      "--n-eq-lo": "clamp(0.06, calc(0.28 / var(--n-loop-intensity, 1)), 1)",
      width: "var(--n-eq-w)",
      height: "100%",
      bg: "currentColor",
      radius: "{radius.xs}",
      "transform-origin": "50% 100%",
      willChange: "scale",
    }),
    R({ variant: "rounded", part: "bar" }, { radius: "{radius.full}" }),
    R({ variant: "mirror" }, { alignItems: "center" }),
    R({ variant: "mirror", part: "bar" }, { radius: "{radius.full}", "transform-origin": "50% 50%" }),
    R({ size: "sm" }, { "--n-eq-h": "1rem", "--n-eq-w": "0.1875rem", "--n-eq-gap": "0.125rem" }),
    R({ size: "md" }, { "--n-eq-h": "1.5rem", "--n-eq-w": "0.25rem", "--n-eq-gap": "0.1875rem" }),
    R({ size: "lg" }, { "--n-eq-h": "2.5rem", "--n-eq-w": "0.375rem", "--n-eq-gap": "0.25rem" }),
  ],
});

/* ---------------- loader ---------------- */

export const loader = define({
  type: "loader",
  label: "Loader",
  category: "loops",
  description: "Looping loading indicators: dots, bars, ring, pulse, orbit. role=status with a hidden label.",
  parts: { root: "Region", dot: "Dot", bar: "Bar", ring: "Ring", track: "Ring track", arc: "Ring arc", halo: "Halo", orbit: "Orbit", label: "Hidden label" },
  variants: ["dots", "bars", "ring", "pulse", "orbit"],
  sizes: ["sm", "md", "lg"],
  states: [],
  defaultVariant: "dots",
  defaultSize: "md",
  keyframes: [
    "@keyframes n-loop-loader-bounce{0%,70%,100%{translate:0 0;opacity:0.55}30%{translate:0 calc(var(--n-ls) * -0.32);opacity:1}}",
    "@keyframes n-loop-loader-bar{0%,45%,100%{scale:1 0.32}22%{scale:1 1}}",
    "@keyframes n-loop-loader-spin{to{rotate:1turn}}",
    "@keyframes n-loop-loader-arc{0%{stroke-dasharray:6 94;stroke-dashoffset:0}50%{stroke-dasharray:62 38;stroke-dashoffset:-22}100%{stroke-dasharray:6 94;stroke-dashoffset:-100}}",
    "@keyframes n-loop-loader-halo{0%{scale:1;opacity:0}12%{opacity:0.5}100%{scale:2.6;opacity:0}}",
  ].join(""),
  recipe: [
    root({ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", height: "var(--n-ls)", minWidth: "var(--n-ls)", color: "{color.accent}", loopDuration: 1200, "--n-ls": "1.5rem" }),
    part("label", { position: "absolute", width: "1px", height: "1px", overflow: "hidden", "clip-path": "inset(50%)", whiteSpace: "nowrap", margin: "-1px", padding: 0, borderWidth: 0 }),
    part("dot", { width: "calc(var(--n-ls) * 0.28)", height: "calc(var(--n-ls) * 0.28)", radius: "{radius.full}", bg: "currentColor", flexShrink: 0 }),
    part("bar", { width: "calc(var(--n-ls) * 0.16)", height: "100%", radius: "{radius.full}", bg: "currentColor", "transform-origin": "50% 50%", flexShrink: 0 }),
    part("ring", { width: "var(--n-ls)", height: "var(--n-ls)", display: "block", ...loopAnim("n-loop-loader-spin", "1.4s") }),
    part("track", { fill: "none", stroke: "color-mix(in oklch, currentColor 18%, transparent)", "stroke-width": 3 }),
    part("arc", { fill: "none", stroke: "currentColor", "stroke-width": 3, "stroke-linecap": "round", ...loopAnim("n-loop-loader-arc", "1.4s", "ease-in-out") }),
    part("halo", { width: "calc(var(--n-ls) * 0.4)", height: "calc(var(--n-ls) * 0.4)", radius: "{radius.full}", bg: "currentColor", "grid-area": "1 / 1", ...loopAnim("n-loop-loader-halo", "1.4s", "ease-out") }),
    part("orbit", { position: "relative", width: "var(--n-ls)", height: "var(--n-ls)", ...loopAnim("n-loop-loader-spin", "1.6s") }),

    /* dots */
    R({ variant: "dots" }, { gap: "calc(var(--n-ls) * 0.2)" }),
    R({ variant: "dots", part: "dot" }, { ...loopAnim("n-loop-loader-bounce", "1.2s", "ease-in-out", "calc(var(--i, 0) * 0.14)") }),
    /* bars */
    R({ variant: "bars" }, { gap: "calc(var(--n-ls) * 0.12)", loopDuration: 1100 }),
    R({ variant: "bars", part: "bar" }, { ...loopAnim("n-loop-loader-bar", "1.1s", "ease-in-out", "calc(var(--i, 0) * 0.11)") }),
    /* ring */
    R({ variant: "ring" }, { loopDuration: 1400 }),
    /* pulse */
    R({ variant: "pulse" }, { display: "inline-grid", placeItems: "center", loopDuration: 1500 }),
    R({ variant: "pulse", part: "dot" }, { width: "calc(var(--n-ls) * 0.4)", height: "calc(var(--n-ls) * 0.4)", "grid-area": "1 / 1" }),
    /* orbit */
    R({ variant: "orbit" }, { loopDuration: 1600 }),
    R({ variant: "orbit", part: "dot" }, { position: "absolute", left: "calc(50% - var(--n-ls) * 0.14)", width: "calc(var(--n-ls) * 0.28)", height: "calc(var(--n-ls) * 0.28)", opacity: "calc(1 - var(--i, 0) * 0.5)", scale: "calc(1 - var(--i, 0) * 0.3)" }),

    R({ size: "sm" }, { "--n-ls": "1rem" }),
    R({ size: "md" }, { "--n-ls": "1.5rem" }),
    R({ size: "lg" }, { "--n-ls": "2.5rem" }),
  ],
});

/* ---------------- waveLine ---------------- */

export const waveLine = define({
  type: "waveLine",
  label: "Wave line",
  category: "loops",
  description: "An endless line chart / wave scrolling sideways, with optional soft fill and a glowing dot at the leading edge.",
  parts: { root: "Region", viewport: "Viewport", track: "Scrolling track", line: "Line", fill: "Fill", dot: "Glowing dot" },
  variants: ["line", "area", "pulse"],
  sizes: ["sm", "md", "lg"],
  states: [],
  defaultVariant: "line",
  defaultSize: "md",
  keyframes: [
    "@keyframes n-loop-waveline-scroll{from{translate:0 0}to{translate:-50% 0}}",
    dotKeyframes("n-loop-waveline-dot-line", "line"),
    dotKeyframes("n-loop-waveline-dot-pulse", "pulse"),
    "@keyframes n-loop-waveline-glow{0%,100%{box-shadow:0 0 0 0.15rem color-mix(in oklch, var(--n-color-accent) 22%, transparent),0 0 0.9rem 0.1rem color-mix(in oklch, var(--n-color-accent) 55%, transparent)}50%{box-shadow:0 0 0 0.35rem color-mix(in oklch, var(--n-color-accent) 10%, transparent),0 0 1.4rem 0.3rem color-mix(in oklch, var(--n-color-accent) 40%, transparent)}}",
  ].join(""),
  recipe: [
    root({ position: "relative", display: "block", width: "100%", height: "var(--n-wl-h)", paddingRight: "0.5rem", boxSizing: "border-box", color: "{color.accent}", loopDuration: 8000, loopPauseOnHover: "yes", "--n-wl-h": "6rem" }),
    part("viewport", { position: "relative", width: "100%", height: "100%", overflow: "hidden", "mask-image": "linear-gradient(to right, transparent, black 22%)" }),
    part("track", { display: "block", width: "200%", height: "100%", willChange: "translate", "transform-box": "border-box", ...loopAnim("n-loop-waveline-scroll", "8s") }),
    part("line", { fill: "none", stroke: "var(--n-color-accent)", "stroke-width": 2, "stroke-linejoin": "round", "stroke-linecap": "round", "vector-effect": "non-scaling-stroke" }),
    part("fill", { stroke: "none" }),
    part("dot", {
      position: "absolute",
      top: 0,
      right: "0.5rem",
      width: "0.6rem",
      height: "0.6rem",
      radius: "{radius.full}",
      bg: "{color.accent}",
      ...loopAnim("n-loop-waveline-dot-line", "8s"),
      "animation-name": "n-loop-waveline-dot-line, n-loop-waveline-glow",
      "animation-duration": "calc(var(--n-loop-duration, 8s) / var(--n-loop-speed, 1) / var(--n-motion-speed, 1)), 2s",
      "animation-timing-function": "linear, ease-in-out",
    }),
    R({ variant: "pulse", part: "dot" }, { "animation-name": "n-loop-waveline-dot-pulse, n-loop-waveline-glow" }),
    R({ variant: "pulse" }, { loopDuration: 5000 }),
    R({ size: "sm" }, { "--n-wl-h": "3.5rem" }),
    R({ size: "md" }, { "--n-wl-h": "6rem" }),
    R({ size: "lg" }, { "--n-wl-h": "9rem" }),
  ],
});

/* ---------------- rotatingBadge ---------------- */

export const rotatingBadge = define({
  type: "rotatingBadge",
  label: "Rotating badge",
  category: "loops",
  description: "Circular text slowly rotating around a centre icon. A decorative call-to-action badge, optionally a link.",
  parts: { root: "Badge", ring: "Rotating text ring", text: "Ring text", center: "Centre" },
  variants: ["default", "outline", "filled"],
  sizes: ["sm", "md", "lg"],
  states: ["hover", "focus"],
  defaultVariant: "default",
  defaultSize: "md",
  keyframes: "@keyframes n-loop-rotatingbadge-spin{to{rotate:1turn}}",
  recipe: [
    root({ position: "relative", display: "inline-grid", placeItems: "center", width: "var(--n-rb)", height: "var(--n-rb)", radius: "{radius.full}", color: "{color.text}", textDecoration: "none", flexShrink: 0, loopDuration: 20000, loopPauseOnHover: "yes", "--n-rb": "7rem", "--n-rb-fs": "10px" }),
    part("ring", { position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible", ...loopAnim("n-loop-rotatingbadge-spin", "20s") }),
    part("text", { fill: "currentColor", "font-family": "{type.label-font}", "font-size": "var(--n-rb-fs)", "font-weight": 600, "text-transform": "uppercase", "letter-spacing": "0.04em" }),
    part("center", { position: "relative", display: "grid", placeItems: "center", width: "34%", height: "34%", color: "{color.accent}", transitionProperty: "default", transitionDuration: "{duration.fast}", transitionEasing: "{easing.standard}" }),
    R({ state: "hover", part: "center" }, { scale: 1.12 }),
    R({ state: "focus" }, { focusRing: "token" }),
    R({ variant: "outline" }, { borderWidth: 1, borderStyle: "solid", borderColor: "{color.border-strong}" }),
    R({ variant: "outline", part: "center" }, { color: "{color.text}" }),
    R({ variant: "filled" }, { bg: "{color.accent}", color: "{color.text-on-accent}" }),
    R({ variant: "filled", part: "center" }, { color: "{color.text-on-accent}" }),
    R({ size: "sm" }, { "--n-rb": "4.75rem", "--n-rb-fs": "9px" }),
    R({ size: "md" }, { "--n-rb": "7rem", "--n-rb-fs": "10px" }),
    R({ size: "lg" }, { "--n-rb": "10rem", "--n-rb-fs": "10.5px" }),
  ],
});

export const LOOPS_D: ComponentDef[] = [equalizer, loader, waveLine, rotatingBadge];
