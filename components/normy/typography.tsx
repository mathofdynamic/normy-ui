import NextLink from "next/link";
import type { AnchorHTMLAttributes, ElementType, HTMLAttributes, ReactNode } from "react";
import { nPart, nRoot, type NProps } from "@/engine/react";
import { Icon, type IconName } from "./icon";

type HeadingVariant = "display" | "h1" | "h2" | "h3" | "h4" | "h5" | "eyebrow";
const SEMANTIC: Record<string, ElementType> = { display: "h1", h1: "h1", h2: "h2", h3: "h3", h4: "h4", h5: "h5", eyebrow: "p" };

export interface HeadingProps extends NProps, HTMLAttributes<HTMLHeadingElement> {
  variant?: HeadingVariant | (string & {});
  /** Semantic element; defaults from the variant. */
  as?: ElementType;
}

/** Heading — visual level via `variant`, semantic level via `as`. Wrap words in <Accent> for the accent colour. */
export function Heading({ variant = "h2", size, nid, as, ...rest }: HeadingProps) {
  const Tag = as ?? SEMANTIC[variant] ?? "h2";
  return <Tag {...nRoot("heading", { variant, size, nid })} {...rest} />;
}

export function Accent({ children }: { children: ReactNode }) {
  return <span {...nPart("heading", "accent")}>{children}</span>;
}

export interface TextProps extends NProps, HTMLAttributes<HTMLElement> {
  variant?: "body" | "lead" | "muted" | "small" | "caption" | "label" | "mono" | "strong" | "accent" | (string & {});
  as?: ElementType;
}

/** Text — body copy. Rules can turn any Text into a typewriter (behaviour group). */
export function Text({ variant = "body", size, nid, as: Tag = "p", ...rest }: TextProps) {
  return <Tag {...nRoot("text", { variant, size, nid })} {...rest} />;
}

export interface LinkProps extends NProps, AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  variant?: "default" | "subtle" | "nav" | "strong" | (string & {});
  icon?: IconName;
  current?: boolean;
}

/** Link — internal hrefs use next/link (client navigation + page transitions). */
export function Link({ variant = "default", size, nid, icon, current, href, children, ...rest }: LinkProps) {
  const attrs = {
    ...nRoot("link", { variant, size, nid }, {}, { current }),
    "aria-current": current ? ("page" as const) : undefined,
    ...rest,
  };
  const content = (
    <>
      {children}
      {icon ? (
        <span {...nPart("link", "icon")} style={{ display: "inline-flex" }}>
          <Icon name={icon} />
        </span>
      ) : null}
    </>
  );
  if (href.startsWith("/") || href.startsWith("#")) {
    return (
      <NextLink href={href} {...attrs}>
        {content}
      </NextLink>
    );
  }
  return (
    <a href={href} {...attrs}>
      {content}
    </a>
  );
}

export interface CodeProps extends NProps, HTMLAttributes<HTMLElement> {
  variant?: "inline" | "block";
}

export function Code({ variant = "inline", size, nid, children, ...rest }: CodeProps) {
  if (variant === "block") {
    return (
      <pre {...nRoot("code", { variant, size, nid })} {...rest}>
        <code>{children}</code>
      </pre>
    );
  }
  return (
    <code {...nRoot("code", { variant, size, nid })} {...rest}>
      {children}
    </code>
  );
}

export function Kbd({ variant, size, nid, ...rest }: NProps & HTMLAttributes<HTMLElement>) {
  return <kbd {...nRoot("kbd", { variant, size, nid }, { variant: "default" })} {...rest} />;
}

export interface QuoteProps extends NProps, HTMLAttributes<HTMLElement> {
  cite?: ReactNode;
  avatar?: ReactNode;
  variant?: "plain" | "card" | "large" | (string & {});
}

export function Quote({ variant = "plain", size, nid, cite, avatar, children, ...rest }: QuoteProps) {
  return (
    <figure {...nRoot("quote", { variant, size, nid })} {...rest}>
      <blockquote {...nPart("quote", "text")}>{children}</blockquote>
      {cite ? (
        <figcaption {...nPart("quote", "cite")}>
          {avatar ? <span {...nPart("quote", "avatar")}>{avatar}</span> : null}
          {cite}
        </figcaption>
      ) : null}
    </figure>
  );
}
