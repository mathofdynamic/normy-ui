"use client";

import type { CSSProperties, ElementType, ReactNode } from "react";
import { nPart, nRoot, type NProps } from "@/engine/react";
import { loopRoot } from "./use-loop";

/* Loop components, batch C. See engine/components/loops.ts for the contract. */

const vars = (v: Record<string, string | number>) => v as CSSProperties;

/* ---------------- Orbit ---------------- */

export interface OrbitProps extends NProps {
  /** Centre element (icon, logo, avatar). */
  center?: ReactNode;
  /** One array of items per ring (1–3 rings, inner first). */
  rings: ReactNode[][];
  className?: string;
}

/** Ring diameters (% of the stage) by number of rings, inner first. */
const DIAMETERS: Record<number, number[]> = { 1: [78], 2: [60, 100], 3: [52, 76, 100] };

export function Orbit({ variant, size, nid, center, rings, className }: OrbitProps) {
  const shown = rings.slice(0, 3);
  const dia = DIAMETERS[shown.length] ?? [100];
  return (
    <div {...nRoot("orbit", { variant, size, nid }, { variant: "default", size: "md" })} {...loopRoot} suppressHydrationWarning className={className}>
      {shown.map((items, r) => (
        <div
          key={r}
          {...nPart("orbit", "ring")}
          aria-hidden={r > 0 || undefined}
          // Inner rings are faster; direction alternates. Speed factor k scales the cycle length.
          style={vars({ "--d": `${dia[r]}%`, "--n-orbit-k": [1, 1.5, 2.1][r], "--n-orbit-s": r % 2 ? -1 : 1 })}
        >
          {items.map((item, i) => (
            <div key={i} {...nPart("orbit", "slot")} style={vars({ "--a": `${i / items.length}turn` })}>
              <div {...nPart("orbit", "item")}>{item}</div>
            </div>
          ))}
        </div>
      ))}
      {center ? <div {...nPart("orbit", "center")}>{center}</div> : null}
    </div>
  );
}

/* ---------------- PulseRings ---------------- */

export interface PulseRingsProps extends NProps {
  /** Centre element. Omit for a plain accent dot. */
  children?: ReactNode;
  /** Number of rings in flight (default 3). */
  count?: number;
  className?: string;
  label?: string;
}

export function PulseRings({ variant, size, nid, children, count = 3, className, label }: PulseRingsProps) {
  return (
    <div
      {...nRoot("pulseRings", { variant, size, nid }, { variant: "default", size: "md" })}
      {...loopRoot}
      suppressHydrationWarning
      className={className}
      style={vars({ "--n": count })}
      role={label ? "img" : undefined}
      aria-label={label}
    >
      {Array.from({ length: count }, (_, i) => (
        <span key={i} {...nPart("pulseRings", "ring")} aria-hidden style={vars({ "--i": i })} />
      ))}
      <span {...nPart("pulseRings", "sweep")} aria-hidden />
      <span {...nPart("pulseRings", "center")}>{children}</span>
    </div>
  );
}

/* ---------------- BorderBeam ---------------- */

export interface BorderBeamProps extends NProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function BorderBeam({ variant, nid, children, className, style }: BorderBeamProps) {
  return (
    <div {...nRoot("borderBeam", { variant, nid }, { variant: "default" })} {...loopRoot} suppressHydrationWarning className={className} style={style}>
      {children}
      <span {...nPart("borderBeam", "layer")} aria-hidden>
        <span {...nPart("borderBeam", "beam")} />
        <span {...nPart("borderBeam", "beam2")} />
      </span>
    </div>
  );
}

/* ---------------- ShineText ---------------- */

export interface ShineTextProps extends NProps {
  as?: ElementType;
  children?: ReactNode;
  className?: string;
}

export function ShineText({ as: Tag = "span", variant, size, nid, children, className }: ShineTextProps) {
  return (
    <Tag {...nRoot("shineText", { variant, size, nid }, { variant: "sheen", size: "inherit" })} {...loopRoot} suppressHydrationWarning className={className}>
      {children}
    </Tag>
  );
}
