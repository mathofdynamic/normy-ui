import type { DesignSystem } from "../types";
import { normy } from "./normy";
import { brutalist, editorial, glassSystem, luxury, material, neumorphic, playful, terminal } from "./starters";

export const STARTERS: DesignSystem[] = [normy, brutalist, glassSystem, editorial, neumorphic, material, terminal, playful, luxury];
export const DEFAULT_SYSTEM = normy;
export const getStarter = (id: string) => STARTERS.find((s) => s.meta.id === id);
