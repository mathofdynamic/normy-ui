import type { ReactNode } from "react";

/** One atlas sample: renders the component in a variant (and optional size). */
export type Sample = (v: string, s?: string) => ReactNode;
