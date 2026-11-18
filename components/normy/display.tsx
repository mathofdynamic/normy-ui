import type { CSSProperties, HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { nPart, nRoot, type NProps } from "@/engine/react";
import { Icon, type IconName } from "./icon";

type Div = NProps & Omit<HTMLAttributes<HTMLDivElement>, "title">;
type Tone = "neutral" | "accent" | "outline" | "inverse" | "success" | "warning" | "danger" | "info";

/* ---------------- Badge / Chip ---------------- */

export interface BadgeProps extends NProps, HTMLAttributes<HTMLSpanElement> {
  variant?: Tone | (string & {});
  dot?: boolean | "pulse";
}

export function Badge({ variant = "neutral", size = "md", nid, dot, children, ...rest }: BadgeProps) {
  return (
    <span {...nRoot("badge", { variant, size, nid })} {...rest}>
      {dot ? (
        <span {...nPart("badge", "dot")} aria-hidden>
          {dot === "pulse" ? <span {...nPart("badge", "pulse")} /> : null}
        </span>
      ) : null}
      {children}
    </span>
  );
}

export interface ChipProps extends NProps, Omit<HTMLAttributes<HTMLElement>, "onClick"> {
  selected?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  disabled?: boolean;
}

/** Chip — toggleable (aria-pressed) and/or removable token. */
export function Chip({ variant = "neutral", size = "md", nid, selected, onClick, onRemove, disabled, children, ...rest }: ChipProps) {
  const attrs = nRoot("chip", { variant, size, nid }, {}, { selected, disabled });
  if (onRemove) {
    return (
      <span {...attrs} {...rest}>
        <span {...nPart("chip", "label")}>{children}</span>
        <button type="button" aria-label={`Remove ${typeof children === "string" ? children : ""}`} onClick={onRemove} {...nPart("chip", "remove")}>
          <Icon name="x" />
        </button>
      </span>
    );
  }
  return (
    <button type="button" aria-pressed={selected} disabled={disabled} onClick={onClick} {...attrs} {...rest}>
      <span {...nPart("chip", "label")}>{children}</span>
    </button>
  );
}

/* ---------------- Avatar ---------------- */

export interface AvatarProps extends NProps, HTMLAttributes<HTMLSpanElement> {
  name: string;
  src?: string;
  status?: boolean;
}

export function Avatar({ variant = "circle", size = "md", nid, name, src, status, style, ...rest }: AvatarProps) {
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
  // Deterministic tint from the name, drawn from chart tokens.
  const hash = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
  const tint = `var(--n-color-chart-${(hash % 6) + 1})`;
  return (
    <span {...nRoot("avatar", { variant, size, nid })} style={style} {...rest}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} {...nPart("avatar", "image")} />
      ) : (
        <span
          role="img"
          aria-label={name}
          {...nPart("avatar", "fallback")}
          style={{ "--n-avatar-tint": tint } as CSSProperties}
        >
          {initials}
        </span>
      )}
      {status ? <span {...nPart("avatar", "status")} aria-label="Online" /> : null}
    </span>
  );
}

export function AvatarGroup({ names, max = 4, size = "sm", nid }: { names: string[]; max?: number; size?: string; nid?: string }) {
  const shown = names.slice(0, max);
  const more = names.length - shown.length;
  return (
    <span {...nRoot("avatarGroup", { nid }, { variant: "default" })} role="group" aria-label={`${names.length} people`}>
      {shown.map((n, i) => (
        <Avatar key={n} name={n} size={size} style={{ marginLeft: i ? "var(--n-overlap)" : undefined, boxShadow: "0 0 0 2px var(--n-color-bg)" }} />
      ))}
      {more > 0 ? <span {...nPart("avatarGroup", "more")}>+{more}</span> : null}
    </span>
  );
}

/* ---------------- Spinner / Skeleton / Progress ---------------- */

export function Spinner({ variant = "default", size = "md", nid, label = "Loading" }: NProps & { label?: string }) {
  return (
    <svg viewBox="0 0 24 24" role="img" aria-label={label} {...nRoot("spinner", { variant, size, nid })}>
      <circle cx="12" cy="12" r="9" {...nPart("spinner", "track")} />
      <path d="M12 3a9 9 0 0 1 9 9" {...nPart("spinner", "arc")} />
    </svg>
  );
}

export function Skeleton({ variant = "text", nid, width }: NProps & { width?: string }) {
  return <span aria-hidden {...nRoot("skeleton", { variant, nid })} style={width ? ({ "--n-l-w": width } as CSSProperties) : undefined} />;
}

export interface ProgressProps extends NProps {
  value?: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  /** Indeterminate when value is undefined. */
}

export function Progress({ variant = "bar", size = "md", nid, value, max = 100, label, showValue }: ProgressProps) {
  const pct = value === undefined ? undefined : Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div {...nRoot("progress", { variant, size, nid }, {}, { loading: pct === undefined })}>
      {label || showValue ? (
        <div {...nPart("progress", "header")}>
          {label ? <span {...nPart("progress", "label")}>{label}</span> : <span />}
          {showValue && pct !== undefined ? <span {...nPart("progress", "value")}>{Math.round(pct)}%</span> : null}
        </div>
      ) : null}
      <div
        role="progressbar"
        aria-label={label ?? "Progress"}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        {...nPart("progress", "track")}
        style={pct !== undefined ? ({ "--n-pct": `${pct}%` } as CSSProperties) : undefined}
      >
        <div {...nPart("progress", "fill")} />
      </div>
    </div>
  );
}

/* ---------------- Media (with generative art) ---------------- */

export interface MediaProps extends NProps, HTMLAttributes<HTMLElement> {
  src?: string;
  alt?: string;
  /** Seed for generated art when no src. */
  seed?: number;
  caption?: ReactNode;
  overlay?: boolean;
  ratio?: string;
}

export function Media({ variant = "default", size, nid, src, alt = "", seed = 1, caption, overlay, ratio, style, children, ...rest }: MediaProps) {
  const c = (n: number) => `var(--n-color-chart-${((seed + n) % 6) + 1})`;
  const art = {
    "--n-art-1": c(0),
    "--n-art-2": c(2),
    "--n-art-3": c(4),
    "--n-art-x1": `${(seed * 37) % 100}%`,
    "--n-art-y1": `${(seed * 53) % 100}%`,
    "--n-art-x2": `${(seed * 71 + 40) % 100}%`,
    "--n-art-y2": `${(seed * 29 + 60) % 100}%`,
    "--n-art-a": `${(seed * 47) % 360}deg`,
  } as CSSProperties;
  return (
    <figure {...nRoot("media", { variant, size, nid })} style={{ ...(ratio ? { aspectRatio: ratio } : null), ...style }} {...rest}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} {...nPart("media", "image")} />
      ) : (
        <div role={alt ? "img" : undefined} aria-label={alt || undefined} {...nPart("media", "art")} style={art} />
      )}
      {overlay ? <div {...nPart("media", "overlay")} /> : null}
      {children}
      {caption ? <figcaption {...nPart("media", "caption")}>{caption}</figcaption> : null}
    </figure>
  );
}

/* ---------------- Card ---------------- */

export interface CardProps extends Div {
  as?: "div" | "article" | "section" | "li";
  selected?: boolean;
  variant?: "raised" | "outline" | "sunk" | "ghost" | "interactive" | "inverse" | (string & {});
}

export function Card({ variant = "raised", size = "md", nid, as: Tag = "div", selected, ...rest }: CardProps) {
  return <Tag {...nRoot("card", { variant, size, nid }, {}, { selected })} {...(rest as HTMLAttributes<HTMLElement>)} />;
}

export function CardMedia(props: HTMLAttributes<HTMLDivElement>) {
  return <div {...nPart("card", "media")} {...props} />;
}

export interface CardHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title: ReactNode;
  eyebrow?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  level?: "h2" | "h3" | "h4";
}

export function CardHeader({ title, eyebrow, description, action, level: H = "h3", ...rest }: CardHeaderProps) {
  return (
    <div {...nPart("card", "header")} {...rest}>
      <div style={{ minWidth: 0 }}>
        {eyebrow ? <span {...nPart("card", "eyebrow")}>{eyebrow}</span> : null}
        <H {...nPart("card", "title")}>{title}</H>
        {description ? <p {...nPart("card", "description")}>{description}</p> : null}
      </div>
      {action ? <div {...nPart("card", "action")}>{action}</div> : null}
    </div>
  );
}

export const CardBody = (props: HTMLAttributes<HTMLDivElement>) => <div {...nPart("card", "body")} {...props} />;
export const CardFooter = (props: HTMLAttributes<HTMLDivElement>) => <div {...nPart("card", "footer")} {...props} />;

/* ---------------- Stat / Price / DataList / Timeline ---------------- */

export interface StatProps extends Div {
  label: ReactNode;
  value: ReactNode;
  delta?: string;
  trend?: "up" | "down";
  icon?: IconName;
  meta?: ReactNode;
  spark?: ReactNode;
}

export function Stat({ variant = "card", size = "md", nid, label, value, delta, trend = "up", icon, meta, spark, ...rest }: StatProps) {
  return (
    <div {...nRoot("stat", { variant, size, nid })} {...rest}>
      <span {...nPart("stat", "label")}>
        {icon ? <Icon name={icon} {...nPart("stat", "icon")} /> : null}
        {label}
      </span>
      <span {...nPart("stat", "value")} data-n-count>
        {value}
      </span>
      {delta || meta ? (
        <span {...nPart("stat", "meta")}>
          {delta ? (
            <span {...nPart("stat", "delta", { invalid: trend === "down" })} data-invalid={trend === "down" ? "" : undefined}>
              <Icon name={trend === "down" ? "arrow-down" : "arrow-up-right"} />
              {delta}
            </span>
          ) : null}
          {meta}
        </span>
      ) : null}
      {spark ? <div {...nPart("stat", "spark")}>{spark}</div> : null}
    </div>
  );
}

export function Price({ variant = "default", nid, amount, currency = "$", period, strike }: NProps & { amount: string | number; currency?: string; period?: string; strike?: string }) {
  return (
    <span {...nRoot("price", { variant, nid })}>
      <span {...nPart("price", "currency")}>{currency}</span>
      <span {...nPart("price", "amount")}>{amount}</span>
      {period ? <span {...nPart("price", "period")}>/{period}</span> : null}
      {strike ? <s {...nPart("price", "strike")}>{strike}</s> : null}
    </span>
  );
}

export function DataList({ variant = "rows", nid, items }: NProps & { items: Array<[ReactNode, ReactNode]> }) {
  return (
    <dl {...nRoot("dataList", { variant, nid })}>
      {items.map(([k, v], i) => (
        <div key={i} {...nPart("dataList", "item")}>
          <dt {...nPart("dataList", "label")}>{k}</dt>
          <dd {...nPart("dataList", "value")}>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export interface TimelineItem {
  title: ReactNode;
  time: string;
  body?: ReactNode;
  icon?: IconName;
}

export function Timeline({ variant = "default", nid, items }: NProps & { items: TimelineItem[] }) {
  return (
    <ol {...nRoot("timeline", { variant, nid })}>
      {items.map((it, i) => (
        <li key={i} {...nPart("timeline", "item")}>
          <span {...nPart("timeline", "marker")}>
            <Icon name={it.icon ?? "dot"} />
          </span>
          <div {...nPart("timeline", "content")}>
            <span {...nPart("timeline", "title")}>{it.title}</span>
            {it.body ? <span {...nPart("timeline", "body")}>{it.body}</span> : null}
            <time {...nPart("timeline", "time")}>{it.time}</time>
          </div>
        </li>
      ))}
    </ol>
  );
}

/* ---------------- Alert / EmptyState ---------------- */

const TONE_ICON: Record<string, IconName> = { info: "info", success: "check-circle", warning: "alert-triangle", danger: "alert-circle", neutral: "info", accent: "sparkle" };

export interface AlertProps extends Omit<Div, "title"> {
  title?: ReactNode;
  icon?: IconName;
  action?: ReactNode;
}

export function Alert({ variant = "info", size = "md", nid, title, icon, action, children, ...rest }: AlertProps) {
  const urgent = variant === "danger" || variant === "warning";
  return (
    <div role={urgent ? "alert" : "status"} {...nRoot("alert", { variant, size, nid })} {...rest}>
      <Icon name={icon ?? TONE_ICON[variant] ?? "info"} {...nPart("alert", "icon")} />
      <div {...nPart("alert", "content")}>
        {title ? <span {...nPart("alert", "title")}>{title}</span> : null}
        {children ? <span {...nPart("alert", "description")}>{children}</span> : null}
      </div>
      {action ? <div {...nPart("alert", "action")}>{action}</div> : null}
    </div>
  );
}

export interface EmptyStateProps extends Omit<Div, "title"> {
  icon?: IconName;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}

export function EmptyState({ variant = "dashed", nid, icon = "inbox", title, description, actions, ...rest }: EmptyStateProps) {
  return (
    <div {...nRoot("emptyState", { variant, nid })} {...rest}>
      <span {...nPart("emptyState", "icon")}>
        <Icon name={icon} />
      </span>
      <h3 {...nPart("emptyState", "title")}>{title}</h3>
      {description ? <p {...nPart("emptyState", "description")}>{description}</p> : null}
      {actions ? <div {...nPart("emptyState", "actions")}>{actions}</div> : null}
    </div>
  );
}

/* ---------------- Feature ---------------- */

export interface FeatureProps extends Omit<Div, "title"> {
  icon?: IconName;
  number?: string;
  title: ReactNode;
  children?: ReactNode;
  link?: ReactNode;
}

export function Feature({ variant = "plain", nid, icon, number, title, children, link, ...rest }: FeatureProps) {
  return (
    <div {...nRoot("feature", { variant, nid })} {...rest}>
      {icon || number ? <span {...nPart("feature", "icon")}>{number ?? <Icon name={icon!} />}</span> : null}
      <h3 {...nPart("feature", "title")}>{title}</h3>
      {children ? <p {...nPart("feature", "text")}>{children}</p> : null}
      {link ? <div {...nPart("feature", "link")}>{link}</div> : null}
    </div>
  );
}

/* ---------------- Table (structural) ---------------- */

export function Table({ variant = "boxed", size = "md", nid, caption, children, label }: NProps & { caption?: ReactNode; children: ReactNode; label?: string }) {
  return (
    <div {...nRoot("table", { variant, size, nid })} role="region" aria-label={label} tabIndex={label ? 0 : undefined}>
      <table {...nPart("table", "table")}>
        {caption ? <caption {...nPart("table", "caption")}>{caption}</caption> : null}
        {children}
      </table>
    </div>
  );
}
export const THead = (p: HTMLAttributes<HTMLTableSectionElement>) => <thead {...nPart("table", "head")} {...p} />;
export const TBody = (p: HTMLAttributes<HTMLTableSectionElement>) => <tbody {...p} />;
export function Tr({ selected, ...p }: HTMLAttributes<HTMLTableRowElement> & { selected?: boolean }) {
  return <tr {...nPart("table", "row", { selected })} aria-selected={selected} {...p} />;
}
export function Th({ sorted, onSort, children, ...p }: ThHTMLAttributes<HTMLTableCellElement> & { sorted?: "asc" | "desc"; onSort?: () => void }) {
  return (
    <th scope="col" aria-sort={sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : undefined} {...nPart("table", "th", { current: !!sorted })} {...p}>
      {onSort ? (
        <button type="button" onClick={onSort} {...nPart("table", "sortButton")}>
          {children}
          <Icon name={sorted === "asc" ? "arrow-up" : sorted === "desc" ? "arrow-down" : "chevrons-up-down"} {...nPart("table", "sort")} />
        </button>
      ) : (
        children
      )}
    </th>
  );
}
export const Td = (p: TdHTMLAttributes<HTMLTableCellElement>) => <td {...nPart("table", "td")} {...p} />;
