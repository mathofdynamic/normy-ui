"use client";

import type { DesignSystem, StateName } from "../types";
import type { ModePref } from "./apply";

/* Messages between the Studio, its canvas iframes and other tabs. */

export type ToCanvas =
  | { type: "system"; system: DesignSystem; extra?: import("../types").Rule[] }
  | { type: "mode"; mode: ModePref }
  | { type: "inspect"; on: boolean }
  | { type: "force"; states: StateName[]; target: { component?: string; instance?: string } | null }
  | { type: "highlight"; target: { component?: string; instance?: string; part?: string; variant?: string; label?: string; scroll?: boolean } | null }
  | { type: "replay" }
  | { type: "scan" };

export interface PickedTarget {
  component: string;
  variant?: string;
  size?: string;
  part?: string;
  instance?: string;
  label: string;
}

export type FromCanvas =
  | { type: "ready"; path: string }
  | { type: "picked"; target: PickedTarget }
  | { type: "instances"; path: string; list: Array<{ id: string; component: string; variant?: string }>; components: Record<string, string[]> }
  | { type: "navigate"; path: string };

export const CHANNEL = "normy-engine";

let bc: BroadcastChannel | null = null;
export function broadcast(): BroadcastChannel | null {
  if (typeof BroadcastChannel === "undefined") return null;
  bc ??= new BroadcastChannel(CHANNEL);
  return bc;
}
