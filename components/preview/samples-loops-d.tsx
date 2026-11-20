import type { Sample } from "./sample-type";
import { Equalizer, Loader, RotatingBadge, WaveLine } from "@/components/normy/loops-d";

/* Atlas samples for loop batch D. Key = component type. */
export const LOOP_SAMPLES_D: Record<string, Sample> = {
  equalizer: (v, s) => (
    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
      <Equalizer variant={v} size={s} bars={v === "mirror" ? 7 : 5} />
      <span style={{ color: "var(--n-color-text-muted)", fontSize: "0.875rem" }}>Now playing</span>
    </div>
  ),
  loader: (v, s) => (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
      <Loader variant={v} size={s} />
      <span style={{ color: "var(--n-color-text-muted)", fontSize: "0.875rem" }}>Loading…</span>
    </div>
  ),
  waveLine: (v, s) => (
    <div style={{ width: "100%", maxWidth: "32rem" }}>
      <WaveLine variant={v} size={s} label="Live activity" />
    </div>
  ),
  rotatingBadge: (v, s) => (
    <RotatingBadge variant={v} size={s} href="#" text={v === "filled" ? "Start free • Start free • Start free • " : "New • Limited • New • Limited • "} />
  ),
};
/** Types whose sample needs the wide stage. */
export const LOOP_WIDE_D: string[] = ["waveLine"];
