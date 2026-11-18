import type { ComponentDef } from "../types";
import { DISPLAY } from "./display";
import { FORMS } from "./forms";
import { FOUNDATION } from "./foundation";
import { NAVIGATION } from "./navigation";

/** Every component definition the engine knows. Order = catalogue order. */
export const COMPONENTS: ComponentDef[] = [...FOUNDATION, ...FORMS, ...NAVIGATION, ...DISPLAY];

const BY_TYPE = new Map(COMPONENTS.map((c) => [c.type, c]));
export const getComponent = (type: string) => BY_TYPE.get(type);

export const partLabel = (def: ComponentDef, part: string) => {
  const p = def.parts[part];
  return typeof p === "string" ? p : (p?.label ?? part);
};
