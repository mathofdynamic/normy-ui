import NextLink from "next/link";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { nPart, nRoot, type NProps } from "@/engine/react";
import { Icon, type IconName } from "./icon";
import { Spinner } from "./display";

export interface ButtonProps extends NProps, ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "solid" | "soft" | "outline" | "ghost" | "ink" | "link" | "danger" | (string & {});
  size?: "xs" | "sm" | "md" | "lg" | (string & {});
  loading?: boolean;
  /** Icon before the label. */
  icon?: IconName;
  /** Icon after the label. */
  iconEnd?: IconName;
  leading?: ReactNode;
  trailing?: ReactNode;
  /** Render as a link (keeps button styling). */
  href?: string;
}

/**
 * Button — native <button> (Enter/Space). Loading keeps the label in the DOM
 * (accessible name preserved, width stable) and sets aria-busy.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "solid", size = "md", nid, loading, icon, iconEnd, leading, trailing, href, disabled, children, type = "button", onClick, ...rest },
  ref,
) {
  const attrs = nRoot("button", { variant, size, nid }, {}, { disabled, loading });
  const inner = (
    <>
      <span {...nPart("button", "label")}>
        {leading}
        {icon ? <Icon name={icon} {...nPart("button", "icon")} /> : null}
        {children}
        {iconEnd ? <Icon name={iconEnd} {...nPart("button", "icon")} /> : null}
        {trailing}
      </span>
      {loading ? (
        <span {...nPart("button", "spinner")}>
          <Spinner label="Loading" />
        </span>
      ) : null}
    </>
  );
  if (href) {
    return (
      <NextLink href={href} {...attrs} aria-disabled={disabled || undefined} className={rest.className}>
        {inner}
      </NextLink>
    );
  }
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      aria-busy={loading || undefined}
      onClick={loading ? undefined : onClick}
      {...attrs}
      {...rest}
    >
      {inner}
    </button>
  );
});

export interface IconButtonProps extends NProps, ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconName;
  /** Required accessible name. */
  label: string;
  variant?: "ghost" | "solid" | "soft" | "outline" | (string & {});
  size?: "sm" | "md" | "lg" | (string & {});
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon, label, variant = "ghost", size = "md", nid, disabled, type = "button", ...rest },
  ref,
) {
  return (
    <button ref={ref} type={type} aria-label={label} title={label} disabled={disabled} {...nRoot("iconButton", { variant, size, nid }, {}, { disabled })} {...rest}>
      <Icon name={icon} {...nPart("iconButton", "icon")} />
    </button>
  );
});
