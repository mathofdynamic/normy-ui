# Decisions and assumptions

These are decisions made autonomously while building. Each one is a candidate for push-back.

## Engine
1. **Compile to CSS, never to inline styles.** Rules become one stylesheet (`<style id="normy-engine">`).
   Inline styles would beat the cascade and cost React renders. An edit recompiles in about 6 ms and
   swaps one text node.
2. **`:where()` everywhere, with order as the cascade.** Every rule selector has zero specificity, so
   priority is purely the emission order derived from the cascade score
   (component 1 · variant/size 2 · part 4 · instance 8 · state 16 · breakpoint 32 · mode 64).
   The requested order Global → Component → Variant/size → Part → Instance → State → Breakpoint → Mode
   is therefore exact, not an approximation of CSS specificity.
3. **Recipes are data.** Each component's default look is a list of rules (`engine/components/*.ts`)
   using the same property ids as user rules. A system can override anything, including structure
   (`display`, grid templates, `order`). The starter systems use this to change hero layouts.
4. **Saved systems do not contain recipes.** A system holds tokens and user rules; recipes come from
   the library version. Systems stay small and library fixes reach old systems. Exported CSS is
   always fully compiled.
5. **Composite CSS properties use registered, non-inheriting custom properties**
   (`@property … inherits:false`): the filter functions, backdrop, translate, skew, and the background
   layers (grain, pattern, image, gradient). Rules at different scopes can set `blur` and
   `brightness` independently without clobbering each other or leaking into children.
6. **Springs compile to CSS `linear()`.** The spring is simulated and sampled into a `linear()`
   timing function, which runs over whatever duration is set. That makes a spring usable as a
   transition, an ambient loop or an entrance, at the cost of not being duration-free.
7. **Motion config travels as CSS variables.** A small runtime (`engine/runtime/motion.ts`) reads
   `--n-enter-*`, `--n-fx-*`, `--n-scroll-*` and `--n-b-*`, so motion obeys the same cascade
   (breakpoint and mode included) as colour.
8. **Global scope = tokens + inherited text properties.** Global style properties compile onto
   `html` (font, colour, letter-spacing… and backgrounds, which is how Glass gets its aurora).
9. **Explicit semantic roles, not generated tonal ramps.** Every role has a light and a dark value.
   Ramps hide the decisions that make systems distinctive.
10. **State is expressed through data attributes** on roots or *stateful parts* (tab triggers,
    calendar days, options…). For stateful parts, hover/focus/active bind to the part itself, and
    ambient states (selected, disabled, dragging…) may come from the root or the part. `data-n-force`
    freezes any state for the Studio and the Atlas.
11. **Layout primitives take token steps** (`<Stack gap={4}>`). They travel as inline,
    non-inheriting `--n-l-*` variables that recipes consume, so rules can still override gap,
    columns and so on.
12. **Overlays render a `display: contents` root** inside their portal, with the scrim and panel as
    parts, so rules on the root never style the scrim.
13. **A kebab-case escape hatch:** unknown property keys containing `-` are emitted as raw CSS (e.g.
    `animation-name`, `mask`). It's used sparingly in recipes, is visible in the Analyzer as
    "unknown property" only for camelCase typos, and is a deliberate valve for the long tail.

## Studio
14. **Canvases are iframes.** That is the only way breakpoint overrides (real media queries) render
    truthfully inside a desktop editor, and it isolates the Studio chrome (which runs its own fixed
    "Normy Studio" system) from the system being edited.
15. **Instances need a `nid` prop** (`nid`, not `id`, so DOM ids stay free for accessibility).
    Clicking an element without one selects its component type. The "↑ root" button jumps from a
    picked part to the component root.
16. **Autosave is to localStorage, explicit Save is to disk** (`design-systems/<id>/system.json` plus
    `versions/<timestamp>.json`). The active system is broadcast to every open tab
    (BroadcastChannel), and a boot script paints the cached CSS before hydration.
17. **Before/after compare shows the last saved/loaded version** next to the current draft.
18. **Transient Studio motion controls** (speed, disable-all) affect only the canvas and are never
    saved. The same knobs exist as tokens (`motion.speed`, `motion.enabled`, `motion.reduce`) for
    permanent changes.
19. **Variants and sizes can be invented in the Studio.** They're stored per system in
    `components[type].variants|sizes`, and any component accepts any string as `variant`.

## Library / site
20. **Tailwind was removed.** The showcase, preview pages and Studio are built from Normy components
    plus a token-only Studio stylesheet. Tailwind remains an *export* target.
21. **Fonts** are a fixed bundled set (next/font, `preload: false` except the defaults) so starter
    systems can be typographically distinct without network calls at runtime. The Material-like
    system uses Roboto; that is a choice inside a preset, not the brand.
22. **Charts are hand-written SVG** (line, area, bar, donut, sparkline). Every mark is a part, and the
    curve type is a behaviour property.
23. **Generated art stands in for photography** (`<Media seed>`): radial compositions of the chart
    colour tokens, so imagery re-skins with the system.
24. **`corner-shape` (squircle etc.)** is progressive enhancement. Browsers without it render normal
    rounded corners.
25. **Scroll effects use a JS runtime** (rAF + rect maths) instead of CSS scroll timelines, for
    cross-browser support.
26. **Text-mutating behaviours (typewriter, count-up) start after hydration settles** (load + 700 ms)
    so streamed hydration never sees modified text. Entrance animations use WAAPI only and start
    immediately.
27. **The install command (`pnpm add @normy/ui`) is still a placeholder.** Nothing is published.
28. **Inline styles still appear in a few preview pages** for one-off structural layout (widths
    of filter controls, the auth split). They use tokens only. A follow-up could add
    `width`/`pad` props to the layout primitives and remove the rest.

## Usability overhaul (2026-11-19, after first review)

The first review said the Studio was "built for engineers": every option was visible at once, the
interface was tiny, and nothing could be resized. These decisions answer that review.

29. **The default look is black, white and one blue (OKLCH hue 264).** Registry colour defaults are
    neutral with a faint cool cast. The brown/vermilion palette is gone from the default, the Studio
    chrome and the Hub. Geist / Geist Mono replace Archivo / Plex as default families (both stay
    available). Heading width defaults to 100%.
30. **Progressive disclosure: Style → Edit → Advanced.** The Studio opens on the *Style* panel,
    which has about 10 visual choices (starter, brand colour, neutrals, corners, spacing, type,
    depth, lines, motion). Each choice is a named preset that expands to ordinary tokens for light
    and dark (`components/studio/theme-model.ts`). Presets add no new engine concept, so they stay
    undoable, exportable and fine-tunable ("Fine-tune" opens the exact tokens).
31. **Plain-language scopes in the Edit panel.**
    - Scope is chosen with "Every button / Only one style / Just this one" plus Part pills.
    - The State tabs are Default / Hover / Pressed / Focus… and freeze the preview in that state.
    - Breakpoint, mode and size sit behind "Only on…".
    - Each component first shows about 20 *essential* properties (colour, shape, text, spacing,
      depth, motion). "Show all N properties" and the search reach the rest.
    - **Advanced** is the unchanged full cascade inspector, so nothing was removed.
32. **Clicking a small control selects the whole control.** For buttons, inputs and feedback
    components, a pick on a label or icon targets the root, because that is what people mean. Larger
    blocks keep the clicked part. Advanced mode keeps the exact part.
33. **Layout: one icon rail + one resizable panel + a large canvas.**
    - The panel resizes by drag (280–760 px, double-click resets, arrow keys work) and can be
      hidden.
    - Interface size (Small 14 / Medium 16 / Large 18 px root) scales all chrome because chrome is
      in rem.
    - Both settings persist in localStorage (`normy:studio-ui`).
34. **Canvas dock instead of toolbars.** A floating Select / Interact / Replay dock sits on the
    canvas and shows what is being edited in words. Rarely used switches (motion speed, frozen
    states, interface size) live in the ⋯ menu and the command palette.
35. **What an edit touches is shown on the page.** The canvas outlines every element the current
    scope affects (dashed) and labels the first one ("Every button · Hover"). The outlines follow
    scroll.
36. **First run shows a "pick a starting point" dialog** with live thumbnails of every starter.
    It does not show again once dismissed, and "Welcome & tips" reopens it.
37. **The Hub is a product landing page** (hero + product shot, how it works, starters, features,
    pages). Engineering stats moved out of the hero.
