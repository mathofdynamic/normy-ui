"use client";

import { useId, type CSSProperties, type ReactNode } from "react";
import { nPart, nRoot, type NProps } from "@/engine/react";
import { WAVE_SHAPES } from "./wave-shapes";
import { loopRoot } from "./use-loop";
import { Icon, type IconName } from "./icon";

/* Loop components, batch D. See engine/components/loops.ts for the contract. */

const at = (i: number): CSSProperties => ({ "--i": i }) as CSSProperties;

/* ---------------- equalizer ---------------- */

export function Equalizer({ variant, size, nid, bars = 5, label }: NProps & { bars?: number; label?: string }) {
  const n = Math.max(1, Math.round(bars));
  return (
    <span
      {...nRoot("equalizer", { variant, size, nid }, { variant: "bars", size: "md" })}
      {...loopRoot}
      suppressHydrationWarning
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
    >
      {Array.from({ length: n }, (_, i) => (
        // irregular but fixed offsets (golden-ratio steps) so neighbouring bars never move together
        <span key={i} {...nPart("equalizer", "bar")} style={at(Number((((i * 0.618) % 1) + (i % 2) * 0.13).toFixed(3)) % 1)} />
      ))}
    </span>
  );
}

/* ---------------- loader ---------------- */

export function Loader({ variant, size, nid, label = "Loading" }: NProps & { label?: string }) {
  const v = variant ?? "dots";
  let body: ReactNode;
  if (v === "bars") {
    body = [0, 1, 2, 3].map((i) => <span key={i} {...nPart("loader", "bar")} style={at(i)} />);
  } else if (v === "ring") {
    body = (
      <svg {...nPart("loader", "ring")} viewBox="0 0 24 24" aria-hidden="true">
        <circle {...nPart("loader", "track")} cx="12" cy="12" r="9.5" />
        <circle {...nPart("loader", "arc")} cx="12" cy="12" r="9.5" pathLength={100} />
      </svg>
    );
  } else if (v === "pulse") {
    body = (
      <>
        <span {...nPart("loader", "halo")} aria-hidden="true" />
        <span {...nPart("loader", "dot")} aria-hidden="true" />
      </>
    );
  } else if (v === "orbit") {
    body = (
      <span {...nPart("loader", "orbit")} aria-hidden="true">
        <span {...nPart("loader", "dot")} style={{ ...at(0), top: 0 }} />
        <span {...nPart("loader", "dot")} style={{ ...at(1), bottom: 0 }} />
      </span>
    );
  } else {
    body = [0, 1, 2].map((i) => <span key={i} {...nPart("loader", "dot")} style={at(i)} />);
  }
  return (
    <span {...nRoot("loader", { variant, size, nid }, { variant: "dots", size: "md" })} {...loopRoot} suppressHydrationWarning role="status">
      {body}
      <span {...nPart("loader", "label")}>{label}</span>
    </span>
  );
}

/* ---------------- waveLine ---------------- */

const pathOf = (shape: "line" | "pulse", area: boolean) => {
  const { samples, y } = WAVE_SHAPES[shape];
  const pts: string[] = [];
  for (let k = 0; k <= samples * 2; k++) {
    const x = (k / samples) * 200;
    pts.push(`${Number(x.toFixed(3))} ${Number((y((k % samples) / samples) * 100).toFixed(3))}`);
  }
  const line = "M" + pts.join("L");
  return area ? `${line}L400 100L0 100Z` : line;
};

export function WaveLine({ variant, size, nid, dot = true, label }: NProps & { dot?: boolean; label?: string }) {
  const gid = useId();
  const v = variant ?? "line";
  const shape = v === "pulse" ? "pulse" : "line";
  const area = v === "area";
  return (
    <div
      {...nRoot("waveLine", { variant, size, nid }, { variant: "line", size: "md" })}
      {...loopRoot}
      suppressHydrationWarning
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
    >
      <div {...nPart("waveLine", "viewport")}>
        <svg {...nPart("waveLine", "track")} viewBox="0 0 400 100" preserveAspectRatio="none" style={{ maxWidth: "none" }}>
          {area && (
            <>
              <defs>
                <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" style={{ stopColor: "var(--n-color-accent)", stopOpacity: 0.32 }} />
                  <stop offset="1" style={{ stopColor: "var(--n-color-accent)", stopOpacity: 0 }} />
                </linearGradient>
              </defs>
              <path {...nPart("waveLine", "fill")} d={pathOf(shape, true)} fill={`url(#${gid})`} />
            </>
          )}
          <path {...nPart("waveLine", "line")} d={pathOf(shape, false)} />
        </svg>
      </div>
      {dot && <span {...nPart("waveLine", "dot")} />}
    </div>
  );
}

/* ---------------- rotatingBadge ---------------- */

const R_RING = 37;
const CIRC = 2 * Math.PI * R_RING;

export function RotatingBadge({
  variant,
  size,
  nid,
  text = "New • Limited • New • Limited • ",
  icon = "arrow-up-right",
  href,
  label,
  children,
}: NProps & { text?: string; icon?: IconName; href?: string; label?: string; children?: ReactNode }) {
  const id = useId();
  const pathId = `${id}-ring`;
  const props = { ...nRoot("rotatingBadge", { variant, size, nid }, { variant: "default", size: "md" }), ...loopRoot, suppressHydrationWarning: true };
  const inner = (
    <>
      <svg {...nPart("rotatingBadge", "ring")} viewBox="0 0 100 100" aria-hidden="true">
        <defs>
          <path id={pathId} d={`M50 50m-${R_RING} 0a${R_RING} ${R_RING} 0 1 1 ${R_RING * 2} 0a${R_RING} ${R_RING} 0 1 1 -${R_RING * 2} 0`} />
        </defs>
        <text {...nPart("rotatingBadge", "text")} dominantBaseline="central">
          <textPath href={`#${pathId}`} textLength={CIRC - 0.6} lengthAdjust="spacing">
            {text}
          </textPath>
        </text>
      </svg>
      <span {...nPart("rotatingBadge", "center")} aria-hidden="true">
        {children ?? <Icon name={icon} style={{ width: "100%", height: "100%" }} />}
      </span>
    </>
  );
  if (href) {
    return (
      <a {...props} href={href} aria-label={label ?? text.replace(/[•·]/g, "").replace(/\s+/g, " ").trim()}>
        {inner}
      </a>
    );
  }
  return (
    <div {...props} {...(label ? { role: "img", "aria-label": label } : {})}>
      {inner}
    </div>
  );
}
