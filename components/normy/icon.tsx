import type { SVGProps } from "react";
import { nPart, nRoot, type NProps } from "@/engine/react";

/**
 * Icon — the Normy line set (24×24 grid). Size, stroke width, caps, joins,
 * colour and outline/duotone/solid style all come from rules (icon group),
 * flowing down from the parent component via inherited CSS variables.
 * Glyphs marked `closed` get a fill layer for duotone / solid styles.
 */
const G: Record<string, { d: string; closed?: boolean }> = {
  "arrow-right": { d: "M5 12h14M13 6l6 6-6 6" },
  "arrow-left": { d: "M19 12H5M11 6l-6 6 6 6" },
  "arrow-up": { d: "M12 19V5M6 11l6-6 6 6" },
  "arrow-down": { d: "M12 5v14M6 13l6 6 6-6" },
  "arrow-up-right": { d: "M7 17L17 7M8 7h9v9" },
  "chevron-right": { d: "M9 6l6 6-6 6" },
  "chevron-left": { d: "M15 6l-6 6 6 6" },
  "chevron-down": { d: "M6 9l6 6 6-6" },
  "chevron-up": { d: "M6 15l6-6 6 6" },
  "chevrons-up-down": { d: "M7 15l5 5 5-5M7 9l5-5 5 5" },
  check: { d: "M4.5 12.5l5 5L19.5 7" },
  x: { d: "M6 6l12 12M18 6L6 18" },
  plus: { d: "M12 5v14M5 12h14" },
  minus: { d: "M5 12h14" },
  search: { d: "M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM15.5 15.5L20 20", closed: true },
  menu: { d: "M4 7h16M4 12h16M4 17h16" },
  "more-horizontal": { d: "M6 12h.01M12 12h.01M18 12h.01" },
  "more-vertical": { d: "M12 6h.01M12 12h.01M12 18h.01" },
  settings: {
    d: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z",
    closed: true,
  },
  sliders: { d: "M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0M14 4v4M8 10v4M16 16v4" },
  user: { d: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0", closed: true },
  users: { d: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0M16 3.5a4 4 0 0 1 0 7M22 21a7 7 0 0 0-4-6.3", closed: true },
  home: { d: "M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z", closed: true },
  inbox: { d: "M3 13l3-8h12l3 8v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zM3 13h5l1.5 3h5L16 13h5", closed: true },
  mail: { d: "M3 6h18v12H3zM3 7l9 6 9-6", closed: true },
  bell: { d: "M6 16V11a6 6 0 1 1 12 0v5l2 2H4zM10 21h4", closed: true },
  calendar: { d: "M4 5h16v16H4zM4 10h16M8 3v4M16 3v4", closed: true },
  clock: { d: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2", closed: true },
  "chart-bar": { d: "M4 20V10M10 20V4M16 20v-7M22 20H2" },
  "chart-line": { d: "M3 17l6-6 4 4 8-8M15 7h6v6" },
  "chart-pie": { d: "M12 3v9h9a9 9 0 1 1-9-9zM15 3.5A9 9 0 0 1 20.5 9H15z", closed: true },
  layout: { d: "M3 4h18v16H3zM3 9h18M9 9v11", closed: true },
  grid: { d: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z", closed: true },
  list: { d: "M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" },
  kanban: { d: "M4 4h4v16H4zM10 4h4v10h-4zM16 4h4v13h-4z", closed: true },
  table: { d: "M3 5h18v14H3zM3 10h18M3 15h18M9 5v14", closed: true },
  filter: { d: "M3 5h18l-7 8v6l-4 2v-8z", closed: true },
  sort: { d: "M7 4v16M3 8l4-4 4 4M17 20V4M13 16l4 4 4-4" },
  download: { d: "M12 4v12M6 11l6 6 6-6M4 21h16" },
  upload: { d: "M12 20V8M6 13l6-6 6 6M4 3h16" },
  external: { d: "M14 4h6v6M20 4l-9 9M18 14v6H4V6h6" },
  copy: { d: "M9 9h11v11H9zM5 15H4V4h11v1", closed: true },
  trash: { d: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" },
  edit: { d: "M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4", closed: true },
  eye: { d: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z", closed: true },
  lock: { d: "M5 11h14v10H5zM8 11V7a4 4 0 1 1 8 0v4", closed: true },
  heart: { d: "M12 20s-8-4.7-8-10.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 2.5C20 15.3 12 20 12 20z", closed: true },
  star: { d: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z", closed: true },
  bookmark: { d: "M6 3h12v18l-6-4-6 4z", closed: true },
  share: { d: "M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.6 13.5l6.8 4M15.4 6.5l-6.8 4", closed: true },
  cart: { d: "M3 4h2l2.5 11h11L21 7H6.2M9 20h.01M17 20h.01" },
  bag: { d: "M5 8h14l-1 13H6zM9 8V6a3 3 0 1 1 6 0v2", closed: true },
  "credit-card": { d: "M3 6h18v12H3zM3 10h18M7 15h3", closed: true },
  tag: { d: "M3 3h8l10 10-8 8L3 11zM7.5 7.5h.01", closed: true },
  globe: { d: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18", closed: true },
  sun: { d: "M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4", closed: true },
  moon: { d: "M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z", closed: true },
  zap: { d: "M13 2L4 14h7l-1 8 9-12h-7z", closed: true },
  sparkle: { d: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.7 1.8 1.8.7-1.8.7L19 21l-.7-1.8-1.8-.7 1.8-.7z", closed: true },
  info: { d: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5M12 8h.01", closed: true },
  "alert-triangle": { d: "M12 3l10 18H2zM12 10v4M12 17.5h.01", closed: true },
  "alert-circle": { d: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 8v5M12 16h.01", closed: true },
  "check-circle": { d: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8 12.5l3 3 5-6", closed: true },
  "x-circle": { d: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9 9l6 6M15 9l-6 6", closed: true },
  help: { d: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 17h.01", closed: true },
  message: { d: "M4 4h16v12H8l-4 4z", closed: true },
  send: { d: "M21 3L10 14M21 3l-7 18-4-7-7-4z", closed: true },
  paperclip: { d: "M20 11l-8.5 8.5a5 5 0 0 1-7-7L13 4a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L14 7" },
  image: { d: "M3 4h18v16H3zM3 16l5-5 4 4 3-3 6 6M15.5 9h.01", closed: true },
  file: { d: "M6 3h8l5 5v13H6zM14 3v5h5", closed: true },
  folder: { d: "M3 6h6l2 2h10v11H3z", closed: true },
  code: { d: "M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16" },
  terminal: { d: "M3 4h18v16H3zM7 9l3 3-3 3M12 15h5", closed: true },
  command: { d: "M9 9V6a3 3 0 1 0-3 3h3zm0 0h6m-6 0v6m6-6V6a3 3 0 1 1 3 3h-3zm0 0v6m0 0h3a3 3 0 1 1-3 3v-3zm0 0H9m0 0v3a3 3 0 1 1-3-3h3z" },
  link: { d: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.7l1-1" },
  logout: { d: "M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11" },
  refresh: { d: "M20 11a8 8 0 0 0-14.6-4.5L3 9M3 4v5h5M4 13a8 8 0 0 0 14.6 4.5L21 15M21 20v-5h-5" },
  play: { d: "M7 4l13 8-13 8z", closed: true },
  pause: { d: "M7 4h4v16H7zM14 4h4v16h-4z", closed: true },
  "map-pin": { d: "M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z", closed: true },
  phone: { d: "M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z", closed: true },
  layers: { d: "M12 3l9 5-9 5-9-5zM3 13l9 5 9-5M3 17.5l9 5 9-5", closed: true },
  box: { d: "M12 2l9 5v10l-9 5-9-5V7zM3 7l9 5 9-5M12 12v10", closed: true },
  truck: { d: "M2 6h12v10H2zM14 10h4l3 3v3h-7M6.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM17.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z", closed: true },
  shield: { d: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z", closed: true },
  wand: { d: "M4 20L16 8M14 4l1 2 2 1-2 1-1 2-1-2-2-1 2-1zM19 11l.5 1 1 .5-1 .5-.5 1-.5-1-1-.5 1-.5z" },
  palette: { d: "M12 21a9 9 0 1 1 9-9c0 2.5-2 3-3.5 3H16a2 2 0 0 0-1.5 3.3A2 2 0 0 1 12 21zM7.5 11h.01M10 7h.01M15 7.5h.01", closed: true },
  cursor: { d: "M5 3l14 7-6 2-2 6z", closed: true },
  cloud: { d: "M7 18a5 5 0 1 1 .9-9.9A6 6 0 0 1 19 10a4 4 0 0 1-1 8z", closed: true },
  database: { d: "M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3", closed: true },
  cpu: { d: "M7 7h10v10H7zM10 10h4v4h-4zM10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4", closed: true },
  "git-branch": { d: "M6 3v12M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 9a9 9 0 0 1-9 9" },
  rocket: { d: "M5 15c-1.5 1.5-2 5-2 5s3.5-.5 5-2M9 15l-3-3c1-4 4.5-8 12-9-1 7.5-5 11-9 12zM14.5 9.5h.01", closed: true },
  target: { d: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z", closed: true },
  dot: { d: "M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z", closed: true },
};

export type IconName = keyof typeof G;
export const ICON_NAMES = Object.keys(G) as IconName[];

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name">, NProps {
  name: IconName;
  /** Accessible label. Omit for decorative icons (default). */
  label?: string;
}

export function Icon({ name, label, variant, size, nid, ...rest }: IconProps) {
  const glyph = G[name] ?? G.dot;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable={false}
      {...nRoot("icon", { variant, size, nid }, { variant: "default" })}
      {...rest}
    >
      {glyph.closed ? <path d={glyph.d} {...nPart("icon", "fill")} /> : null}
      <path d={glyph.d} {...nPart("icon", "stroke")} />
    </svg>
  );
}
