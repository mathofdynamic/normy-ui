import type { Control, GroupId, PropertyDef, TokenGroup } from "../types";

/* ------------------------------------------------------------------ *
 * Style, motion and behaviour properties. One entry = one knob that
 * appears in the inspector, the resolver, exports and the docs.
 * ------------------------------------------------------------------ */

type Opts = Partial<Omit<PropertyDef, "id" | "label" | "group" | "control">>;

const S = (id: string, label: string, group: GroupId, control: Control, css: string | string[] | undefined, o: Opts = {}): PropertyDef => ({
  id,
  label,
  group,
  kind: "style",
  control,
  css,
  animatable: false,
  ...o,
});

const opts = (...values: string[]) => values.map((v) => ({ value: v, label: v }));
const sel = (...values: string[]): Control => ({ type: "select", options: opts(...values) });
const len = (tokens: TokenGroup[] = [], min = 0, max = 200, step = 1, units = ["px", "rem", "%", "em"]): Control => ({
  type: "length",
  min,
  max,
  step,
  units,
  tokens,
});
const num = (min: number, max: number, step = 1, unit?: string): Control => ({ type: "number", min, max, step, unit });
const color: Control = { type: "color" };
const text = (placeholder?: string): Control => ({ type: "text", placeholder });
const time: Control = { type: "time", min: 0, max: 4000, step: 10 };
const easing: Control = { type: "easing" };

const SP: TokenGroup[] = ["space", "size"];

/* ---------------- layout ---------------- */
const LAYOUT: PropertyDef[] = [
  S("display", "Display", "layout", sel("block", "inline", "inline-block", "flex", "inline-flex", "grid", "inline-grid", "contents", "none"), "display"),
  S("flexDirection", "Direction", "layout", sel("row", "row-reverse", "column", "column-reverse"), "flex-direction"),
  S("flexWrap", "Wrap", "layout", sel("nowrap", "wrap", "wrap-reverse"), "flex-wrap"),
  S("alignItems", "Align items", "layout", sel("stretch", "flex-start", "center", "flex-end", "baseline"), "align-items"),
  S("alignContent", "Align content", "layout", sel("normal", "flex-start", "center", "flex-end", "space-between", "space-around", "stretch"), "align-content"),
  S("alignSelf", "Align self", "layout", sel("auto", "stretch", "flex-start", "center", "flex-end", "baseline"), "align-self"),
  S("justifyContent", "Justify content", "layout", sel("flex-start", "center", "flex-end", "space-between", "space-around", "space-evenly", "stretch"), "justify-content"),
  S("justifyItems", "Justify items", "layout", sel("stretch", "start", "center", "end"), "justify-items"),
  S("justifySelf", "Justify self", "layout", sel("auto", "stretch", "start", "center", "end"), "justify-self"),
  S("placeItems", "Place items", "layout", sel("normal", "center", "start", "end", "stretch"), "place-items"),
  S("gap", "Gap", "layout", len(SP), "gap", { animatable: true }),
  S("rowGap", "Row gap", "layout", len(SP), "row-gap", { animatable: true }),
  S("columnGap", "Column gap", "layout", len(SP), "column-gap", { animatable: true }),
  S("gridTemplateColumns", "Grid columns", "layout", text("repeat(3, minmax(0, 1fr))"), "grid-template-columns", { animatable: true }),
  S("gridTemplateRows", "Grid rows", "layout", text("auto 1fr"), "grid-template-rows", { animatable: true }),
  S("gridAutoFlow", "Grid flow", "layout", sel("row", "column", "dense", "row dense"), "grid-auto-flow"),
  S("gridAutoRows", "Grid auto rows", "layout", text("minmax(8rem, auto)"), "grid-auto-rows"),
  S("gridColumn", "Grid column", "layout", text("span 2"), "grid-column"),
  S("gridRow", "Grid row", "layout", text("span 2"), "grid-row"),
  S("columns", "Text columns", "layout", text("2 18rem"), "columns"),
  S("flex", "Flex", "layout", text("1 1 0%"), "flex"),
  S("flexGrow", "Grow", "layout", num(0, 10), "flex-grow"),
  S("flexShrink", "Shrink", "layout", num(0, 10), "flex-shrink"),
  S("flexBasis", "Basis", "layout", len(SP), "flex-basis"),
  S("order", "Order", "layout", num(-10, 10), "order"),
  S("aspectRatio", "Aspect ratio", "layout", sel("auto", "1", "4 / 3", "3 / 2", "16 / 9", "21 / 9", "3 / 4", "2 / 3"), "aspect-ratio"),
  S("overflow", "Overflow", "layout", sel("visible", "hidden", "clip", "auto", "scroll"), "overflow"),
  S("overflowX", "Overflow X", "layout", sel("visible", "hidden", "clip", "auto", "scroll"), "overflow-x"),
  S("overflowY", "Overflow Y", "layout", sel("visible", "hidden", "clip", "auto", "scroll"), "overflow-y"),
  S("position", "Position", "layout", sel("static", "relative", "absolute", "fixed", "sticky"), "position"),
  S("inset", "Inset", "layout", len(SP, -200), "inset", { animatable: true }),
  S("top", "Top", "layout", len(SP, -200), "top", { animatable: true }),
  S("right", "Right", "layout", len(SP, -200), "right", { animatable: true }),
  S("bottom", "Bottom", "layout", len(SP, -200), "bottom", { animatable: true }),
  S("left", "Left", "layout", len(SP, -200), "left", { animatable: true }),
  S("zIndex", "Z-index", "layout", { type: "length", tokens: ["z"], min: -10, max: 9999, units: [""] }, "z-index"),
  S("isolation", "Isolation", "layout", sel("auto", "isolate"), "isolation"),
  S("visibility", "Visibility", "layout", sel("visible", "hidden", "collapse"), "visibility"),
  S("boxSizing", "Box sizing", "layout", sel("border-box", "content-box"), "box-sizing"),
  S("verticalAlign", "Vertical align", "layout", sel("baseline", "middle", "top", "bottom", "text-top", "text-bottom"), "vertical-align"),
  S("objectFit", "Object fit", "layout", sel("fill", "contain", "cover", "none", "scale-down"), "object-fit"),
  S("objectPosition", "Object position", "layout", text("50% 50%"), "object-position"),
  S("containerType", "Container type", "layout", sel("normal", "inline-size", "size"), "container-type"),
  S("borderCollapse", "Table borders", "layout", sel("separate", "collapse"), "border-collapse"),
  S("borderSpacing", "Table spacing", "layout", len(SP, 0, 32), "border-spacing"),
  S("tableLayout", "Table layout", "layout", sel("auto", "fixed"), "table-layout"),
  S("captionSide", "Caption side", "layout", sel("top", "bottom"), "caption-side"),
  S("willChange", "Will change", "layout", sel("auto", "transform", "opacity", "scroll-position"), "will-change"),
  S("contentVisibility", "Content visibility", "layout", sel("visible", "auto", "hidden"), "content-visibility"),
];

/* ---------------- spacing & sizing ---------------- */
const side = (prefix: string, label: string, css: string) => [
  S(prefix, label, "spacing", len(SP, -64), css, { animatable: true }),
  S(`${prefix}X`, `${label} X`, "spacing", len(SP, -64), `${css}-inline`, { animatable: true }),
  S(`${prefix}Y`, `${label} Y`, "spacing", len(SP, -64), `${css}-block`, { animatable: true }),
  S(`${prefix}Top`, `${label} top`, "spacing", len(SP, -64), `${css}-top`, { animatable: true }),
  S(`${prefix}Right`, `${label} right`, "spacing", len(SP, -64), `${css}-right`, { animatable: true }),
  S(`${prefix}Bottom`, `${label} bottom`, "spacing", len(SP, -64), `${css}-bottom`, { animatable: true }),
  S(`${prefix}Left`, `${label} left`, "spacing", len(SP, -64), `${css}-left`, { animatable: true }),
];
const SPACING: PropertyDef[] = [
  ...side("padding", "Padding", "padding"),
  ...side("margin", "Margin", "margin"),
  S("width", "Width", "spacing", len(SP, 0, 1600), "width", { animatable: true }),
  S("height", "Height", "spacing", len(SP, 0, 1200), "height", { animatable: true }),
  S("minWidth", "Min width", "spacing", len(SP, 0, 1600), "min-width", { animatable: true }),
  S("maxWidth", "Max width", "spacing", len([...SP, "type"], 0, 1920), "max-width", { animatable: true }),
  S("minHeight", "Min height", "spacing", len(SP, 0, 1200), "min-height", { animatable: true }),
  S("maxHeight", "Max height", "spacing", len(SP, 0, 1200), "max-height", { animatable: true }),
  S("size", "Size (w + h)", "spacing", len(SP, 0, 400), ["width", "height"], { animatable: true }),
];

/* ---------------- typography ---------------- */
const TEXT: PropertyDef[] = [
  S("fontFamily", "Family", "text", { type: "font" }, "font-family", { tokens: ["font"] }),
  S("fontSize", "Size", "text", len(["text"], 8, 200, 0.5), "font-size", { animatable: true }),
  S("fontWeight", "Weight", "text", { type: "length", tokens: ["weight"], min: 100, max: 900, step: 10, units: [""] }, "font-weight", { animatable: true }),
  S("fontStyle", "Style", "text", sel("normal", "italic", "oblique"), "font-style"),
  S("lineHeight", "Line height", "text", { type: "length", tokens: ["leading"], min: 0.6, max: 3, step: 0.01, units: ["", "px", "rem"] }, "line-height", { animatable: true }),
  S("letterSpacing", "Letter spacing", "text", { type: "length", tokens: ["tracking"], min: -0.1, max: 0.5, step: 0.005, units: ["em", "px"] }, "letter-spacing", { animatable: true }),
  S("textTransform", "Case", "text", sel("none", "uppercase", "lowercase", "capitalize"), "text-transform"),
  S("fontVariantCaps", "Caps variant", "text", sel("normal", "small-caps", "all-small-caps", "petite-caps"), "font-variant-caps"),
  S("textDecorationLine", "Decoration", "text", sel("none", "underline", "overline", "line-through"), "text-decoration-line"),
  S("textDecorationStyle", "Decoration style", "text", sel("solid", "double", "dotted", "dashed", "wavy"), "text-decoration-style"),
  S("textDecorationColor", "Decoration color", "text", color, "text-decoration-color", { animatable: true, tokens: ["color"] }),
  S("textDecorationThickness", "Decoration thickness", "text", len([], 0, 12, 0.5, ["px", "em", "from-font"]), "text-decoration-thickness", { animatable: true }),
  S("textUnderlineOffset", "Underline offset", "text", len([], -4, 20, 0.5, ["px", "em"]), "text-underline-offset", { animatable: true }),
  S("textAlign", "Align", "text", sel("start", "center", "end", "justify"), "text-align"),
  S("textWrap", "Wrap", "text", sel("wrap", "nowrap", "balance", "pretty"), "text-wrap"),
  S("whiteSpace", "White space", "text", sel("normal", "nowrap", "pre", "pre-wrap", "pre-line"), "white-space"),
  S("wordBreak", "Word break", "text", sel("normal", "break-all", "keep-all", "break-word"), "word-break"),
  S("hyphens", "Hyphens", "text", sel("none", "manual", "auto"), "hyphens"),
  S("textOverflow", "Text overflow", "text", sel("clip", "ellipsis"), "text-overflow"),
  S("lineClamp", "Line clamp", "text", num(0, 12), undefined, {
    emit: (v) =>
      v === "0"
        ? [{ prop: "-webkit-line-clamp", value: "none" }]
        : [
            { prop: "display", value: "-webkit-box" },
            { prop: "-webkit-box-orient", value: "vertical" },
            { prop: "-webkit-line-clamp", value: v },
            { prop: "overflow", value: "hidden" },
          ],
  }),
  S("textIndent", "Indent", "text", len(SP, -64, 64), "text-indent"),
  S("fontFeatureSettings", "Font features", "text", text('"ss01" 1, "tnum" 1'), "font-feature-settings"),
  S("fontVariantNumeric", "Numerals", "text", sel("normal", "tabular-nums", "oldstyle-nums", "lining-nums", "slashed-zero", "diagonal-fractions"), "font-variant-numeric"),
  S("fontVariationSettings", "Variable axes", "text", text('"wght" 650, "wdth" 112'), "font-variation-settings", { animatable: true }),
  S("fontStretch", "Width axis", "text", num(50, 200, 1, "%"), "font-stretch", { animatable: true }),
  S("fontOpticalSizing", "Optical sizing", "text", sel("auto", "none"), "font-optical-sizing"),
  S("fontKerning", "Kerning", "text", sel("auto", "normal", "none"), "font-kerning"),
  S("fontSmoothing", "Smoothing", "text", sel("auto", "antialiased", "subpixel-antialiased"), "-webkit-font-smoothing"),
  S("textShadow", "Text shadow", "text", text("0 1px 0 rgb(0 0 0 / .2)"), "text-shadow", { animatable: true }),
  S("color", "Text color", "text", color, "color", { animatable: true, tokens: ["color"] }),
  S("caretColor", "Caret color", "text", color, "caret-color", { tokens: ["color"] }),
  S("accentColor", "Native accent", "text", color, "accent-color", { tokens: ["color"] }),
  S("placeholderColor", "Placeholder color", "text", color, "color", { pseudo: "::placeholder", tokens: ["color"] }),
  S("listStyle", "List style", "text", sel("none", "disc", "decimal", "square", "circle"), "list-style"),
  S("textOpacity", "Text opacity", "text", num(0, 1, 0.01), undefined, {
    emit: (v) => [{ prop: "color", value: `color-mix(in oklch, currentColor ${Math.round(Number(v) * 100)}%, transparent)` }],
  }),
];

/* ---------------- background ---------------- */
const BG: PropertyDef[] = [
  S("bg", "Background color", "background", color, "background-color", { animatable: true, tokens: ["color"], keywords: ["fill", "surface"] }),
  S("gradient", "Gradient", "background", { type: "gradient" }, undefined, { slot: { composite: "bg", name: "grad" }, keywords: ["linear", "radial", "conic", "mesh"] }),
  S("backgroundImage", "Image URL", "background", text("url(/photo.jpg)"), undefined, { slot: { composite: "bg", name: "img" } }),
  S("pattern", "Pattern", "background", sel("none", "dots", "grid", "lines", "diagonal", "checker"), undefined, { slot: { composite: "bg", name: "pat" } }),
  S("patternColor", "Pattern color", "background", color, undefined, { cssVar: "--n-pat-color", tokens: ["color"] }),
  S("patternSize", "Pattern size", "background", len(SP, 2, 120), undefined, { cssVar: "--n-pat-size" }),
  S("grain", "Grain", "background", num(0, 1, 0.01), undefined, { slot: { composite: "bg", name: "grain" }, keywords: ["noise", "texture"] }),
  S("backgroundSize", "Size", "background", sel("auto", "cover", "contain", "200% 200%", "100% 100%"), undefined, { cssVar: "--n-bg-size" }),
  S("backgroundPosition", "Position", "background", text("center"), undefined, { cssVar: "--n-bg-pos", animatable: true }),
  S("backgroundRepeat", "Repeat", "background", sel("no-repeat", "repeat", "repeat-x", "repeat-y", "round", "space"), undefined, { cssVar: "--n-bg-repeat" }),
  S("backgroundBlendMode", "Blend mode", "background", sel("normal", "multiply", "screen", "overlay", "soft-light", "difference", "color", "luminosity"), "background-blend-mode"),
  S("backgroundClip", "Clip", "background", sel("border-box", "padding-box", "content-box", "text"), ["background-clip", "-webkit-background-clip"]),
  S("backgroundAttachment", "Attachment", "background", sel("scroll", "fixed", "local"), "background-attachment"),
];

/* ---------------- border ---------------- */
const BORDER: PropertyDef[] = [
  S("borderWidth", "Width", "border", len(["border"], 0, 16, 0.5, ["px"]), "border-width", { animatable: true }),
  S("borderStyle", "Style", "border", sel("none", "solid", "dashed", "dotted", "double", "groove", "ridge", "inset", "outset"), "border-style"),
  S("borderColor", "Color", "border", color, "border-color", { animatable: true, tokens: ["color"] }),
  S("borderTopWidth", "Top width", "border", len(["border"], 0, 16, 0.5, ["px"]), "border-top-width", { animatable: true }),
  S("borderRightWidth", "Right width", "border", len(["border"], 0, 16, 0.5, ["px"]), "border-right-width", { animatable: true }),
  S("borderBottomWidth", "Bottom width", "border", len(["border"], 0, 16, 0.5, ["px"]), "border-bottom-width", { animatable: true }),
  S("borderLeftWidth", "Left width", "border", len(["border"], 0, 16, 0.5, ["px"]), "border-left-width", { animatable: true }),
  S("borderTopColor", "Top color", "border", color, "border-top-color", { animatable: true, tokens: ["color"] }),
  S("borderBottomColor", "Bottom color", "border", color, "border-bottom-color", { animatable: true, tokens: ["color"] }),
  S("borderLeftColor", "Left color", "border", color, "border-left-color", { animatable: true, tokens: ["color"] }),
  S("borderRightColor", "Right color", "border", color, "border-right-color", { animatable: true, tokens: ["color"] }),
  S("outlineWidth", "Outline width", "border", len(["focus", "border"], 0, 12, 0.5, ["px"]), "outline-width", { animatable: true }),
  S("outlineStyle", "Outline style", "border", sel("none", "solid", "dashed", "dotted", "double", "auto"), "outline-style"),
  S("outlineColor", "Outline color", "border", color, "outline-color", { animatable: true, tokens: ["color"] }),
  S("outlineOffset", "Outline offset", "border", len(["focus"], -8, 12, 0.5, ["px"]), "outline-offset", { animatable: true }),
  S("focusRing", "Focus ring", "border", sel("token", "none", "outline", "halo", "underline"), undefined, {
    emit: (v) => {
      switch (v) {
        case "none":
          return [{ prop: "outline", value: "none" }];
        case "halo":
          return [
            { prop: "outline", value: "none" },
            { prop: "box-shadow", value: "0 0 0 var(--n-focus-width) var(--n-color-focus)" },
          ];
        case "underline":
          return [
            { prop: "outline", value: "none" },
            { prop: "box-shadow", value: "inset 0 calc(var(--n-focus-width) * -1) 0 var(--n-color-focus)" },
          ];
        default:
          return [
            { prop: "outline", value: "var(--n-focus-width) var(--n-focus-style) var(--n-color-focus)" },
            { prop: "outline-offset", value: "var(--n-focus-offset)" },
          ];
      }
    },
    description: "Applied in the focus state. 'token' uses the global focus tokens.",
  }),
  S("divideColor", "Divider color", "border", color, undefined, { cssVar: "--n-divide-color", inherits: true, tokens: ["color"] }),
];

/* ---------------- radius ---------------- */
const RADIUS: PropertyDef[] = [
  S("radius", "Radius", "radius", len(["radius"], 0, 64, 0.5, ["px", "rem", "%"]), "border-radius", { animatable: true, keywords: ["corner", "round"] }),
  S("radiusTopLeft", "Top left", "radius", len(["radius"], 0, 64, 0.5), "border-top-left-radius", { animatable: true }),
  S("radiusTopRight", "Top right", "radius", len(["radius"], 0, 64, 0.5), "border-top-right-radius", { animatable: true }),
  S("radiusBottomRight", "Bottom right", "radius", len(["radius"], 0, 64, 0.5), "border-bottom-right-radius", { animatable: true }),
  S("radiusBottomLeft", "Bottom left", "radius", len(["radius"], 0, 64, 0.5), "border-bottom-left-radius", { animatable: true }),
  S("cornerShape", "Corner shape", "radius", sel("round", "squircle", "bevel", "scoop", "notch", "square"), "corner-shape", { tokens: ["shape"], keywords: ["superellipse"] }),
];

/* ---------------- shadow ---------------- */
const SHADOW: PropertyDef[] = [
  S("shadow", "Shadow", "shadow", { type: "shadow" }, "box-shadow", { animatable: true, tokens: ["shadow"], keywords: ["elevation", "glow", "inset"] }),
  S("dropShadow", "Drop shadow (filter)", "shadow", text("0 8px 16px rgb(0 0 0 / .2)"), undefined, {
    slot: { composite: "filter", name: "drop", wrap: (v) => `drop-shadow(${v})` },
    animatable: true,
  }),
];

/* ---------------- effects ---------------- */
const f = (id: string, label: string, fn: string, control: Control, comp: "filter" | "backdrop" = "filter"): PropertyDef =>
  S(id, label, "effects", control, undefined, {
    slot: { composite: comp, name: id, wrap: (v) => `${fn}(${v})` },
    animatable: true,
  });
const EFFECTS: PropertyDef[] = [
  S("opacity", "Opacity", "effects", num(0, 1, 0.01), "opacity", { animatable: true, tokens: ["opacity"] }),
  f("blur", "Blur", "blur", len(["blur"], 0, 60, 0.5, ["px"])),
  f("brightness", "Brightness", "brightness", num(0, 3, 0.01)),
  f("contrast", "Contrast", "contrast", num(0, 3, 0.01)),
  f("saturate", "Saturate", "saturate", num(0, 4, 0.01)),
  f("hueRotate", "Hue rotate", "hue-rotate", num(-180, 180, 1, "deg")),
  f("grayscale", "Grayscale", "grayscale", num(0, 1, 0.01)),
  f("sepia", "Sepia", "sepia", num(0, 1, 0.01)),
  f("invert", "Invert", "invert", num(0, 1, 0.01)),
  f("backdropBlur", "Backdrop blur", "blur", len(["blur"], 0, 80, 0.5, ["px"]), "backdrop"),
  f("backdropSaturate", "Backdrop saturate", "saturate", num(0, 4, 0.01), "backdrop"),
  f("backdropBrightness", "Backdrop brightness", "brightness", num(0, 3, 0.01), "backdrop"),
  S("mixBlendMode", "Blend mode", "effects", sel("normal", "multiply", "screen", "overlay", "darken", "lighten", "difference", "exclusion", "color-dodge", "soft-light", "luminosity"), "mix-blend-mode"),
  S("maskImage", "Mask", "effects", sel("none", "fade-bottom", "fade-top", "fade-x", "fade-y", "radial"), undefined, {
    emit: (v) => {
      const m: Record<string, string> = {
        none: "none",
        "fade-bottom": "linear-gradient(to bottom, #000 60%, transparent)",
        "fade-top": "linear-gradient(to top, #000 60%, transparent)",
        "fade-x": "linear-gradient(to right, transparent, #000 12%, #000 88%, transparent)",
        "fade-y": "linear-gradient(to bottom, transparent, #000 12%, #000 88%, transparent)",
        radial: "radial-gradient(closest-side, #000 60%, transparent)",
      };
      const value = m[v] ?? v;
      return [
        { prop: "mask-image", value },
        { prop: "-webkit-mask-image", value },
      ];
    },
  }),
  S("clipPath", "Clip path", "effects", sel("none", "notch", "slant", "slant-reverse", "ticket", "hexagon", "circle", "chevron"), undefined, {
    animatable: true,
    emit: (v) => {
      const m: Record<string, string> = {
        none: "none",
        notch: "polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)",
        slant: "polygon(0 0, 100% 0, 100% 88%, 0 100%)",
        "slant-reverse": "polygon(0 0, 100% 0, 100% 100%, 0 88%)",
        ticket: "polygon(0 0, 100% 0, 100% 40%, calc(100% - 10px) 50%, 100% 60%, 100% 100%, 0 100%, 0 60%, 10px 50%, 0 40%)",
        hexagon: "polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%)",
        circle: "circle(50%)",
        chevron: "polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%, 14px 50%)",
      };
      return [{ prop: "clip-path", value: m[v] ?? v }];
    },
  }),
];

/* ---------------- transform ---------------- */
const TRANSFORM: PropertyDef[] = [
  S("translateX", "Translate X", "transform", len(SP, -200, 200, 0.5, ["px", "%", "rem"]), undefined, { slot: { composite: "translate", name: "tx" }, animatable: true }),
  S("translateY", "Translate Y", "transform", len(SP, -200, 200, 0.5, ["px", "%", "rem"]), undefined, { slot: { composite: "translate", name: "ty" }, animatable: true }),
  S("scale", "Scale", "transform", num(0, 3, 0.01), "scale", { animatable: true }),
  S("rotate", "Rotate", "transform", num(-360, 360, 0.5, "deg"), "rotate", { animatable: true }),
  S("skewX", "Skew X", "transform", num(-60, 60, 0.5, "deg"), undefined, { slot: { composite: "transform", name: "skx", wrap: (v) => `skewX(${v})` }, animatable: true }),
  S("skewY", "Skew Y", "transform", num(-60, 60, 0.5, "deg"), undefined, { slot: { composite: "transform", name: "sky", wrap: (v) => `skewY(${v})` }, animatable: true }),
  S("perspective", "Perspective", "transform", len([], 0, 3000, 10, ["px"]), "perspective"),
  S("transformOrigin", "Origin", "transform", sel("center", "top", "bottom", "left", "right", "top left", "top right", "bottom left", "bottom right"), "transform-origin"),
  S("transformStyle", "Transform style", "transform", sel("flat", "preserve-3d"), "transform-style"),
  S("backfaceVisibility", "Backface", "transform", sel("visible", "hidden"), "backface-visibility"),
];

/* ---------------- interaction ---------------- */
const INTERACTION: PropertyDef[] = [
  S("cursor", "Cursor", "interaction", sel("auto", "default", "pointer", "text", "move", "grab", "grabbing", "crosshair", "not-allowed", "wait", "progress", "help", "zoom-in", "none"), "cursor"),
  S("pointerEvents", "Pointer events", "interaction", sel("auto", "none"), "pointer-events"),
  S("userSelect", "User select", "interaction", sel("auto", "none", "text", "all"), ["user-select", "-webkit-user-select"]),
  S("touchAction", "Touch action", "interaction", sel("auto", "none", "pan-x", "pan-y", "manipulation"), "touch-action"),
  S("minTargetSize", "Min target size", "interaction", len(["target", "size"], 0, 64), ["min-width", "min-height"], { keywords: ["touch", "a11y"] }),
  S("hitArea", "Hit area extension", "interaction", len([], 0, 24), undefined, {
    pseudo: "::after",
    emit: (v) => [
      { prop: "content", value: "''" },
      { prop: "position", value: "absolute" },
      { prop: "inset", value: `calc(${v} * -1)` },
    ],
    description: "Invisible ::after that enlarges the clickable area. Element must be positioned.",
  }),
  S("scrollBehavior", "Scroll behaviour", "interaction", sel("auto", "smooth"), "scroll-behavior"),
  S("scrollSnapType", "Snap type", "interaction", sel("none", "x mandatory", "x proximity", "y mandatory", "y proximity"), "scroll-snap-type"),
  S("scrollSnapAlign", "Snap align", "interaction", sel("none", "start", "center", "end"), "scroll-snap-align"),
  S("overscrollBehavior", "Overscroll", "interaction", sel("auto", "contain", "none"), "overscroll-behavior"),
  S("resize", "Resize", "interaction", sel("none", "both", "vertical", "horizontal"), "resize"),
  S("scrollbarWidth", "Scrollbar width", "interaction", sel("auto", "thin", "none"), "scrollbar-width"),
  S("scrollbarColor", "Scrollbar color", "interaction", text("var(--n-color-border-strong) transparent"), "scrollbar-color"),
];

/* ---------------- icon ---------------- */
const ICON: PropertyDef[] = [
  S("iconSize", "Icon size", "icon", len(["text", "space"], 8, 64, 0.5, ["px", "em", "rem"]), undefined, { cssVar: "--n-icon-size", inherits: true }),
  S("iconStroke", "Stroke width", "icon", num(0.5, 3, 0.05), undefined, { cssVar: "--n-icon-stroke", inherits: true }),
  S("iconLinecap", "Line cap", "icon", sel("round", "butt", "square"), undefined, { cssVar: "--n-icon-cap", inherits: true }),
  S("iconLinejoin", "Line join", "icon", sel("round", "miter", "bevel"), undefined, { cssVar: "--n-icon-join", inherits: true }),
  S("iconFill", "Icon style", "icon", sel("outline", "duotone", "solid"), undefined, {
    inherits: true,
    emit: (v) => [{ prop: "--n-icon-fill", value: v === "solid" ? "1" : v === "duotone" ? "0.22" : "0" }],
  }),
  S("iconColor", "Icon color", "icon", color, undefined, { cssVar: "--n-icon-color", inherits: true, tokens: ["color"] }),
  S("iconPosition", "Icon position", "icon", sel("start", "end"), undefined, {
    inherits: true,
    emit: (v) => [{ prop: "--n-icon-order", value: v === "end" ? "2" : "-1" }],
  }),
];

/* ---------------- svg ---------------- */
const SVG: PropertyDef[] = [
  S("fill", "Fill", "svg", color, "fill", { animatable: true, tokens: ["color"] }),
  S("fillOpacity", "Fill opacity", "svg", num(0, 1, 0.01), "fill-opacity", { animatable: true }),
  S("stroke", "Stroke", "svg", color, "stroke", { animatable: true, tokens: ["color"] }),
  S("strokeWidth", "Stroke width", "svg", num(0, 12, 0.25), "stroke-width", { animatable: true }),
  S("strokeOpacity", "Stroke opacity", "svg", num(0, 1, 0.01), "stroke-opacity", { animatable: true }),
  S("strokeDasharray", "Dash pattern", "svg", text("4 4"), "stroke-dasharray"),
  S("strokeLinecap", "Line cap", "svg", sel("butt", "round", "square"), "stroke-linecap"),
  S("strokeLinejoin", "Line join", "svg", sel("miter", "round", "bevel"), "stroke-linejoin"),
];

/* ---------------- generated content ---------------- */
const CONTENT: PropertyDef[] = [
  S("beforeContent", "Before content", "content", text('"› "'), undefined, {
    pseudo: "::before",
    emit: (v) => [{ prop: "content", value: v }],
    description: "A CSS string, e.g. \"> \" for terminal prompts or \"§ \" for clauses.",
  }),
  S("afterContent", "After content", "content", text('" →"'), undefined, {
    pseudo: "::after",
    emit: (v) => [{ prop: "content", value: v }],
  }),
  S("beforeColor", "Before color", "content", color, "color", { pseudo: "::before", tokens: ["color"] }),
  S("selectionBg", "Selection color", "content", color, "background-color", { pseudo: "::selection", tokens: ["color"] }),
];

/* ---------------- transitions ---------------- */
const TRANSITION: PropertyDef[] = [
  S("transitionProperty", "Animate", "transition", sel("all", "none", "colors", "transform", "colors, transform", "opacity", "default"), undefined, {
    emit: (v) => {
      const m: Record<string, string> = {
        colors: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
        transform: "translate, scale, rotate, transform",
        "colors, transform":
          "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, translate, scale, rotate, transform",
        default:
          "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, opacity, box-shadow, translate, scale, rotate, transform, filter, backdrop-filter, border-radius, letter-spacing, width, height, gap, padding",
      };
      return [{ prop: "transition-property", value: m[v] ?? v }];
    },
  }),
  S("transitionDuration", "Duration", "transition", time, "transition-duration", { tokens: ["duration"] }),
  S("transitionEasing", "Easing", "transition", easing, "transition-timing-function", { tokens: ["easing"] }),
  S("transitionDelay", "Delay", "transition", time, "transition-delay", { tokens: ["duration"] }),
];

/* ---------------- motion: entrance ---------------- */
const M = (id: string, label: string, group: GroupId, control: Control, cssVar: string, o: Opts = {}): PropertyDef => ({
  id,
  label,
  group,
  kind: "motion",
  control,
  cssVar,
  animatable: false,
  ...o,
});

export const ENTER_PRESETS = [
  "none",
  "fade",
  "rise",
  "fall",
  "slide-left",
  "slide-right",
  "zoom",
  "zoom-out",
  "blur",
  "flip",
  "swing",
  "clip-up",
  "clip-down",
  "clip-left",
  "clip-right",
  "iris",
  "skew",
  "drop",
  "custom",
] as const;

const ENTER: PropertyDef[] = [
  M("enterEffect", "Entrance", "enter", sel(...ENTER_PRESETS), "--n-enter", { keywords: ["reveal", "appear", "animate in"] }),
  M("enterOpacity", "From opacity", "enter", num(0, 1, 0.01), "--n-enter-opacity"),
  M("enterX", "From X", "enter", len([], -400, 400, 1, ["px", "%"]), "--n-enter-x"),
  M("enterY", "From Y", "enter", len([], -400, 400, 1, ["px", "%"]), "--n-enter-y"),
  M("enterScale", "From scale", "enter", num(0, 2, 0.01), "--n-enter-scale"),
  M("enterRotate", "From rotate", "enter", num(-180, 180, 1, "deg"), "--n-enter-rotate"),
  M("enterBlur", "From blur", "enter", len([], 0, 40, 0.5, ["px"]), "--n-enter-blur"),
  M("enterSkew", "From skew", "enter", num(-45, 45, 0.5, "deg"), "--n-enter-skew"),
  M("enterClip", "Clip reveal", "enter", sel("none", "up", "down", "left", "right", "iris"), "--n-enter-clip"),
  M("enterDuration", "Duration", "enter", time, "--n-enter-duration", { tokens: ["duration"] }),
  M("enterDelay", "Delay", "enter", time, "--n-enter-delay"),
  M("enterEasing", "Easing", "enter", easing, "--n-enter-easing", { tokens: ["easing"] }),
  M("enterStagger", "Stagger", "enter", time, "--n-enter-stagger"),
  M("enterStaggerFrom", "Stagger from", "enter", sel("first", "last", "center", "random"), "--n-enter-from"),
  M("enterTrigger", "Trigger", "enter", sel("inview", "load", "none"), "--n-enter-trigger"),
  M("enterThreshold", "In-view threshold", "enter", num(0, 1, 0.05), "--n-enter-threshold"),
  M("enterMargin", "In-view margin", "enter", len([], -50, 50, 1, ["%"]), "--n-enter-margin"),
  M("enterOnce", "Play once", "enter", sel("once", "every"), "--n-enter-once"),
  M("enterLead", "Next starts after", "enter", num(0, 150, 1, "%"), "--n-enter-lead", {
    description: "Sequencing as a share of one item's duration: 0% = all together, 33% = overlap, 100% = one after another. Overrides Stagger.",
    keywords: ["sequence", "overlap", "cascade", "one by one"],
  }),
  M("enterCap", "Longest sequence", "enter", { type: "time", min: 0, max: 6000, step: 50 }, "--n-enter-cap", {
    description: "Caps the total sequence length so long lists never take forever. 0 = no cap.",
  }),
  M("enterGroup", "Sequence across", "enter", sel("siblings", "section", "none"), "--n-enter-group", {
    description: "siblings = items with the same parent cascade together; section = everything revealed inside one section shares one sequence; none = each item on its own.",
  }),
];

/* ---------------- motion: open & close (pop-ups, menus, dialogs, drawers, toasts) ---------------- */
export const OPEN_EFFECTS = ["none", "fade", "pop", "rise", "fall", "slide-left", "slide-right", "slide-up", "slide-down", "zoom", "blur", "flip"] as const;
/** Start pose per open effect. Distances use --n-open-distance so one slider scales them. */
const OPEN_POSE: Record<string, Record<string, string>> = {
  fade: {},
  pop: { "--n-open-scale": "0.96", "--n-open-y": "calc(var(--n-open-distance, 6px) * 0.66)" },
  rise: { "--n-open-y": "var(--n-open-distance, 8px)" },
  fall: { "--n-open-y": "calc(var(--n-open-distance, 8px) * -1)" },
  "slide-left": { "--n-open-x": "var(--n-open-distance, 100%)", "--n-open-opacity": "1" },
  "slide-right": { "--n-open-x": "calc(var(--n-open-distance, 100%) * -1)", "--n-open-opacity": "1" },
  "slide-up": { "--n-open-y": "var(--n-open-distance, 100%)", "--n-open-opacity": "1" },
  "slide-down": { "--n-open-y": "calc(var(--n-open-distance, 100%) * -1)", "--n-open-opacity": "1" },
  zoom: { "--n-open-scale": "0.88" },
  blur: { "--n-open-blur": "8px", "--n-open-scale": "0.98" },
  flip: { "--n-open-rx": "-14deg", "--n-open-y": "calc(var(--n-open-distance, 6px) * 0.5)" },
};
export const CLOSE_EFFECTS = ["mirror", "fade", "shrink", "sink", "none"] as const;

const PRESENCE: PropertyDef[] = [
  M("openEffect", "Open animation", "presence", sel(...OPEN_EFFECTS), "--n-open", {
    keywords: ["popup", "modal", "menu", "appear", "enter"],
    emit: (v) => {
      if (v === "none") return [{ prop: "animation-name", value: "none" }];
      const pose = OPEN_POSE[v] ?? {};
      const decls = [
        { prop: "--n-open-x", value: "0px" },
        { prop: "--n-open-y", value: "0px" },
        { prop: "--n-open-scale", value: "1" },
        { prop: "--n-open-rx", value: "0deg" },
        { prop: "--n-open-blur", value: "0px" },
        { prop: "--n-open-opacity", value: "0" },
      ].map((d) => ({ prop: d.prop, value: pose[d.prop] ?? d.value }));
      return [
        ...decls,
        { prop: "animation-name", value: `var(--n-presence-anim, ${v === "blur" ? "n-open-blur" : "n-open"})` },
        { prop: "animation-duration", value: "calc(var(--n-open-duration, 200ms) / var(--n-presence-k, 1) / var(--n-motion-speed, 1))" },
        { prop: "animation-timing-function", value: "var(--n-presence-ease, var(--n-open-easing, var(--n-easing-enter)))" },
        { prop: "animation-fill-mode", value: "both" },
      ];
    },
  }),
  M("openDuration", "Open duration", "presence", time, "--n-open-duration", { tokens: ["duration"] }),
  M("openEasing", "Open easing", "presence", easing, "--n-open-easing", { tokens: ["easing"] }),
  M("openDistance", "Travel distance", "presence", len([], 0, 400, 1, ["px", "%"]), "--n-open-distance"),
  M("closeEffect", "Close animation", "presence", sel(...CLOSE_EFFECTS), "--n-close", {
    description: "mirror = the open animation played backwards.",
    emit: (v) => [{ prop: "--n-close-anim", value: v === "none" ? "none" : `n-close-${v}` }],
  }),
  M("closeSpeed", "Close speed", "presence", num(0.5, 4, 0.1, "×"), "--n-close-speed", {
    description: "How much faster closing is than opening. 2× = closes in half the time.",
  }),
  M("closeEasing", "Close easing", "presence", easing, "--n-close-easing", { tokens: ["easing"] }),
];

/* ---------------- motion: loops (autonomous, seamless) ---------------- */
const LOOP: PropertyDef[] = [
  M("loopDuration", "Loop length", "loop", { type: "time", min: 500, max: 120000, step: 250 }, "--n-loop-duration", {
    inherits: true,
    description: "Time for one full cycle at 1× speed.",
    keywords: ["cycle", "period"],
  }),
  M("loopSpeed", "Loop speed", "loop", num(0.1, 4, 0.05, "×"), "--n-loop-speed", { inherits: true }),
  M("loopDirection", "Loop direction", "loop", sel("normal", "reverse"), "--n-loop-direction", { inherits: true }),
  M("loopIntensity", "Loop intensity", "loop", num(0, 3, 0.05), "--n-loop-intensity", { inherits: true, description: "How far / how strongly the loop moves." }),
  S("loopPauseOnHover", "Pause on hover", "loop", sel("no", "yes"), undefined, {
    kind: "motion",
    pseudo: ":hover",
    emit: (v) => (v === "yes" ? [{ prop: "--n-loop-state", value: "paused" }] : []),
  }),
  M("loopPlay", "Play", "loop", sel("in-view", "always"), "--n-loop-play", {
    description: "in-view pauses the loop while it is off screen (saves battery).",
  }),
];

/* ---------------- motion: interaction fx ---------------- */
const FX: PropertyDef[] = [
  M("fxMagnetic", "Magnetic pull", "fx", num(0, 1, 0.01), "--n-fx-magnetic", { keywords: ["attract"] }),
  M("fxMagneticRadius", "Magnetic radius", "fx", len([], 0, 200, 1, ["px"]), "--n-fx-magnetic-radius"),
  M("fxTilt", "Tilt", "fx", num(0, 30, 0.5, "deg"), "--n-fx-tilt", { keywords: ["3d", "parallax"] }),
  M("fxTiltGlare", "Tilt glare", "fx", num(0, 1, 0.01), "--n-fx-glare"),
  M("fxRipple", "Ripple", "fx", sel("off", "on"), "--n-fx-ripple"),
  M("fxRippleColor", "Ripple color", "fx", color, "--n-fx-ripple-color", { tokens: ["color"] }),
  M("fxSpotlight", "Spotlight", "fx", sel("off", "on"), "--n-fx-spotlight", { keywords: ["glow follow"] }),
  M("fxSpotlightColor", "Spotlight color", "fx", color, "--n-fx-spot-color", { tokens: ["color"] }),
  M("fxSpotlightSize", "Spotlight size", "fx", len([], 40, 800, 10, ["px"]), "--n-fx-spot-size"),
  M("fxCursor", "Cursor follower", "fx", sel("none", "dot", "ring", "blend", "label"), "--n-fx-cursor"),
  M("fxCursorLabel", "Cursor label", "fx", text('"View"'), "--n-fx-cursor-label"),
  M("fxParallax", "Pointer parallax", "fx", num(-60, 60, 1, "px"), "--n-fx-parallax"),
  M("fxPressScale", "Press scale", "fx", num(0.8, 1.1, 0.005), "--n-fx-press"),
];

/* ---------------- motion: scroll ---------------- */
const SCROLL: PropertyDef[] = [
  M("scrollEffect", "Scroll effect", "scroll", sel("none", "parallax", "fade", "reveal", "scale", "rotate", "blur", "progress", "velocity-skew"), "--n-scroll"),
  M("scrollIntensity", "Intensity", "scroll", num(-2, 2, 0.05), "--n-scroll-intensity"),
  S("sticky", "Pin (sticky)", "scroll", sel("off", "top", "bottom"), undefined, {
    emit: (v) =>
      v === "off"
        ? [{ prop: "position", value: "static" }]
        : [
            { prop: "position", value: "sticky" },
            { prop: v, value: "var(--n-sticky-offset, 0px)" },
          ],
  }),
  S("stickyOffset", "Pin offset", "scroll", len(SP, 0, 200), undefined, { cssVar: "--n-sticky-offset" }),
];

/* ---------------- motion: ambient ---------------- */
export const AMBIENT_EFFECTS = ["none", "float", "pulse", "breathe", "shimmer", "gradient-shift", "spin", "wiggle", "bounce", "blink", "glow"] as const;

const AMBIENT: PropertyDef[] = [
  S("ambientEffect", "Ambient", "ambient", sel(...AMBIENT_EFFECTS), undefined, {
    kind: "motion",
    emit: (v) => [{ prop: "animation-name", value: v === "none" ? "none" : `n-amb-${v}` }],
    keywords: ["loop", "idle", "autonomous"],
  }),
  S("ambientDuration", "Cycle", "ambient", time, "animation-duration", { kind: "motion", tokens: ["duration"] }),
  S("ambientDelay", "Start delay", "ambient", time, "animation-delay", { kind: "motion" }),
  S("ambientIterations", "Repeats", "ambient", sel("infinite", "1", "2", "3", "5"), "animation-iteration-count", { kind: "motion" }),
  S("ambientDirection", "Direction", "ambient", sel("normal", "alternate", "reverse", "alternate-reverse"), "animation-direction", {
    kind: "motion",
    description: "alternate = ping-pong",
  }),
  S("ambientEasing", "Easing", "ambient", easing, "animation-timing-function", { kind: "motion", tokens: ["easing"] }),
  S("ambientAmplitude", "Amplitude", "ambient", num(0, 3, 0.05), undefined, { kind: "motion", cssVar: "--n-amb-amp" }),
  S("ambientPauseOnHover", "Pause on hover", "ambient", sel("no", "yes"), undefined, {
    kind: "motion",
    pseudo: ":hover",
    emit: (v) => (v === "yes" ? [{ prop: "animation-play-state", value: "paused" }] : []),
  }),
];

/* ---------------- component behaviours ---------------- */
const B = (id: string, label: string, control: Control, appliesTo: string[], o: Opts = {}): PropertyDef => ({
  id,
  label,
  group: "behavior",
  kind: "behavior",
  control,
  cssVar: `--n-b-${id}`,
  appliesTo,
  animatable: false,
  ...o,
});

const BEHAVIOR: PropertyDef[] = [
  B("marqueeSpeed", "Marquee speed (px/s)", num(5, 400, 1), ["marquee"]),
  B("marqueeDirection", "Marquee direction", sel("left", "right"), ["marquee"]),
  B("marqueePause", "Marquee pause on hover", sel("yes", "no"), ["marquee"]),
  B("carouselAutoplay", "Carousel autoplay", sel("on", "off"), ["carousel"]),
  B("carouselInterval", "Carousel interval", time, ["carousel"]),
  B("carouselTransition", "Carousel transition", sel("slide", "fade", "scale", "stack"), ["carousel"]),
  B("carouselLoop", "Carousel loop", sel("on", "off"), ["carousel"]),
  B("carouselPause", "Carousel pause on hover", sel("yes", "no"), ["carousel"]),
  B("typewriterSpeed", "Typewriter speed (ms/char)", num(5, 300, 1), ["text", "heading"]),
  B("typewriterLoop", "Typewriter loop", sel("no", "yes"), ["text", "heading"]),
  B("typewriter", "Typewriter", sel("off", "on"), ["text", "heading"]),
  B("countUp", "Count up", sel("off", "on"), ["stat"]),
  B("countUpDuration", "Count-up duration", time, ["stat"]),
  B("tooltipDelay", "Tooltip delay", time, ["tooltip"]),
  B("toastDuration", "Toast duration", time, ["toast"]),
  B("chartCurve", "Chart curve", sel("linear", "smooth", "step"), ["chart"]),
];

export const PROPERTIES: PropertyDef[] = [
  ...LAYOUT,
  ...SPACING,
  ...TEXT,
  ...BG,
  ...BORDER,
  ...RADIUS,
  ...SHADOW,
  ...EFFECTS,
  ...TRANSFORM,
  ...INTERACTION,
  ...ICON,
  ...SVG,
  ...CONTENT,
  ...TRANSITION,
  ...ENTER,
  ...PRESENCE,
  ...LOOP,
  ...FX,
  ...SCROLL,
  ...AMBIENT,
  ...BEHAVIOR,
];

