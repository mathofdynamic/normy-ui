"use client";

import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { nPart, nRoot, type NProps } from "@/engine/react";
import { loopRoot, useLoopFrame } from "./use-loop";

/* Loop components, batch A. See engine/components/loops.ts for the contract. */

const css = (v: Record<string, string | number>) => v as CSSProperties;

/* Slightly different speed / offset per lane so neighbours never move in lockstep. */
const SPEEDS = [1, 1.22, 0.86, 1.1];
const OFFSETS = [0, 0.37, 0.71, 0.18];

/* ---------------- MarqueeColumns ---------------- */

export interface MarqueeColumnsProps extends NProps {
  /** One array of items per column (2–4 columns). Odd columns scroll the other way. */
  columns: ReactNode[][];
  className?: string;
}

export function MarqueeColumns({ variant, size, nid, columns, className }: MarqueeColumnsProps) {
  const cols = columns.slice(0, 4);
  return (
    <div {...nRoot("marqueeColumns", { variant, size, nid }, { variant: "default", size: "md" })} {...loopRoot} suppressHydrationWarning className={className} style={css({ "--n-cols": cols.length })}>
      {cols.map((items, c) => (
        <div key={c} {...nPart("marqueeColumns", "column")}>
          <div
            {...nPart("marqueeColumns", "track")}
            style={css({
              "--n-col-k": SPEEDS[c % 4],
              "--n-col-o": OFFSETS[c % 4],
              animationName: c % 2 ? "n-loop-marqueeColumns-down" : "n-loop-marqueeColumns-up",
            })}
          >
            {[0, 1].map((copy) => (
              <div key={copy} {...nPart("marqueeColumns", "group")} aria-hidden={copy ? true : undefined}>
                {items.map((it, i) => (
                  <div key={i} {...nPart("marqueeColumns", "item")}>
                    <div {...nPart("marqueeColumns", "card")}>{it}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- GalleryRows ---------------- */

export interface GalleryRowsProps extends NProps {
  /** One array of tiles per row (2–3 rows). Odd rows move the other way. */
  rows: ReactNode[][];
  className?: string;
}

export function GalleryRows({ variant, size, nid, rows, className }: GalleryRowsProps) {
  const rs = rows.slice(0, 3);
  return (
    <div {...nRoot("galleryRows", { variant, size, nid }, { variant: "default", size: "md" })} {...loopRoot} suppressHydrationWarning className={className}>
      <div {...nPart("galleryRows", "stage")}>
        {rs.map((tiles, r) => (
          <div key={r} {...nPart("galleryRows", "row")}>
            <div
              {...nPart("galleryRows", "track")}
              style={css({
                "--n-row-k": SPEEDS[r % 4],
                "--n-row-o": OFFSETS[r % 4],
                animationName: r % 2 ? "n-loop-galleryRows-right" : "n-loop-galleryRows-left",
              })}
            >
              {[0, 1].map((copy) => (
                <div key={copy} {...nPart("galleryRows", "group")} aria-hidden={copy ? true : undefined}>
                  {tiles.map((t, i) => (
                    <div key={i} {...nPart("galleryRows", "item")}>
                      <div {...nPart("galleryRows", "tile")}>{t}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- WordRotator ---------------- */

const srOnly: CSSProperties = { position: "absolute", width: 1, height: 1, margin: -1, padding: 0, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap", border: 0 };

export interface WordRotatorProps extends NProps {
  /** Words to cycle through, e.g. ["teams", "founders", "agencies"]. */
  words: string[];
  className?: string;
}

/**
 * The words are stacked in one grid cell, so the box is always as wide as the longest word.
 * The active word index comes from the shared loop clock (cycle length = loop length), so
 * speed, direction, pause and reduced motion behave like every other loop. The wrap from the
 * last word back to the first is the same transition as any other step.
 */
export function WordRotator({ variant, nid, words, className }: WordRotatorProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [state, setState] = useState({ cur: 0, prev: -1 });
  const last = useRef(0);
  const n = words.length;
  useLoopFrame(ref, (p) => {
    if (n < 2) return;
    const idx = Math.min(n - 1, Math.floor(p * n));
    if (idx === last.current) return;
    const prev = last.current;
    last.current = idx;
    setState({ cur: idx, prev });
  }, 12000);
  return (
    <span ref={ref} {...nRoot("wordRotator", { variant, nid }, { variant: "slide" })} {...loopRoot} suppressHydrationWarning aria-live="off" className={className}>
      <span style={srOnly}>{words.join(", ")}</span>
      <span {...nPart("wordRotator", "stack")} aria-hidden="true">
        {words.map((w, i) => (
          <span key={w + i} {...nPart("wordRotator", "word", { current: i === state.cur, selected: i === state.prev })}>
            {w}
          </span>
        ))}
      </span>
    </span>
  );
}

/* ---------------- NewsTicker ---------------- */

export interface NewsTickerProps extends NProps {
  items: ReactNode[];
  /** Badge text, default "Live". */
  label?: ReactNode;
  className?: string;
}

export function NewsTicker({ variant, size, nid, items, label = "Live", className }: NewsTickerProps) {
  return (
    <div {...nRoot("newsTicker", { variant, size, nid }, { variant: "default", size: "md" })} {...loopRoot} suppressHydrationWarning className={className}>
      <span {...nPart("newsTicker", "label")}>
        <span {...nPart("newsTicker", "dot")} aria-hidden="true">
          <span {...nPart("newsTicker", "ping")} />
        </span>
        {label}
      </span>
      <div {...nPart("newsTicker", "viewport")}>
        <div {...nPart("newsTicker", "track")}>
          {[0, 1].map((copy) => (
            <div key={copy} {...nPart("newsTicker", "group")} aria-hidden={copy ? true : undefined}>
              {items.map((it, i) => (
                <span key={i} {...nPart("newsTicker", "item")}>
                  {it}
                  <span {...nPart("newsTicker", "sep")} aria-hidden="true" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
