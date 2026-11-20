import type { ComponentDef } from "../types";
import { define, loopAnim, part, R, root } from "./kit";

/* Loop components, batch C. See engine/components/loops.ts for the contract. */

const cycle = (fallback: string, mult: string) =>
  `calc(var(--n-loop-duration, ${fallback}) / var(--n-loop-speed, 1) / var(--n-motion-speed, 1) * ${mult})`;

/* ---------------- orbit ---------------- */

/** Ring + its items share one duration (× a per-ring factor) so counter-rotation cancels exactly. */
const orbitAnim = (name: string): Record<string, string> => ({
  ...loopAnim(name, "24s"),
  "animation-duration": cycle("24s", "var(--n-orbit-k, 1)"),
});

export const orbit = define({
  type: "orbit",
  label: "Orbit",
  category: "loops",
  description: "A centre element with concentric rings; icons or avatars travel around each ring, upright, at different speeds.",
  parts: { root: "Region", ring: "Ring", slot: "Slot", item: "Item", center: "Centre" },
  variants: ["default", "dashed"],
  sizes: ["sm", "md", "lg"],
  states: [],
  defaultVariant: "default",
  defaultSize: "md",
  keyframes: [
    "@keyframes n-loop-orbit-spin{to{rotate:calc(var(--n-orbit-s, 1) * 1turn)}}",
    "@keyframes n-loop-orbit-upright{from{rotate:calc(var(--a, 0turn) * -1)}to{rotate:calc(var(--a, 0turn) * -1 - var(--n-orbit-s, 1) * 1turn)}}",
  ].join("\n"),
  recipe: [
    root({
      position: "relative",
      display: "grid",
      placeItems: "center",
      loopDuration: 24000,
      loopPauseOnHover: "yes",
      "aspect-ratio": "1",
      "max-width": "100%",
      overflow: "clip",
      "--n-orbit-chip": "2.5rem",
    }),
    part("ring", {
      position: "absolute",
      inset: 0,
      margin: "auto",
      width: "calc(var(--d, 100%) - var(--n-orbit-chip) - 0.5rem)",
      height: "calc(var(--d, 100%) - var(--n-orbit-chip) - 0.5rem)",
      radius: "{radius.full}",
      borderWidth: "{border.thin}",
      borderStyle: "solid",
      borderColor: "{color.border}",
      ...orbitAnim("n-loop-orbit-spin"),
    }),
    part("slot", { position: "absolute", inset: "-1px", rotate: "var(--a, 0turn)", pointerEvents: "none" }),
    part("item", {
      position: "absolute",
      top: 0,
      left: "50%",
      translate: "-50% -50%",
      display: "grid",
      placeItems: "center",
      width: "var(--n-orbit-chip)",
      height: "var(--n-orbit-chip)",
      overflow: "hidden",
      radius: "{radius.full}",
      bg: "{color.surface-raised}",
      color: "{color.text-muted}",
      borderWidth: "{border.thin}",
      borderStyle: "solid",
      borderColor: "{color.border}",
      shadow: "{shadow.1}",
      pointerEvents: "auto",
      ...orbitAnim("n-loop-orbit-upright"),
    }),
    part("center", {
      position: "relative",
      zIndex: 1,
      display: "grid",
      placeItems: "center",
      width: "var(--n-orbit-center, 3.5rem)",
      height: "var(--n-orbit-center, 3.5rem)",
      radius: "{radius.full}",
      bg: "{color.surface-inverse}",
      color: "{color.text-inverse}",
      shadow: "{shadow.3}",
    }),
    R({ variant: "dashed", part: "ring" }, { borderStyle: "dashed", borderColor: "{color.border-strong}" }),
    R({ size: "sm" }, { width: "min(14rem, calc(100vw - 5rem))", "--n-orbit-chip": "1.75rem", "--n-orbit-center": "2.25rem" }),
    R({ size: "md" }, { width: "min(20rem, calc(100vw - 5rem))", "--n-orbit-chip": "2.5rem", "--n-orbit-center": "3.5rem" }),
    R({ size: "lg" }, { width: "min(28rem, calc(100vw - 5rem))", "--n-orbit-chip": "3.25rem", "--n-orbit-center": "4.75rem" }),
  ],
});

/* ---------------- pulseRings ---------------- */

export const pulseRings = define({
  type: "pulseRings",
  label: "Pulse rings",
  category: "loops",
  description: "Rings expanding and fading from a centre, out of phase so one is always visible. Status, live, radar.",
  parts: { root: "Region", ring: "Ring", sweep: "Radar sweep", center: "Centre" },
  variants: ["default", "radar", "soft"],
  sizes: ["sm", "md", "lg"],
  states: [],
  defaultVariant: "default",
  defaultSize: "md",
  keyframes: [
    "@keyframes n-loop-pulserings-ring{0%{scale:.2;opacity:0}14%{opacity:calc(.85 * min(1, var(--n-loop-intensity, 1)))}100%{scale:1;opacity:0}}",
    "@keyframes n-loop-pulserings-sweep{to{rotate:1turn}}",
  ].join("\n"),
  recipe: [
    root({
      position: "relative",
      display: "grid",
      placeItems: "center",
      loopDuration: 3600,
      "aspect-ratio": "1",
      "max-width": "100%",
      "--n-pulse-core": "3rem",
    }),
    part("ring", {
      position: "absolute",
      inset: 0,
      radius: "{radius.full}",
      borderWidth: "{border.thin}",
      borderStyle: "solid",
      borderColor: "color-mix(in oklch, var(--n-color-accent) 70%, transparent)",
      opacity: 0,
      pointerEvents: "none",
      ...loopAnim("n-loop-pulserings-ring", "3.6s", "cubic-bezier(0.22, 0.6, 0.35, 1)", "(var(--i, 0) / var(--n, 3))"),
    }),
    part("sweep", {
      display: "none",
      position: "absolute",
      inset: 0,
      radius: "{radius.full}",
      pointerEvents: "none",
      "background-image":
        "linear-gradient(90deg, transparent calc(50% - 0.5px), color-mix(in oklch, var(--n-color-accent) 80%, transparent) calc(50% - 0.5px) calc(50% + 0.5px), transparent calc(50% + 0.5px)), conic-gradient(from 0turn, transparent 0turn, transparent 0.62turn, color-mix(in oklch, var(--n-color-accent) 34%, transparent) 1turn)",
      "background-size": "100% 50%, 100% 100%",
      "background-position": "top, center",
      "background-repeat": "no-repeat",
      ...loopAnim("n-loop-pulserings-sweep", "3.6s"),
      "animation-duration": cycle("3.6s", "2"),
    }),
    part("center", {
      position: "relative",
      zIndex: 1,
      display: "grid",
      placeItems: "center",
      width: "var(--n-pulse-core)",
      height: "var(--n-pulse-core)",
      radius: "{radius.full}",
      bg: "{color.accent}",
      color: "{color.text-on-accent}",
      shadow: "0 0 0 0.375rem color-mix(in oklch, var(--n-color-accent) 22%, transparent)",
    }),
    R({ variant: "radar" }, { borderWidth: "{border.thin}", borderStyle: "solid", borderColor: "{color.border}", radius: "{radius.full}" }),
    R({ variant: "radar", part: "sweep" }, { display: "block" }),
    R({ variant: "radar", part: "ring" }, { borderColor: "color-mix(in oklch, var(--n-color-accent) 45%, transparent)" }),
    R(
      { variant: "soft", part: "ring" },
      {
        borderWidth: 0,
        "background-image": "radial-gradient(closest-side, transparent 50%, color-mix(in oklch, var(--n-color-accent) 30%, transparent) 100%)",
      },
    ),
    R({ size: "sm" }, { width: "7rem", "--n-pulse-core": "1.75rem" }),
    R({ size: "md" }, { width: "11rem", "--n-pulse-core": "3rem" }),
    R({ size: "lg" }, { width: "16rem", "--n-pulse-core": "4.25rem" }),
  ],
});

/* ---------------- borderBeam ---------------- */

const beamBase = {
  position: "absolute",
  top: 0,
  left: 0,
  width: "var(--n-beam-len, 7rem)",
  height: "calc(var(--n-beam-bleed, 0rem) * 2 + var(--n-beam-w, 2px) * 3)",
  "background-image":
    "radial-gradient(ellipse closest-side at 78% 50%, var(--n-beam-glow, transparent), transparent), linear-gradient(90deg, transparent, var(--n-color-accent) 70%, color-mix(in oklch, var(--n-color-accent) 55%, var(--n-color-text)))",
  "background-size": "100% 100%, 100% calc(var(--n-beam-w, 2px) * 2)",
  "background-position": "0 0, 0 50%",
  "background-repeat": "no-repeat",
  "offset-path": "inset(var(--n-beam-bleed, 0rem) round var(--n-beam-r))",
  "offset-rotate": "auto",
  "offset-anchor": "50% 50%",
  opacity: "min(1, calc(0.55 + 0.45 * var(--n-loop-intensity, 1)))",
};

export const borderBeam = define({
  type: "borderBeam",
  label: "Border beam",
  category: "loops",
  description: "Wraps any content; a short bright beam of light travels around its border forever, following the corner radius.",
  parts: { root: "Wrapper", layer: "Border layer", beam: "Beam", beam2: "Second beam" },
  variants: ["default", "dual", "glow"],
  sizes: [],
  states: [],
  defaultVariant: "default",
  keyframes: "@keyframes n-loop-borderbeam-run{from{offset-distance:0%}to{offset-distance:100%}}",
  recipe: [
    root({
      position: "relative",
      display: "block",
      radius: "var(--n-beam-r)",
      loopDuration: 6000,
      "--n-beam-r": "var(--n-radius-card)",
      "--n-beam-w": "2px",
      "--n-beam-len": "7rem",
    }),
    part("layer", {
      position: "absolute",
      inset: "calc(var(--n-beam-bleed, 0rem) * -1)",
      radius: "calc(var(--n-beam-r) + var(--n-beam-bleed, 0rem))",
      padding: "calc(var(--n-beam-bleed, 0rem) + var(--n-beam-w))",
      zIndex: 1,
      pointerEvents: "none",
      mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
      "mask-composite": "exclude",
      "-webkit-mask": "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
      "-webkit-mask-composite": "xor",
    }),
    part("beam", { ...beamBase, ...loopAnim("n-loop-borderbeam-run", "6s") }),
    part("beam2", { ...beamBase, display: "none", ...loopAnim("n-loop-borderbeam-run", "6s", "linear", "0.5") }),
    R({ variant: "dual", part: "beam2" }, { display: "block" }),
    R({ variant: "glow" }, { "--n-beam-bleed": "0.5rem", "--n-beam-glow": "color-mix(in oklch, var(--n-color-accent) 55%, transparent)", "--n-beam-len": "9rem" }),
  ],
});

/* ---------------- shineText ---------------- */

export const shineText = define({
  type: "shineText",
  label: "Shine text",
  category: "loops",
  description: "Text with a light sheen sweeping across it, or a slow accent gradient flowing through it. Stays selectable.",
  parts: { root: "Text" },
  variants: ["sheen", "gradient"],
  sizes: ["inherit", "md", "lg", "xl"],
  states: [],
  defaultVariant: "sheen",
  defaultSize: "inherit",
  keyframes: [
    /* Both ends show only the base colour (highlight fully outside), then a rest pause is baked in: 0% and 100% are identical frames. */
    "@keyframes n-loop-shinetext-sheen{0%{background-position:100% 0}58%,100%{background-position:0% 0}}",
    /* Gradient tile is 200% wide; moving by 200% of the box moves exactly one tile. */
    "@keyframes n-loop-shinetext-flow{from{background-position:0% 0}to{background-position:200% 0}}",
  ].join("\n"),
  recipe: [
    root({
      display: "inline-block",
      "max-width": "100%",
      loopDuration: 4800,
      color: "transparent",
      "-webkit-text-fill-color": "transparent",
      "-webkit-background-clip": "text",
      "background-clip": "text",
      "background-repeat": "repeat-x",
      "--n-shine-base": "var(--n-color-text-muted)",
      "--n-shine-hi": "var(--n-color-text)",
      "background-image": "linear-gradient(105deg, var(--n-shine-base) 0%, var(--n-shine-base) 40%, var(--n-shine-hi) 50%, var(--n-shine-base) 60%, var(--n-shine-base) 100%)",
      "background-size": "300% 100%",
      ...loopAnim("n-loop-shinetext-sheen", "4.8s", "cubic-bezier(0.5, 0, 0.3, 1)"),
    }),
    R(
      { variant: "gradient" },
      {
        loopDuration: 9000,
        "background-image": "linear-gradient(90deg, var(--n-color-text) 0%, var(--n-color-accent-text) 50%, var(--n-color-text) 100%)",
        "background-size": "200% 100%",
        ...loopAnim("n-loop-shinetext-flow", "9s"),
      },
    ),
    R({ size: "md" }, { fontSize: "{text.xl}", fontWeight: "{weight.semibold}", letterSpacing: "{tracking.tight}", lineHeight: 1.15 }),
    R({ size: "lg" }, { fontSize: "{text.3xl}", fontWeight: "{weight.semibold}", letterSpacing: "{tracking.tighter}", lineHeight: 1.1 }),
    R({ size: "xl" }, { fontSize: "{text.5xl}", fontWeight: "{weight.semibold}", letterSpacing: "{tracking.tighter}", lineHeight: 1.05 }),
  ],
});

export const LOOPS_C: ComponentDef[] = [orbit, pulseRings, borderBeam, shineText];
