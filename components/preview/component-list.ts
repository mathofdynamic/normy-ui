import type { Category } from "@/engine/types";

/* Shared by the Studio and the component views (kept free of component code). */

export const COMPONENTS_PATH = "/preview/components";

export const CATS: Array<{ id: Category; label: string }> = [
  { id: "layout", label: "Layout" },
  { id: "typography", label: "Typography" },
  { id: "actions", label: "Actions" },
  { id: "forms", label: "Forms" },
  { id: "navigation", label: "Navigation" },
  { id: "data", label: "Data display" },
  { id: "overlay", label: "Overlays" },
  { id: "feedback", label: "Feedback" },
  { id: "media", label: "Media & motion" },
  { id: "blocks", label: "Blocks" },
];
