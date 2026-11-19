"use client";

import { getDef } from "@/engine/registry";
import type { DesignSystem } from "@/engine/types";
import { refs } from "@/engine/values";
import "./studio.css";

/**
 * A tiny, self-contained picture of a system: its canvas, type, accent and
 * corner radius. Read straight from the system's tokens (registry defaults
 * fill the gaps), so it never needs an iframe.
 */
export function tokenOf(s: DesignSystem, id: string, dark = false): string {
  const v = (dark ? (s.dark[id] ?? s.tokens[id]) : s.tokens[id]) ?? (dark ? (getDef(id)?.darkDefault ?? getDef(id)?.default) : getDef(id)?.default);
  return typeof v === "string" || typeof v === "number" ? refs(String(v)) : "";
}

function radiusOf(s: DesignSystem): string {
  const base = tokenOf(s, "radius.base") || "6px";
  const ctl = String(s.tokens["radius.control"] ?? "");
  if (/999|9999|full/.test(ctl)) return "999px";
  return base;
}

export function SystemThumb({ system, dark = false }: { system: DesignSystem; dark?: boolean }) {
  const t = (id: string) => tokenOf(system, id, dark);
  const r = radiusOf(system);
  return (
    <span
      className="st-thumb"
      aria-hidden
      style={{
        background: t("color.bg"),
        color: t("color.text"),
        fontFamily: t("font.body"),
      }}
    >
      <span className="st-thumb-head" style={{ fontFamily: t("font.display"), fontWeight: 700 }}>
        Aa
      </span>
      <span className="st-thumb-card" style={{ background: t("color.surface-raised"), borderColor: t("color.border"), borderRadius: `min(${r}, 10px)` }}>
        <span className="st-thumb-line" style={{ background: t("color.text"), width: "70%" }} />
        <span className="st-thumb-line" style={{ background: t("color.text-subtle"), width: "45%" }} />
        <span className="st-thumb-btn" style={{ background: t("color.accent"), borderRadius: `min(${r}, 8px)` }} />
      </span>
    </span>
  );
}
