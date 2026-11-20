import type { CSSProperties, ReactNode } from "react";
import { GalleryRows, MarqueeColumns, NewsTicker, WordRotator } from "@/components/normy/loops-a";
import { Avatar, Heading, Icon, type IconName } from "@/components/normy";
import type { Sample } from "./sample-type";

/* Atlas samples for loop batch A. Key = component type. */

const QUOTES: Array<[string, string, string]> = [
  ["It replaced three tools and our pages finally look like one product.", "Maya Lindqvist", "Head of Design, Northfield"],
  ["Shipping a new landing page went from a week to an afternoon.", "Daniel Okafor", "Founder, Paperlane"],
  ["The calm, consistent look is what our customers keep mentioning.", "Sofia Reyes", "Product Lead, Halden"],
  ["Our agents now produce pages that pass design review the first time.", "Jonas Weber", "CTO, Alder & Co"],
  ["Finally a system that stays out of the way and still feels crafted.", "Amara Singh", "Design Engineer, Lumen"],
  ["Dark mode, spacing, type: it just all holds together.", "Tobias Klein", "Creative Director, Fenwick"],
  ["We rebuilt our docs in a day and nobody noticed the seams.", "Elena Petrova", "Eng Manager, Brightwell"],
  ["Small details, like the motion, make it feel expensive.", "Marcus Chen", "Founder, Tidewater"],
];

const quote = (i: number): ReactNode => {
  const [q, n, r] = QUOTES[i % QUOTES.length];
  return (
    <figure style={{ margin: 0, display: "flex", flexDirection: "column", gap: "var(--n-space-3)" }}>
      <blockquote style={{ margin: 0 }}>{q}</blockquote>
      <figcaption style={{ display: "flex", alignItems: "center", gap: "var(--n-space-2-5)" }}>
        <Avatar name={n} size="sm" />
        <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.25 }}>
          <strong style={{ fontWeight: 600 }}>{n}</strong>
          <span style={{ color: "var(--n-color-text-subtle)", fontSize: "var(--n-text-xs)" }}>{r}</span>
        </span>
      </figcaption>
    </figure>
  );
};

const col = (offset: number) => Array.from({ length: 4 }, (_, i) => quote(offset + i));

const ICONS: IconName[] = ["sparkle", "zap", "users", "chart-line", "bell", "heart", "settings", "star"];
const tint = (i: number): CSSProperties => ({
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "var(--n-space-2)",
  background: `color-mix(in oklab, var(--n-color-accent) ${4 + ((i * 5) % 14)}%, var(--n-color-surface-raised))`,
  fontSize: "var(--n-text-sm)",
  color: "var(--n-color-text-muted)",
});
const LABELS = ["Pulse", "Flow", "Atlas", "Signal", "Orbit", "Canvas", "Studio", "Relay"];
const tiles = (offset: number) =>
  Array.from({ length: 7 }, (_, i) => {
    const k = offset + i;
    return (
      <div key={k} style={tint(k)}>
        <Icon name={ICONS[k % ICONS.length]} style={{ width: "1.5rem", height: "1.5rem", color: "var(--n-color-accent-text)" }} />
        <span>{LABELS[k % LABELS.length]}</span>
      </div>
    );
  });

const NEWS = [
  "Normy 2.0 ships with loop components",
  "Agent Kit now checks every page for drift",
  "New: dark mode contrast audit",
  "Studio adds per-variant motion controls",
  "Components atlas passes 120 entries",
];

export const LOOP_SAMPLES_A: Record<string, Sample> = {
  marqueeColumns: (v, s) => (
    <MarqueeColumns variant={v} size={s} columns={[col(0), col(3), col(5)]} />
  ),
  galleryRows: (v, s) => <GalleryRows variant={v} size={s} rows={[tiles(0), tiles(3), tiles(5)]} />,
  wordRotator: (v) => (
    <Heading variant="h3" style={{ margin: 0 }}>
      Build for <WordRotator variant={v} words={["teams", "founders", "agencies", "everyone"]} />
    </Heading>
  ),
  newsTicker: (v, s) => (
    <div style={{ width: "100%", maxWidth: "48rem" }}>
      <NewsTicker variant={v} size={s} items={NEWS} />
    </div>
  ),
};
/** Types whose sample needs the wide stage. */
export const LOOP_WIDE_A: string[] = ["marqueeColumns", "galleryRows", "newsTicker"];
