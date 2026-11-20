import { COMPONENTS } from "@/engine/components";

/* Shared by the Studio's Motion panel and the motion canvas pages (kept free of component code). */

export const MOTION_PATH = "/preview/motion-studio";
export const MOTION_TABS = [
  { id: "entrance", label: "Entrance", hint: "How things appear, and in what order" },
  { id: "open-close", label: "Open & close", hint: "Pop-ups, menus, dialogs, drawers, toasts" },
  { id: "interactive", label: "Interactive", hint: "Hover, press, focus, loading" },
  { id: "loops", label: "Loops", hint: "Things that move on their own" },
] as const;
export type MotionTab = (typeof MOTION_TABS)[number]["id"];

/** Elements the Interactive tab tunes (the canvas renders a specimen row for each). */
export const INTERACTIVE_LIST: Array<{ id: string; label: string; component: string; variant?: string }> = [
  { id: "button", label: "Buttons", component: "button" },
  { id: "button-outline", label: "Secondary buttons", component: "button", variant: "outline" },
  { id: "iconButton", label: "Icon buttons", component: "iconButton" },
  { id: "link", label: "Links", component: "link" },
  { id: "card", label: "Clickable cards", component: "card", variant: "interactive" },
  { id: "chip", label: "Chips", component: "chip" },
  { id: "input", label: "Inputs", component: "input" },
  { id: "switch", label: "Switches", component: "switch" },
  { id: "tabs", label: "Tabs", component: "tabs" },
];

/** Every component that loops on its own. */
export const LOOP_TYPES = [...COMPONENTS.filter((c) => c.category === "loops").map((c) => c.type), "marquee", "carousel"];
