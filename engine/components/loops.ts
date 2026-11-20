import type { ComponentDef } from "../types";
import { LOOPS_A } from "./loops-a";
import { LOOPS_B } from "./loops-b";
import { LOOPS_C } from "./loops-c";
import { LOOPS_D } from "./loops-d";

/* ------------------------------------------------------------------ *
 * Loop components: things that move on their own, forever, seamlessly.
 *
 * Contract (every loop component follows it):
 *  - category "loops"; root carries data-n-loop (see loopRoot in components/normy/use-loop.ts)
 *    so the runtime pauses it while off screen.
 *  - CSS loops animate with loopAnim() (engine/components/kit.ts): duration, speed, direction,
 *    pause-on-hover and the master motion speed all come from the cascade (registry group "loop").
 *  - Seamless: the last frame equals the first. Repeating tracks duplicate their content exactly
 *    twice and move by -50%; spacing between repeated items is padding, never gap (a gap breaks the
 *    period by half a gap and the loop visibly jumps).
 *  - Reduced motion: the engine policy stops CSS animations; JS loops check prefersReducedMotion().
 *  - Keyframes live on the component def (keyframes field), named n-loop-<type>-*.
 *
 * Lessons from building the first 16:
 *  - Recipes drop raw one-word CSS keys that are not registry properties (contain, transform):
 *    use registry ids (containerType, rotate) or kebab-case keys ("grid-area").
 *  - A clipped full-width track can widen its grid column: give the clip box containerType: "inline-size".
 *  - SVG: translate percentages refer to the viewBox unless transform-box: border-box is set;
 *    app CSS caps svg at max-width: 100%, so wide SVG tracks need max-width: none inline.
 *  - Custom properties cannot hold {token} refs; use var(--n-…) inside them.
 *  - Verify seams by pausing animations at currentTime 0 and duration - 1ms and comparing pixels.
 * ------------------------------------------------------------------ */
export const LOOPS: ComponentDef[] = [...LOOPS_A, ...LOOPS_B, ...LOOPS_C, ...LOOPS_D];
