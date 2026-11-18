"use client";

import * as RAccordion from "@radix-ui/react-accordion";
import * as RMenu from "@radix-ui/react-dropdown-menu";
import * as RTabs from "@radix-ui/react-tabs";
import NextLink from "next/link";
import { Fragment, useRef, useState, type ReactNode } from "react";
import { nPart, nRoot, type NProps } from "@/engine/react";
import { IconButton } from "./button";
import { Icon, type IconName } from "./icon";
import { useIndicator } from "./use-indicator";

/* ---------------- Tabs ---------------- */

export interface TabItem {
  value: string;
  label: ReactNode;
  content: ReactNode;
  disabled?: boolean;
  icon?: IconName;
}

export interface TabsProps extends NProps {
  items: TabItem[];
  label: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (v: string) => void;
}

/** Tabs — Radix roving focus (←/→, Home/End). Indicator motion comes from rules. */
export function Tabs({ variant = "line", size = "md", nid, items, label, value, defaultValue, onValueChange }: TabsProps) {
  const [inner, setInner] = useState(defaultValue ?? items[0]?.value);
  const cur = value ?? inner;
  const list = useRef<HTMLDivElement>(null);
  const ind = useIndicator(list, '[data-state="active"]', [cur, items.length]);
  return (
    <RTabs.Root
      value={cur}
      onValueChange={(v) => {
        if (value === undefined) setInner(v);
        onValueChange?.(v);
      }}
      {...nRoot("tabs", { variant, size, nid })}
    >
      <RTabs.List ref={list} aria-label={label} {...nPart("tabs", "list")}>
        <span {...nPart("tabs", "indicator")} style={ind} aria-hidden />
        {items.map((t) => (
          <RTabs.Trigger key={t.value} value={t.value} disabled={t.disabled} {...nPart("tabs", "trigger")}>
            {t.icon ? <Icon name={t.icon} /> : null}
            {t.label}
          </RTabs.Trigger>
        ))}
      </RTabs.List>
      {items.map((t) => (
        <RTabs.Content key={t.value} value={t.value} {...nPart("tabs", "panel")}>
          {t.content}
        </RTabs.Content>
      ))}
    </RTabs.Root>
  );
}

/* ---------------- Accordion ---------------- */

export interface AccordionItem {
  value: string;
  title: ReactNode;
  content: ReactNode;
}

export function Accordion({ variant = "plain", nid, items, multiple, defaultValue }: NProps & { items: AccordionItem[]; multiple?: boolean; defaultValue?: string }) {
  const body = items.map((it) => (
    <RAccordion.Item key={it.value} value={it.value} {...nPart("accordion", "item")}>
      <RAccordion.Header style={{ margin: 0 }}>
        <RAccordion.Trigger {...nPart("accordion", "trigger")}>
          {it.title}
          <Icon name="chevron-down" {...nPart("accordion", "icon")} />
        </RAccordion.Trigger>
      </RAccordion.Header>
      <RAccordion.Content {...nPart("accordion", "content")}>
        <div {...nPart("accordion", "inner")}>{it.content}</div>
      </RAccordion.Content>
    </RAccordion.Item>
  ));
  const attrs = nRoot("accordion", { variant, nid });
  return multiple ? (
    <RAccordion.Root type="multiple" defaultValue={defaultValue ? [defaultValue] : undefined} {...attrs}>
      {body}
    </RAccordion.Root>
  ) : (
    <RAccordion.Root type="single" collapsible defaultValue={defaultValue} {...attrs}>
      {body}
    </RAccordion.Root>
  );
}

/* ---------------- Breadcrumb ---------------- */

export function Breadcrumb({ variant = "default", nid, items }: NProps & { items: Array<{ label: string; href?: string }> }) {
  return (
    <nav aria-label="Breadcrumb" {...nRoot("breadcrumb", { variant, nid })}>
      <ol {...nPart("breadcrumb", "list")}>
        {items.map((it, i) => {
          const last = i === items.length - 1;
          return (
            <li key={it.label} {...nPart("breadcrumb", "item")}>
              {last || !it.href ? (
                <span aria-current={last ? "page" : undefined} {...nPart("breadcrumb", "current")}>
                  {it.label}
                </span>
              ) : (
                <NextLink href={it.href} {...nPart("breadcrumb", "link")}>
                  {it.label}
                </NextLink>
              )}
              {!last ? <Icon name="chevron-right" {...nPart("breadcrumb", "separator")} /> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* ---------------- Pagination ---------------- */

export function Pagination({ variant = "default", size = "md", nid, page, total, onPageChange, summary }: NProps & { page: number; total: number; onPageChange: (p: number) => void; summary?: ReactNode }) {
  const pages: Array<number | "…"> = [];
  for (let p = 1; p <= total; p++) {
    if (p === 1 || p === total || Math.abs(p - page) <= 1) pages.push(p);
    else if (pages.at(-1) !== "…") pages.push("…");
  }
  return (
    <nav aria-label="Pagination" {...nRoot("pagination", { variant, size, nid })}>
      {summary ? <span {...nPart("pagination", "summary")}>{summary}</span> : null}
      <ul {...nPart("pagination", "list")}>
        <li>
          <button type="button" aria-label="Previous page" disabled={page <= 1} onClick={() => onPageChange(page - 1)} {...nPart("pagination", "page", { disabled: page <= 1 })}>
            <Icon name="chevron-left" />
          </button>
        </li>
        {pages.map((p, i) => (
          <li key={i}>
            {p === "…" ? (
              <span {...nPart("pagination", "ellipsis")}>…</span>
            ) : (
              <button type="button" aria-current={p === page ? "page" : undefined} onClick={() => onPageChange(p)} {...nPart("pagination", "page", { current: p === page })}>
                {p}
              </button>
            )}
          </li>
        ))}
        <li>
          <button type="button" aria-label="Next page" disabled={page >= total} onClick={() => onPageChange(page + 1)} {...nPart("pagination", "page", { disabled: page >= total })}>
            <Icon name="chevron-right" />
          </button>
        </li>
      </ul>
    </nav>
  );
}

/* ---------------- Navbar ---------------- */

export interface NavLink {
  label: string;
  href: string;
  current?: boolean;
}

export function Navbar({ variant = "plain", nid, brand, links, actions }: NProps & { brand: ReactNode; links: NavLink[]; actions?: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <header {...nRoot("navbar", { variant, nid }, {}, { open })}>
      <div {...nPart("navbar", "inner")}>
        <NextLink href={links[0]?.href ?? "/"} {...nPart("navbar", "brand")}>
          {brand}
        </NextLink>
        <nav aria-label="Main" {...nPart("navbar", "nav")}>
          {links.map((l) => (
            <NextLink key={l.href + l.label} href={l.href} aria-current={l.current ? "page" : undefined} {...nPart("navbar", "link", { current: l.current })}>
              {l.label}
            </NextLink>
          ))}
        </nav>
        <div {...nPart("navbar", "actions")}>
          {actions}
          <span {...nPart("navbar", "toggle")}>
            <IconButton icon={open ? "x" : "menu"} label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen(!open)} />
          </span>
        </div>
      </div>
      <nav aria-label="Mobile" {...nPart("navbar", "mobile")} hidden={!open}>
        {links.map((l) => (
          <NextLink key={l.href + l.label} href={l.href} onClick={() => setOpen(false)} {...nPart("navbar", "link", { current: l.current })}>
            {l.label}
          </NextLink>
        ))}
      </nav>
    </header>
  );
}

/* ---------------- Sidebar ---------------- */

export interface SidebarItem {
  label: string;
  href: string;
  icon?: IconName;
  count?: string | number;
  current?: boolean;
}

export function Sidebar({ variant = "sunken", nid, header, sections, footer, label = "App" }: NProps & { header?: ReactNode; sections: Array<{ label?: string; items: SidebarItem[] }>; footer?: ReactNode; label?: string }) {
  return (
    <aside aria-label={label} {...nRoot("sidebar", { variant, nid })}>
      {header ? <div {...nPart("sidebar", "header")}>{header}</div> : null}
      <nav aria-label={`${label} navigation`} style={{ display: "contents" }}>
        {sections.map((s, i) => (
          <div key={i} {...nPart("sidebar", "section")}>
            {s.label ? <span {...nPart("sidebar", "sectionLabel")}>{s.label}</span> : null}
            {s.items.map((it) => (
              <NextLink key={it.label} href={it.href} aria-current={it.current ? "page" : undefined} {...nPart("sidebar", "item", { current: it.current })}>
                {it.icon ? <Icon name={it.icon} {...nPart("sidebar", "itemIcon")} /> : null}
                {it.label}
                {it.count !== undefined ? <span {...nPart("sidebar", "count")}>{it.count}</span> : null}
              </NextLink>
            ))}
          </div>
        ))}
      </nav>
      {footer ? <div {...nPart("sidebar", "footer")}>{footer}</div> : null}
    </aside>
  );
}

/* ---------------- Dropdown menu ---------------- */

export type MenuEntry =
  | { type?: "item"; label: string; icon?: IconName; shortcut?: string; onSelect?: () => void; disabled?: boolean }
  | { type: "separator" }
  | { type: "label"; label: string };

export function Dropdown({ trigger, items, nid, align = "end" }: NProps & { trigger: ReactNode; items: MenuEntry[]; align?: "start" | "end" | "center" }) {
  return (
    <RMenu.Root>
      <RMenu.Trigger asChild>{trigger}</RMenu.Trigger>
      <RMenu.Portal>
        <RMenu.Content align={align} sideOffset={6} {...nRoot("dropdown", { nid }, { variant: "default" })}>
          <div {...nPart("dropdown", "content")}>
            {items.map((it, i) =>
              it.type === "separator" ? (
                <RMenu.Separator key={i} {...nPart("dropdown", "separator")} />
              ) : it.type === "label" ? (
                <RMenu.Label key={i} {...nPart("dropdown", "label")}>
                  {it.label}
                </RMenu.Label>
              ) : (
                <RMenu.Item key={i} disabled={it.disabled} onSelect={it.onSelect} {...nPart("dropdown", "item")}>
                  {it.icon ? <Icon name={it.icon} {...nPart("dropdown", "icon")} /> : null}
                  {it.label}
                  {it.shortcut ? <span {...nPart("dropdown", "shortcut")}>{it.shortcut}</span> : null}
                </RMenu.Item>
              ),
            )}
          </div>
        </RMenu.Content>
      </RMenu.Portal>
    </RMenu.Root>
  );
}

/* ---------------- Stepper ---------------- */

export function Stepper({ variant = "horizontal", nid, steps, current }: NProps & { steps: Array<{ label: string; description?: string }>; current: number }) {
  return (
    <ol {...nRoot("stepper", { variant, nid })} aria-label="Progress">
      {steps.map((s, i) => {
        const done = i < current;
        const now = i === current;
        const st = { selected: done, current: now };
        return (
          <Fragment key={s.label}>
            <li {...nPart("stepper", "step", st)} aria-current={now ? "step" : undefined}>
              <span {...nPart("stepper", "indicator", st)}>{done ? <Icon name="check" /> : i + 1}</span>
              <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                <span {...nPart("stepper", "label")}>{s.label}</span>
                {s.description ? <span {...nPart("stepper", "description")}>{s.description}</span> : null}
              </span>
            </li>
            {i < steps.length - 1 ? <li aria-hidden {...nPart("stepper", "connector", { selected: done })} /> : null}
          </Fragment>
        );
      })}
    </ol>
  );
}
