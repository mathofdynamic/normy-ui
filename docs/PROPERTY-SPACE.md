# The UI/UX property space

The goal of this document is to enumerate, as completely as we can, every property a user
interface can have, so the Normy engine knows what it covers and what it doesn't. The engine's
property registry (`engine/registry/`) implements the parts marked ✅. Parts marked ◐ are covered
in part, and ○ means not yet covered, with a reason.

Revision log: R1 (milestone a, initial enumeration) · R2 (after b: component parts) · R3 (after c:
motion) · R4 (after f/g: the proof run). See the end of this file.

---

## 0. The axes of variation (the meta-model)

Every visual decision is a point in this space:

| Axis | Values | Engine mechanism |
|---|---|---|
| **What** | the property (≈280 of them, below) | property registry |
| **Where** | global → component type → variant/size → part → instance | rule scope |
| **When (state)** | rest, hover, focus, focus-visible, active/pressed, disabled, loading, selected/checked, error/invalid, open/expanded, dragging, empty, read-only, visited, current | rule scope `state` + `data-n-force` |
| **Viewport** | breakpoints (sm, md, lg, xl, 2xl), container width, orientation, pointer coarse/fine, hover capability | rule scope `bp`; container queries are ○ |
| **Preference** | color scheme light/dark, reduced motion, contrast (more/less), reduced transparency, forced colors, data saver | `mode` scope; the reduced-motion policy token; others ◐ |
| **Time** | entrance, interaction, ambient, scroll-linked, route transition | motion registry, three layers |
| **Content** | variants and sizes named by the user, density, locale/direction | system `components[type].variants` |

A rule is one point on Where × When × Viewport × Preference, plus a bag of What → value.

---

## 1. Foundations (tokens, edited at Global scope)

### 1.1 Color
- ✅ Palette: named base colors (neutral, accent, success, warning, danger, info) in any CSS color syntax.
- ✅ Semantic roles, each with a light/dark pair:
  - canvas: `bg`
  - surfaces: `surface`, `surface-raised`, `surface-sunken`, `surface-inverse`, `overlay`
  - text: `text`, `text-muted`, `text-subtle`, `text-inverse`, `text-on-accent`
  - borders: `border`, `border-strong`, `border-subtle`
  - accent: `accent`, `accent-hover`, `accent-soft`, `accent-text`
  - status ×4 (success/warning/danger/info): base, `-soft`, `-text`
  - utilities: `focus`, `selection`, `link`, `shadow`, `chart-1…6`
- ✅ Contrast checking: WCAG 2 ratio plus APCA Lc for defined text/surface pairs (Analyzer, Studio).
- ✅ Opacity tokens: disabled, muted, overlay.
- ◐ Gamut: OKLCH/P3 values are accepted and the browser handles gamut mapping. There is no gamut warning yet.
- ○ Auto-generated tonal ramps (50…950). Roles are explicit values, not generated scales. The decision is explained in DECISIONS.md.

### 1.2 Typography
- ✅ Families: display, body, mono (choice from the loaded font set, or any CSS font stack).
- ✅ Size scale: `xs`, `sm`, `base`, `lg`, `xl`, `2xl`, `3xl`, `4xl`, `5xl`, `display` (each editable; fluid `clamp()` allowed).
- ✅ Weights: regular, medium, semibold, bold, heading.
- ✅ Line heights: tight, snug, normal, relaxed.
- ✅ Tracking: tighter, tight, normal, wide, caps.
- ✅ Heading case (none/uppercase/small-caps) and heading family.
- ◐ Variable axes: weight and width via `font-stretch` work on every element. Arbitrary axes are set with `fontVariationSettings`.
- ○ Font upload: fonts are limited to the bundled set (next/font). A custom family can still be typed in as a stack.

### 1.3 Space and size
- ✅ Base unit, density multiplier, scale steps 0–24 (computed `unit × n × density`).
- ✅ Control heights: xs, sm, md, lg. Container widths: sm, md, lg, xl.
- ✅ Section padding (block), page gutter.

### 1.4 Shape
- ✅ Radius scale: none, xs, sm, md, lg, xl, 2xl, full + semantic: control, card, overlay, badge.
- ✅ Corner shape: round, squircle, bevel, scoop, notch (`corner-shape`, progressive enhancement).
- ✅ Border width scale: hairline, thin, thick, heavy.

### 1.5 Elevation
- ✅ Shadow presets 0–5 (multi-layer), shadow color, plus `inner`, `glow`, `hard` (offset, no blur).
- ✅ Z-index layers: base, raised, dropdown, sticky, overlay, modal, toast, tooltip.
- ✅ Blur scale (sm/md/lg/xl), used for glass effects.

### 1.6 Motion foundations
- ✅ Durations: instant, fast, base, slow, slower.
- ✅ Easings: standard, enter, exit, emphasized, linear, plus spring presets.
- ✅ Master speed multiplier, global disable, reduced-motion policy (system / always reduce / ignore).
- ✅ Page transition: effect, duration, easing.

### 1.7 Breakpoints
- ✅ sm, md, lg, xl, 2xl in px (editable; they drive media queries in the compiled CSS).

### 1.8 Focus and accessibility
- ✅ Focus ring: width, offset, style, color, plus a "halo" spread.
- ✅ Minimum target size.
- ✅ Disabled opacity, selection color.

---

## 2. Per-element style properties (component, variant, part, instance, state, breakpoint, mode)

### 2.1 Layout (✅ all)
display · flexDirection · flexWrap · alignItems · alignContent · alignSelf · justifyContent ·
justifyItems · justifySelf · placeItems · gap · rowGap · columnGap · gridTemplateColumns ·
gridTemplateRows · gridAutoFlow · gridAutoRows · gridColumn · gridRow · columns · columnRule ·
flex · flexGrow · flexShrink · flexBasis · order · aspectRatio · overflow · overflowX · overflowY ·
position · inset · top · right · bottom · left · zIndex · isolation · float(○: not useful) ·
visibility · boxSizing · verticalAlign · objectFit · objectPosition · containerType

### 2.2 Spacing and sizing (✅)
padding · paddingX · paddingY · paddingTop/Right/Bottom/Left · margin · marginX · marginY ·
marginTop/Right/Bottom/Left · width · height · minWidth · maxWidth · minHeight · maxHeight ·
size (w+h)

### 2.3 Typography (✅)
fontFamily · fontSize · fontWeight · fontStyle · lineHeight · letterSpacing · textTransform ·
fontVariantCaps · textDecorationLine · textDecorationStyle · textDecorationColor ·
textDecorationThickness · textUnderlineOffset · textAlign · textWrap (balance/pretty) ·
whiteSpace · wordBreak · hyphens · textOverflow · lineClamp · textIndent · fontFeatureSettings ·
fontVariantNumeric · fontVariationSettings · fontStretch · fontOpticalSizing · fontKerning ·
textShadow · color · caretColor · accentColor · placeholderColor · listStyle

### 2.4 Background (✅)
backgroundColor · gradient (linear/radial/conic/mesh with a multi-stop editor) · backgroundImage
(url) · pattern (dots/grid/lines/diagonal/checker/cross with color + size) · grain (procedural
noise, 0–1) · backgroundSize · backgroundPosition · backgroundRepeat · backgroundBlendMode ·
backgroundClip (incl. text, for gradient text) · backgroundAttachment.
The gradient, image, pattern and grain layers are stacked with non-inheriting registered custom
properties, so the four layers cascade independently.

### 2.5 Border and outline (✅)
borderWidth · borderStyle · borderColor · per-side width (top/right/bottom/left) · per-side color
(top/bottom) · outline · outlineWidth · outlineStyle · outlineColor · outlineOffset · focus ring
(width/offset/color/style; compiled into focus-state selectors)

### 2.6 Radius (✅)
radius · radiusTopLeft · radiusTopRight · radiusBottomRight · radiusBottomLeft · cornerShape

### 2.7 Shadow (✅)
shadow (multi-layer editor: x, y, blur, spread, color, inset per layer, or a token preset) ·
dropShadow (filter) · textShadow

### 2.8 Effects (✅)
opacity · blur · brightness · contrast · saturate · hueRotate · grayscale · sepia · invert (each a
separate, independently cascading filter function) · backdropBlur · backdropSaturate ·
backdropBrightness · mixBlendMode · maskImage (presets + raw) · clipPath (presets + raw)

### 2.9 Transform (✅)
translateX · translateY · scale · rotate · skewX · skewY · perspective · transformOrigin ·
transformStyle · backfaceVisibility

### 2.10 Cursor and interaction (✅)
cursor · pointerEvents · userSelect · touchAction · hitArea (invisible extension of the hit box) ·
minTargetSize · scrollBehavior · scrollSnapType · scrollSnapAlign · overscrollBehavior · resize ·
scrollbarWidth · scrollbarColor

### 2.11 Icons (✅)
iconSize · iconStroke · iconLinecap · iconLinejoin · iconFill (outline/solid/duotone) ·
iconPosition (start/end) · iconColor · icon gap

### 2.12 SVG and data-vis (✅)
fill · fillOpacity · stroke · strokeWidth · strokeDasharray · strokeLinecap · strokeLinejoin ·
strokeOpacity

### 2.13 Generated content (✅)
beforeContent · afterContent (string; for terminal-style prefixes, quote marks, decorative glyphs) ·
pseudo color

### 2.14 Transitions (✅)
transitionProperty · transitionDuration · transitionEasing (preset / cubic-bezier / spring, where a
spring compiles to CSS `linear()`) · transitionDelay. Enter and exit timing are kept apart by
the cascade: timing on the base state is the exit, timing on the state rule is the enter.

---

## 3. Motion (three layers)

### 3.1 Entrance (✅)
enterEffect preset (none, fade, rise, fall, slide-left, slide-right, zoom, zoom-out, blur, flip,
swing, clip-up, clip-down, clip-left, clip-right, iris, skew, drop, custom) · enterOpacity ·
enterX · enterY · enterScale · enterRotate · enterBlur · enterSkew · enterClip · enterDuration ·
enterDelay · enterEasing (preset/bezier/spring) · enterStagger · enterStaggerFrom
(first/last/center/random) · enterTrigger (load/inview/none) · enterThreshold · enterMargin ·
enterOnce. Orchestration: siblings entering in the same frame form a batch and are staggered
together. Sections are batch boundaries. A page transition runs on every route change.

### 3.2 Interaction (✅)
- Hover, press, focus and drag are any property on the `hover`/`active`/`focus`/`dragging` state,
  with separate enter and exit timing.
- fxMagnetic (strength, radius) · fxTilt (degrees, perspective, glare) · fxRipple (color,
  duration) · fxSpotlight (color, size) · fxCursor (dot/ring/blend, cursor follow) · fxParallax
  (pointer-move depth).
- Scroll-linked: scrollEffect (parallax, fade, reveal, scale, rotate, blur, progress,
  velocity-skew) · scrollIntensity · sticky/pin (`position: sticky` + top) · scroll progress bar.

### 3.3 Ambient (✅)
ambientEffect (float, pulse, breathe, shimmer, gradient-shift, spin, wiggle, bounce, blink,
glow) · ambientDuration · ambientDelay · ambientAmplitude · ambientIterations ·
ambientDirection (normal/alternate = ping-pong/reverse) · ambientEasing · ambientPauseOnHover.
Component behaviours: marquee (speed, direction, gap, pause on hover) · carousel (autoplay,
interval, transition slide/fade/scale/stack, loop, pause on hover) · typewriter (speed, cursor,
loop) · count-up (duration).

### 3.4 Global motion (✅)
master speed · disable-all · reduced-motion policy.

### 3.5 Motion not covered (○)
- Shared-element/layout morphs across arbitrary elements (Motion `layoutId`). Only used inside
  components (Tabs, SegmentedControl); not rule-driven.
- Physics drag with momentum on arbitrary elements. Only the carousel swipe is supported.
- Lottie or video-driven motion.

---

## 4. Component-level (structural) properties

- ✅ Parts (slots) per component, declared in the component definition.
- ✅ Variants and sizes: open lists per component, extendable by the user in the Studio.
- ✅ States the component exposes (data attributes).
- ✅ Behaviour props read through CSS variables (marquee speed, carousel interval…).
- ◐ Composition (which parts render): parts can be hidden with `display: none`. They can't be
  re-ordered beyond `order`.
- ○ Copy/content tone (microcopy) is content, not design.

---

## 5. UX properties beyond styling (survey, for completeness)

| Property | Status | Notes |
|---|---|---|
| Information density | ✅ | density token |
| Hierarchy (type contrast) | ✅ | type scale ratio |
| Affordance (hover/press feedback) | ✅ | state rules, fx |
| Feedback latency (perceived speed) | ✅ | motion speed |
| Focus order / keyboard paths | ◐ | built into components; not rule-editable (by design) |
| Touch targets | ✅ | minTargetSize, hitArea |
| Reading measure (line length) | ✅ | maxWidth in `ch` |
| Contrast | ✅ | report + roles |
| Motion sensitivity | ✅ | reduce policy |
| Loading strategy (skeleton vs spinner) | ✅ | components + ambient shimmer |
| Empty/error states | ✅ | EmptyState, Alert, preview page |
| Directionality (RTL) | ○ | logical properties are used where possible; no RTL toggle |
| Localization (number/date formats) | ○ | content concern |
| Sound / haptics | ○ | out of scope for the web engine |
| Forced colors / high contrast | ◐ | system colors respected; no dedicated mode |
| Print styles | ○ | not modelled |

---

## Revision log
- **R1 (milestone a)**: initial enumeration, about 280 properties planned across 17 groups.
- **R2 (milestone b, component migration)**: building real components surfaced properties the
  enumeration missed. These were added: `borderLeftColor`/`borderRightColor`, `borderCollapse`,
  `borderSpacing`, `tableLayout`, `captionSide`, `willChange`, `contentVisibility`, the `current`
  state (today, current page, active nav), and *stateful parts* (state on a part rather than the
  root). The SVG group grew to cover chart marks. The kebab-case raw escape hatch was introduced for
  the long tail (`animation-*`, `mask`).
- **R3 (milestone c, motion)**: the spring → `linear()` compilation made springs usable everywhere.
  Separate enter and exit timing falls out of the cascade (timing on the state rule = enter, on
  the base = exit). Page transitions became tokens (`motion.page-*`). Text-mutating behaviours
  need hydration-safe scheduling.
- **R4 (milestones f–h, the proof)**: nine starter systems. To make them *structurally* different,
  layout properties had to be reachable on every part (hero `inner` grid templates, `order`,
  `justifyItems`). Glass needed global (html-level) background rules, and Terminal needed
  generated content (`beforeContent`/`afterContent`) and the typewriter behaviour on hero titles.
  The Analyzer found a real a11y gap in the default system (control borders below 3:1). The fix
  was a token change, and the token now documents the requirement.

### Totals (generated from the registry)
| | count |
|---|---|
| Tokens (foundations) | 148 |
| Style / motion / behaviour properties | 263 |
| **Total registry entries** | **411** |
| Property groups | 27 (8 foundation + 19 style/motion) |
| Components | 65 |
| Cascade levels | 8 |
| States | 10 |

### Still open (○), in rough priority order
1. Container queries as a scope dimension (per-component responsiveness, not viewport).
2. User-uploaded fonts and a variable-axis editor for arbitrary axes.
3. Forced-colors / prefers-contrast as additional mode dimensions.
4. RTL as a scope dimension.
5. Shared-element transitions between routes (View Transitions API).
