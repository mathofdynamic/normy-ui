import type { CSSProperties, ElementType, HTMLAttributes, ReactNode } from "react";
import { nPart, nRoot, responsive, space, type NProps, type Responsive, type SpaceStep } from "@/engine/react";

/* ------------------------------------------------------------------ *
 * Layout primitives. Pages pass TOKEN steps (gap={4}), never lengths.
 * Values travel as non-inheriting CSS vars the recipes consume, so
 * design-system rules can still override any of it.
 * ------------------------------------------------------------------ */

type Span = number | "full";
const spanCss = (s: Span) => (s === "full" ? "1 / -1" : `span ${s}`);

interface Base extends NProps, Omit<HTMLAttributes<HTMLElement>, "color"> {
  as?: ElementType;
  children?: ReactNode;
  /** Grid column span when inside a Grid. */
  span?: Responsive<Span>;
}

export type BoxProps = Base;

/** Box — generic container. Variants: plain, surface, raised, sunken, inverse, outline, accent. Sizes pad. */
export function Box({ as: Tag = "div", variant, size, nid, span, style, ...rest }: BoxProps) {
  return (
    <Tag
      {...nRoot("box", { variant, size, nid }, { variant: "plain", size: "none" })}
      style={{ ...responsive("--n-l-span", span, spanCss), ...style }}
      {...rest}
    />
  );
}

export interface StackProps extends Base {
  direction?: Responsive<"row" | "column" | "row-reverse" | "column-reverse">;
  gap?: SpaceStep;
  align?: "stretch" | "flex-start" | "center" | "flex-end" | "baseline";
  justify?: "flex-start" | "center" | "flex-end" | "space-between" | "space-around";
  wrap?: boolean;
}

/** Stack — flex column/row with token gaps. `direction={{ base: "column", md: "row" }}` is responsive. */
export function Stack({ as: Tag = "div", direction, gap, align, justify, wrap, span, variant, size, nid, style, ...rest }: StackProps) {
  const vars: Record<string, string> = {};
  if (gap !== undefined) vars["--n-l-gap"] = space(gap);
  if (align) vars["--n-l-align"] = align;
  if (justify) vars["--n-l-justify"] = justify;
  if (wrap) vars["--n-l-wrap"] = "wrap";
  return (
    <Tag
      {...nRoot("stack", { variant, size, nid }, { variant: "default" })}
      style={{ ...responsive("--n-l-dir", direction, String), ...responsive("--n-l-span", span, spanCss), ...vars, ...style } as CSSProperties}
      {...rest}
    />
  );
}

/** Row — Stack with direction row and centred items. */
export function Row({ align = "center", ...rest }: Omit<StackProps, "direction">) {
  return <Stack direction="row" align={align} {...rest} />;
}

export interface GridProps extends Base {
  /** Number of equal columns, "auto" (auto-fit) or a raw template. Responsive. */
  cols?: Responsive<number | "auto" | string>;
  /** Minimum column width for cols="auto", in rem. */
  min?: number;
  gap?: SpaceStep;
  align?: "stretch" | "start" | "center" | "end";
}

export function Grid({ as: Tag = "div", cols, min = 16, gap, align, span, variant, size, nid, style, ...rest }: GridProps) {
  const tpl = (c: number | "auto" | string) =>
    typeof c === "number" ? `repeat(${c}, minmax(0, 1fr))` : c === "auto" ? `repeat(auto-fit, minmax(min(${min}rem, 100%), 1fr))` : c;
  const vars: Record<string, string> = {};
  if (gap !== undefined) vars["--n-l-gap"] = space(gap);
  if (align) vars["--n-l-align"] = align;
  return (
    <Tag
      {...nRoot("grid", { variant, size, nid }, { variant: "default" })}
      style={{ ...responsive("--n-l-cols", cols, tpl), ...responsive("--n-l-span", span, spanCss), ...vars, ...style } as CSSProperties}
      {...rest}
    />
  );
}

/** Container — centred, max-width, gutters. Variants: default, narrow, wide, full. */
export function Container({ as: Tag = "div", variant, size, nid, ...rest }: Base) {
  return <Tag {...nRoot("container", { variant, size, nid }, { variant: "default" })} {...rest} />;
}

/** Section — vertical band. Variants: plain, muted, inverse, accent, bordered. Sizes: sm, md, lg. */
export function Section({ as: Tag = "section", variant, size, nid, ...rest }: Base) {
  return <Tag {...nRoot("section", { variant, size, nid }, { variant: "plain", size: "md" })} {...rest} />;
}

export interface DividerProps extends NProps, HTMLAttributes<HTMLElement> {
  label?: ReactNode;
}

/** Divider — hairline separator. Variants: horizontal, vertical, dashed, labelled. */
export function Divider({ variant, size, nid, label, ...rest }: DividerProps) {
  const v = label ? "labelled" : variant;
  if (label) {
    return (
      <div role="separator" {...nRoot("divider", { variant: v, size, nid }, { variant: "horizontal" })} {...rest}>
        <span aria-hidden {...nPart("divider", "line")} />
        <span {...nPart("divider", "label")}>{label}</span>
        <span aria-hidden {...nPart("divider", "line")} />
      </div>
    );
  }
  return <hr {...nRoot("divider", { variant: v, size, nid }, { variant: "horizontal" })} aria-orientation={v === "vertical" ? "vertical" : undefined} {...rest} />;
}

const SR_ONLY = { position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap", border: 0 } as const;

/** VisuallyHidden — text for screen readers only (an a11y utility, not a visual style). */
export function VisuallyHidden({ children, as: Tag = "span" }: { children: ReactNode; as?: ElementType }) {
  return <Tag style={SR_ONLY}>{children}</Tag>;
}
