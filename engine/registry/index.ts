import type { GroupId, PropertyDef } from "../types";
import { PROPERTIES } from "./properties";
import { TOKENS } from "./tokens";

export { TOKENS, tokenVar, NON_VAR_TOKENS, SPACE_STEPS } from "./tokens";
export { PROPERTIES, ENTER_PRESETS, AMBIENT_EFFECTS } from "./properties";

export interface GroupMeta {
  id: GroupId;
  label: string;
  section: "foundations" | "style" | "motion";
  description: string;
}

/** Display order + labels for every group. Inspector, docs and exports read this. */
export const GROUPS: GroupMeta[] = [
  { id: "color", label: "Color", section: "foundations", description: "Semantic roles with light/dark pairs" },
  { id: "typography", label: "Typography", section: "foundations", description: "Families, scale, weights, rhythm" },
  { id: "space", label: "Space & size", section: "foundations", description: "Unit, density, control sizes, containers" },
  { id: "shape", label: "Shape", section: "foundations", description: "Radius scale, corner shape, border widths" },
  { id: "elevation", label: "Elevation & depth", section: "foundations", description: "Shadows, z-layers, blur, opacity" },
  { id: "motion-tokens", label: "Motion", section: "foundations", description: "Durations, easings, speed, policy" },
  { id: "breakpoints", label: "Breakpoints", section: "foundations", description: "Responsive thresholds" },
  { id: "a11y", label: "Accessibility", section: "foundations", description: "Focus ring and target size" },
  { id: "layout", label: "Layout", section: "style", description: "Display, flex, grid, position" },
  { id: "spacing", label: "Spacing & sizing", section: "style", description: "Padding, margin, dimensions" },
  { id: "text", label: "Typography", section: "style", description: "Font, rhythm, decoration, color" },
  { id: "background", label: "Background", section: "style", description: "Color, gradient, image, pattern, grain" },
  { id: "border", label: "Border & outline", section: "style", description: "Widths, styles, colors, focus ring" },
  { id: "radius", label: "Radius", section: "style", description: "Per-corner radius and corner shape" },
  { id: "shadow", label: "Shadow", section: "style", description: "Layered box and drop shadows" },
  { id: "effects", label: "Effects", section: "style", description: "Opacity, filters, backdrop, blend, mask, clip" },
  { id: "transform", label: "Transform", section: "style", description: "Translate, scale, rotate, skew, 3D" },
  { id: "interaction", label: "Cursor & interaction", section: "style", description: "Cursor, hit area, scroll, selection" },
  { id: "icon", label: "Icons", section: "style", description: "Size, stroke, style, position" },
  { id: "svg", label: "SVG & charts", section: "style", description: "Fill and stroke for marks" },
  { id: "content", label: "Generated content", section: "style", description: "::before / ::after text" },
  { id: "transition", label: "Transitions", section: "motion", description: "State-change timing (enter on state, exit on base)" },
  { id: "enter", label: "Entrance", section: "motion", description: "How elements appear" },
  { id: "fx", label: "Interaction fx", section: "motion", description: "Magnetic, tilt, ripple, spotlight, cursor" },
  { id: "scroll", label: "Scroll", section: "motion", description: "Scroll-linked effects and pinning" },
  { id: "ambient", label: "Ambient", section: "motion", description: "Autonomous loops" },
  { id: "behavior", label: "Component behaviour", section: "motion", description: "Marquee, carousel, typewriter, count-up…" },
];

export const ALL_DEFS: PropertyDef[] = [...TOKENS, ...PROPERTIES];
const BY_ID = new Map(ALL_DEFS.map((d) => [d.id, d]));

export function getDef(id: string): PropertyDef | undefined {
  return BY_ID.get(id);
}

export function defsInGroup(group: GroupId): PropertyDef[] {
  return ALL_DEFS.filter((d) => d.group === group);
}

/** Style/motion properties that may be set on a given component (or any, if omitted). */
export function propsFor(component?: string): PropertyDef[] {
  return PROPERTIES.filter((d) => !d.appliesTo || !component || d.appliesTo.includes(component));
}

export function registryStats() {
  const byGroup = GROUPS.map((g) => ({ ...g, count: ALL_DEFS.filter((d) => d.group === g.id).length }));
  return {
    total: ALL_DEFS.length,
    tokens: TOKENS.length,
    properties: PROPERTIES.length,
    animatable: ALL_DEFS.filter((d) => d.animatable).length,
    byGroup,
  };
}

/** Token ids grouped by prefix: { color: [...], space: [...] } — powers token pickers. */
export function tokensByPrefix(): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const t of TOKENS) {
    const [prefix] = t.id.split(".");
    (out[prefix] ??= []).push(t.id);
  }
  return out;
}
