"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { nPart, nRoot, type NProps } from "@/engine/react";
import { IconButton } from "./button";
import { useBehavior } from "./use-behavior";

/* ------------------------------------------------------------------ *
 * Chart — hand-built SVG. Every mark is a part, so rules restyle it;
 * the curve type (linear/smooth/step) is a behaviour prop.
 * ------------------------------------------------------------------ */

export interface Series {
  name: string;
  data: number[];
  /** Chart colour token index 1–6. */
  color?: number;
}

export interface ChartProps extends NProps {
  kind?: "line" | "area" | "bar" | "donut" | "spark";
  series: Series[];
  labels?: string[];
  height?: number;
  legend?: boolean;
  label: string;
  centerLabel?: string;
}


function pathFor(pts: Array<[number, number]>, curve: string) {
  if (!pts.length) return "";
  if (curve === "step") return pts.map(([x, y], i) => (i ? `H${x}V${y}` : `M${x},${y}`)).join("");
  if (curve !== "smooth") return pts.map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join("");
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const cx = (x0 + x1) / 2;
    d += `C${cx},${y0} ${cx},${y1} ${x1},${y1}`;
  }
  return d;
}

const colorVar = (i: number) => ({ color: `var(--n-color-chart-${i})` }) as CSSProperties;

export function Chart({ variant = "default", nid, kind = "line", series, labels = [], height = 220, legend = true, label, centerLabel }: ChartProps) {
  const ref = useRef<HTMLElement>(null);
  const { chartCurve } = useBehavior(ref, { chartCurve: "smooth" });
  const [hover, setHover] = useState<number | null>(null);
  const [W, setW] = useState(600);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(Math.max(120, Math.round(el.clientWidth))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const H = kind === "spark" ? 48 : height;
  const pad = kind === "spark" ? { t: 4, r: 2, b: 4, l: 2 } : { t: 12, r: 8, b: 26, l: 36 };
  const all = series.flatMap((s) => s.data);
  const max = Math.max(1, ...all) * 1.1;
  const n = Math.max(...series.map((s) => s.data.length), 1);
  const x = (i: number) => pad.l + (n === 1 ? 0 : (i / (n - 1)) * (W - pad.l - pad.r));
  const y = (v: number) => pad.t + (1 - v / max) * (H - pad.t - pad.b);

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((f) => ({ v: Math.round(max * f), y: y(max * f) }));

  if (kind === "donut") {
    const total = series.reduce((a, s) => a + (s.data[0] ?? 0), 0) || 1;
    const R = 70;
    const C = 2 * Math.PI * R;
    const offsets = series.map((_, i) => series.slice(0, i).reduce((a, s) => a + ((s.data[0] ?? 0) / total) * C, 0));
    return (
      <figure ref={ref} {...nRoot("chart", { variant, nid })} aria-label={label}>
        <svg viewBox="0 0 200 200" role="img" aria-label={label} {...nPart("chart", "svg")} style={{ maxWidth: 220, marginInline: "auto" }}>
          <g transform="rotate(-90 100 100)">
            {series.map((s, i) => {
              const v = s.data[0] ?? 0;
              const len = (v / total) * C;
              const el = (
                <circle
                  key={s.name}
                  cx="100"
                  cy="100"
                  r={R}
                  stroke="currentColor"
                  strokeDasharray={`${Math.max(0, len - 3)} ${C}`}
                  strokeDashoffset={-offsets[i]}
                  style={colorVar(s.color ?? i + 1)}
                  onPointerEnter={() => setHover(i)}
                  onPointerLeave={() => setHover(null)}
                  {...nPart("chart", "slice", { selected: hover === i })}
                  data-n-force={hover === i ? "hover" : undefined}
                >
                  <title>{`${s.name}: ${v}`}</title>
                </circle>
              );
              return el;
            })}
          </g>
          <text x="100" y="106" textAnchor="middle" {...nPart("chart", "center")}>
            {hover !== null ? series[hover].data[0] : (centerLabel ?? total)}
          </text>
        </svg>
        {legend ? <Legend series={series} /> : null}
      </figure>
    );
  }

  const barW = ((W - pad.l - pad.r) / n) * 0.6 / series.length;

  return (
    <figure ref={ref} {...nRoot("chart", { variant, nid })}>
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" aria-label={label} {...nPart("chart", "svg")}>
        {kind !== "spark"
          ? gridLines.map((g) => (
              <g key={g.v}>
                <line x1={pad.l} x2={W - pad.r} y1={g.y} y2={g.y} {...nPart("chart", "grid")} />
                <text x={pad.l - 6} y={g.y + 3} textAnchor="end" {...nPart("chart", "axis")}>
                  {g.v >= 1000 ? `${Math.round(g.v / 100) / 10}k` : g.v}
                </text>
              </g>
            ))
          : null}
        {kind !== "spark"
          ? labels.map((l, i) =>
              n > 12 && i % Math.ceil(n / 8) !== 0 ? null : (
                <text key={l + i} x={kind === "bar" ? pad.l + ((i + 0.5) * (W - pad.l - pad.r)) / n : x(i)} y={H - 8} textAnchor="middle" {...nPart("chart", "axis")}>
                  {l}
                </text>
              ),
            )
          : null}
        {series.map((s, si) => {
          const style = colorVar(s.color ?? si + 1);
          if (kind === "bar") {
            return (
              <g key={s.name} style={style}>
                {s.data.map((v, i) => {
                  const bx = pad.l + ((i + 0.5) * (W - pad.l - pad.r)) / n - (barW * series.length) / 2 + si * barW;
                  return (
                    <rect key={i} x={bx} y={y(v)} width={barW - 2} height={Math.max(0, H - pad.b - y(v))} rx="2" {...nPart("chart", "bar")}>
                      <title>{`${labels[i] ?? i}: ${v}`}</title>
                    </rect>
                  );
                })}
              </g>
            );
          }
          const pts = s.data.map((v, i) => [x(i), y(v)] as [number, number]);
          const d = pathFor(pts, chartCurve);
          return (
            <g key={s.name} style={style}>
              {kind === "area" || kind === "spark" ? <path d={`${d}L${x(s.data.length - 1)},${H - pad.b}L${x(0)},${H - pad.b}Z`} {...nPart("chart", "area")} /> : null}
              <path d={d} vectorEffect="non-scaling-stroke" {...nPart("chart", "line")} />
              {kind !== "spark" && hover !== null && pts[hover] ? <circle cx={pts[hover][0]} cy={pts[hover][1]} r="4" vectorEffect="non-scaling-stroke" {...nPart("chart", "dot")} /> : null}
            </g>
          );
        })}
        {kind === "line" || kind === "area"
          ? Array.from({ length: n }, (_, i) => (
              <rect key={i} x={x(i) - (W / n) / 2} y={0} width={W / n} height={H} fill="transparent" onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)}>
                <title>{`${labels[i] ?? i}: ${series.map((s) => `${s.name} ${s.data[i]}`).join(", ")}`}</title>
              </rect>
            ))
          : null}
      </svg>
      {legend && kind !== "spark" && series.length > 1 ? <Legend series={series} /> : null}
    </figure>
  );
}

function Legend({ series }: { series: Series[] }) {
  return (
    <ul {...nPart("chart", "legend")}>
      {series.map((s, i) => (
        <li key={s.name} {...nPart("chart", "legendItem")} style={colorVar(s.color ?? i + 1)}>
          <span {...nPart("chart", "swatch")} />
          <span>{s.name}</span>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ *
 * Calendar — month grid; arrows move by day/week, PageUp/Down by month.
 * ------------------------------------------------------------------ */

export interface CalendarEvent {
  date: string; // YYYY-MM-DD
  title: string;
}

export interface CalendarProps extends NProps {
  month?: Date;
  selected?: string;
  onSelect?: (iso: string) => void;
  events?: CalendarEvent[];
  today?: string;
}

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function Calendar({ variant = "default", nid, month, selected, onSelect, events = [], today = "2026-11-18" }: CalendarProps) {
  const [view, setView] = useState(() => {
    const d = month ?? new Date(`${today}T00:00:00`);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [focus, setFocus] = useState(selected ?? today);
  const grid = useRef<HTMLDivElement>(null);

  const days = useMemo(() => {
    const first = new Date(view);
    const offset = (first.getDay() + 6) % 7;
    const start = new Date(first.getFullYear(), first.getMonth(), 1 - offset);
    return Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  }, [view]);

  const move = (deltaDays: number) => {
    const d = new Date(`${focus}T00:00:00`);
    d.setDate(d.getDate() + deltaDays);
    const next = iso(d);
    setFocus(next);
    if (d.getMonth() !== view.getMonth()) setView(new Date(d.getFullYear(), d.getMonth(), 1));
    requestAnimationFrame(() => grid.current?.querySelector<HTMLElement>(`[data-date="${next}"]`)?.focus());
  };
  const onKey = (e: KeyboardEvent) => {
    const map: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 7, ArrowUp: -7, PageDown: 30, PageUp: -30 };
    if (e.key in map) {
      e.preventDefault();
      move(map[e.key]);
    }
  };
  const label = view.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div {...nRoot("calendar", { variant, nid })}>
      <div {...nPart("calendar", "header")}>
        <span {...nPart("calendar", "title")} aria-live="polite">
          {label}
        </span>
        <span {...nPart("calendar", "nav")}>
          <IconButton icon="chevron-left" label="Previous month" size="sm" onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))} />
          <IconButton icon="chevron-right" label="Next month" size="sm" onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))} />
        </span>
      </div>
      <div ref={grid} role="grid" aria-label={label} {...nPart("calendar", "grid")} onKeyDown={onKey}>
        {WEEKDAYS.map((w) => (
          <span key={w} role="columnheader" {...nPart("calendar", "weekday")}>
            {variant === "large" ? w : w.slice(0, 2)}
          </span>
        ))}
        {days.map((d) => {
          const id = iso(d);
          const outside = d.getMonth() !== view.getMonth();
          const ev = events.filter((e) => e.date === id);
          return (
            <button
              key={id}
              type="button"
              role="gridcell"
              data-date={id}
              tabIndex={id === focus ? 0 : -1}
              aria-selected={id === selected}
              aria-current={id === today ? "date" : undefined}
              aria-label={`${d.toDateString()}${ev.length ? `, ${ev.length} event${ev.length > 1 ? "s" : ""}` : ""}`}
              onClick={() => {
                setFocus(id);
                onSelect?.(id);
              }}
              {...nPart("calendar", "day", { selected: id === selected, current: id === today, disabled: outside })}
            >
              {d.getDate()}
              {variant === "large"
                ? ev.slice(0, 2).map((e) => (
                    <span key={e.title} {...nPart("calendar", "event")}>
                      {e.title}
                    </span>
                  ))
                : ev.length
                  ? <span {...nPart("calendar", "event")} aria-hidden />
                  : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
