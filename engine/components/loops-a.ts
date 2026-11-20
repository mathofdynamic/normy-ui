import type { ComponentDef } from "../types";
import { define, loopAnim, part, R, root } from "./kit";

/* Loop components, batch A. See engine/components/loops.ts for the contract. */

/* ---------------- marqueeColumns: testimonial wall ---------------- */

export const marqueeColumns = define({
  type: "marqueeColumns",
  label: "Marquee columns",
  category: "loops",
  description: "Testimonial wall: vertical columns of cards scrolling forever, alternate columns in opposite directions at slightly different speeds.",
  parts: { root: "Region", column: "Column", track: "Track", group: "Copy", item: "Item", card: "Card" },
  variants: ["default", "cards"],
  sizes: ["sm", "md", "lg"],
  states: [],
  defaultVariant: "default",
  defaultSize: "md",
  keyframes: "@keyframes n-loop-marqueeColumns-up{to{translate:0 -50%}}@keyframes n-loop-marqueeColumns-down{from{translate:0 -50%}to{translate:0 0}}",
  recipe: [
    root({ position: "relative", loopDuration: 60000, loopPauseOnHover: "yes", display: "grid", gridTemplateColumns: "repeat(var(--n-cols, 3), minmax(0, 1fr))", gap: "{space.4}", width: "100%", height: "30rem", overflow: "hidden", containerType: "inline-size" }),
    part("column", { position: "relative", minWidth: 0, height: "100%", overflow: "hidden", maskImage: "fade-y" }),
    part("track", { ...loopAnim("n-loop-marqueeColumns-up", "60s"), "animation-duration": "calc(var(--n-loop-duration, 60s) / var(--n-loop-speed, 1) / var(--n-motion-speed, 1) * var(--n-col-k, 1))", display: "flex", flexDirection: "column", minHeight: "200%", willChange: "transform" }),
    R({ part: "track" }, { "animation-delay": "calc(var(--n-loop-duration, 60s) / var(--n-loop-speed, 1) / var(--n-motion-speed, 1) * var(--n-col-k, 1) * -1 * var(--n-col-o, 0))" }),
    part("group", { display: "flex", flexDirection: "column", flex: "1 0 auto" }),
    part("item", { flexShrink: 0, paddingBottom: "{space.4}" }),
    part("card", { color: "{color.text}", fontSize: "{text.sm}", lineHeight: "{leading.normal}" }),
    R({ variant: "cards", part: "card" }, { bg: "{color.surface-raised}", borderWidth: "{border.thin}", borderStyle: "solid", borderColor: "{color.border}", radius: "{radius.lg}", padding: "{space.5}", shadow: "{shadow.1}" }),
    R({ size: "sm" }, { height: "22rem" }),
    R({ size: "lg" }, { height: "42rem" }),
  ],
});

/* ---------------- galleryRows: opposing rows of tiles ---------------- */

export const galleryRows = define({
  type: "galleryRows",
  label: "Gallery rows",
  category: "loops",
  description: "Two or three rows of tiles (images, cards, logos) drifting in opposite directions with soft edge fade.",
  parts: { root: "Region", stage: "Stage", row: "Row", track: "Track", group: "Copy", item: "Item", tile: "Tile" },
  variants: ["default", "tilted"],
  sizes: ["sm", "md", "lg"],
  states: [],
  defaultVariant: "default",
  defaultSize: "md",
  keyframes: "@keyframes n-loop-galleryRows-left{to{translate:-50% 0}}@keyframes n-loop-galleryRows-right{from{translate:-50% 0}to{translate:0 0}}",
  recipe: [
    root({ position: "relative", loopDuration: 50000, loopPauseOnHover: "yes", width: "100%", overflow: "hidden", containerType: "inline-size", maskImage: "fade-x", "--n-tile-h": "9rem" }),
    part("stage", { display: "flex", flexDirection: "column", gap: "{space.4}", transformOrigin: "center" }),
    part("row", { position: "relative", overflow: "hidden" }),
    part("track", { ...loopAnim("n-loop-galleryRows-left", "50s"), "animation-duration": "calc(var(--n-loop-duration, 50s) / var(--n-loop-speed, 1) / var(--n-motion-speed, 1) * var(--n-row-k, 1))", display: "flex", width: "max-content", minWidth: "200%", willChange: "transform" }),
    R({ part: "track" }, { "animation-delay": "calc(var(--n-loop-duration, 50s) / var(--n-loop-speed, 1) / var(--n-motion-speed, 1) * var(--n-row-k, 1) * -1 * var(--n-row-o, 0))" }),
    part("group", { display: "flex", flex: "1 0 auto", alignItems: "center" }),
    part("item", { flexShrink: 0, paddingRight: "{space.4}", height: "var(--n-tile-h)", display: "flex" }),
    part("tile", { height: "100%", aspectRatio: "4 / 3", overflow: "hidden", radius: "{radius.lg}", bg: "{color.surface-raised}", borderWidth: "{border.thin}", borderStyle: "solid", borderColor: "{color.border}", display: "flex", alignItems: "center", justifyContent: "center", color: "{color.text}" }),
    R({ size: "sm" }, { "--n-tile-h": "6rem" }),
    R({ size: "lg" }, { "--n-tile-h": "13rem" }),
    R({ variant: "tilted" }, { paddingY: "{space.12}", perspective: 1400 }),
    R({ variant: "tilted", part: "stage" }, { width: "140%", marginLeft: "-20%", rotate: "x 14deg", skewY: "-4deg" }),
  ],
});

/* ---------------- wordRotator: inline cycling word ---------------- */

const wordEase = "{easing.standard}";
const wordMotion = { "transition-property": "translate, rotate, opacity", transitionDuration: "{duration.slower}", transitionEasing: wordEase };

export const wordRotator = define({
  type: "wordRotator",
  label: "Word rotator",
  category: "loops",
  description: "An inline headline word that cycles through a list forever; width is reserved by the longest word so nothing jumps.",
  parts: { root: "Inline", stack: "Stack", word: { label: "Word", stateful: true } },
  variants: ["slide", "fade", "flip"],
  sizes: [],
  states: ["current", "selected"],
  defaultVariant: "slide",
  recipe: [
    root({ display: "inline-block", loopDuration: 12000, loopPauseOnHover: "no", color: "{color.accent-text}", whiteSpace: "nowrap" }),
    part("stack", { display: "inline-grid", justifyItems: "start", verticalAlign: "bottom", overflow: "clip", "overflow-clip-margin": "0px", paddingBottom: "0.14em", marginBottom: "-0.14em", paddingTop: "0.04em", marginTop: "-0.04em" }),
    part("word", { "grid-area": "1 / 1", opacity: 0, "transition-property": "none", willChange: "transform, opacity", backfaceVisibility: "hidden" }),
    /* slide: in from below, out upward */
    R({ variant: "slide", part: "word" }, { translate: "0 110%" }),
    R({ variant: "slide", part: "word", state: "current" }, { ...wordMotion, opacity: 1, translate: "0 0" }),
    R({ variant: "slide", part: "word", state: "selected" }, { ...wordMotion, opacity: 0, translate: "0 -110%" }),
    /* fade: crossfade with a small drift */
    R({ variant: "fade", part: "word" }, { translate: "0 0.3em" }),
    R({ variant: "fade", part: "word", state: "current" }, { ...wordMotion, opacity: 1, translate: "0 0" }),
    R({ variant: "fade", part: "word", state: "selected" }, { ...wordMotion, opacity: 0, translate: "0 -0.3em" }),
    R({ variant: "fade" }, { loopDuration: 12000 }),
    R({ variant: "fade", part: "stack" }, { overflow: "visible" }),
    /* flip: rotate about the horizontal axis */
    R({ variant: "flip", part: "stack" }, { perspective: 700, overflow: "visible" }),
    R({ variant: "flip", part: "word" }, { rotate: "x -90deg", transformOrigin: "50% 50%" }),
    R({ variant: "flip", part: "word", state: "current" }, { ...wordMotion, opacity: 1, rotate: "x 0deg" }),
    R({ variant: "flip", part: "word", state: "selected" }, { ...wordMotion, opacity: 0, rotate: "x 90deg" }),
  ],
});

/* ---------------- newsTicker: compact single-line ticker ---------------- */

export const newsTicker = define({
  type: "newsTicker",
  label: "News ticker",
  category: "loops",
  description: "Compact single-line bar: a pulsing 'Live' badge and a seamless scrolling line of items separated by dots.",
  parts: { root: "Bar", label: "Label badge", dot: "Live dot", ping: "Pulse ring", viewport: "Viewport", track: "Track", group: "Copy", item: "Item", sep: "Separator" },
  variants: ["default", "inverse"],
  sizes: ["sm", "md"],
  states: [],
  defaultVariant: "default",
  defaultSize: "md",
  keyframes:
    "@keyframes n-loop-newsTicker-scroll{to{translate:-50% 0}}@keyframes n-loop-newsTicker-pulse{0%{scale:1;opacity:.55}70%,100%{scale:2.6;opacity:0}}",
  recipe: [
    root({ display: "flex", alignItems: "center", gap: "{space.3}", width: "100%", minWidth: 0, containerType: "inline-size", loopDuration: 40000, loopPauseOnHover: "yes", height: "2.5rem", paddingLeft: "{space.1-5}", overflow: "hidden", bg: "{color.surface-raised}", color: "{color.text}", borderWidth: "{border.thin}", borderStyle: "solid", borderColor: "{color.border}", radius: "{radius.full}", fontSize: "{text.sm}" }),
    part("label", { flexShrink: 0, display: "inline-flex", alignItems: "center", gap: "{space.2}", height: "calc(100% - {space.3})", paddingX: "{space.3}", radius: "{radius.full}", bg: "{color.accent}", color: "{color.text-on-accent}", fontSize: "{text.xs}", fontWeight: 600, letterSpacing: "{tracking.caps}", textTransform: "uppercase" }),
    part("dot", { position: "relative", display: "inline-block", size: "0.4375rem", radius: "{radius.full}", bg: "currentColor" }),
    part("ping", { position: "absolute", inset: 0, radius: "{radius.full}", bg: "currentColor", "animation-name": "n-loop-newsTicker-pulse", "animation-duration": "calc(1800ms / var(--n-loop-speed, 1) / var(--n-motion-speed, 1))", "animation-timing-function": "ease-out", "animation-iteration-count": "infinite", "animation-play-state": "var(--n-loop-state, running)" }),
    part("viewport", { position: "relative", flex: "1 1 0%", minWidth: 0, overflow: "hidden", maskImage: "fade-x" }),
    part("track", { ...loopAnim("n-loop-newsTicker-scroll", "40s"), display: "flex", width: "max-content", minWidth: "200%", whiteSpace: "nowrap", willChange: "transform" }),
    part("group", { display: "flex", flex: "1 0 auto", alignItems: "center" }),
    part("item", { display: "inline-flex", alignItems: "center", gap: "{space.4}", paddingRight: "{space.4}", flexShrink: 0, color: "{color.text-muted}" }),
    part("sep", { flexShrink: 0, display: "inline-block", size: "0.25rem", radius: "{radius.full}", bg: "currentColor", opacity: 0.4 }),
    R({ size: "sm" }, { height: "2rem", fontSize: "{text.xs}" }),
    R({ variant: "inverse" }, { bg: "{color.surface-inverse}", color: "{color.text-inverse}", borderColor: "transparent", "--n-color-text": "var(--n-color-text-inverse)" }),
    R({ variant: "inverse", part: "item" }, { color: "color-mix(in oklch, var(--n-color-text-inverse) 78%, transparent)" }),
  ],
});

export const LOOPS_A: ComponentDef[] = [marqueeColumns, galleryRows, wordRotator, newsTicker];
