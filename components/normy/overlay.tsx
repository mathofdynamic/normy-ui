"use client";

import * as RDialog from "@radix-ui/react-dialog";
import * as RPopover from "@radix-ui/react-popover";
import * as RTooltip from "@radix-ui/react-tooltip";
import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactElement, type ReactNode } from "react";
import { nPart, nRoot, type NProps } from "@/engine/react";
import { Button, IconButton } from "./button";
import { Icon, type IconName } from "./icon";
import { Kbd } from "./typography";

/* ---------------- Tooltip ---------------- */

export function TooltipProvider({ children }: { children: ReactNode }) {
  return (
    <RTooltip.Provider delayDuration={350} skipDelayDuration={250}>
      {children}
    </RTooltip.Provider>
  );
}

export interface TooltipProps extends NProps {
  content: ReactNode;
  children: ReactElement;
  side?: "top" | "right" | "bottom" | "left";
  shortcut?: string;
}

/** Tooltip — hover AND focus; Escape closes. Never put essential info here. */
export function Tooltip({ content, children, side = "top", shortcut, variant = "inverse", nid }: TooltipProps) {
  return (
    <RTooltip.Root>
      <RTooltip.Trigger asChild>{children}</RTooltip.Trigger>
      <RTooltip.Portal>
        <RTooltip.Content side={side} sideOffset={8} collisionPadding={12} {...nRoot("tooltip", { variant, nid })}>
          {content}
          {shortcut ? <span {...nPart("tooltip", "shortcut")}>{shortcut}</span> : null}
          <RTooltip.Arrow width={10} height={5} {...nPart("tooltip", "arrow")} />
        </RTooltip.Content>
      </RTooltip.Portal>
    </RTooltip.Root>
  );
}

/* ---------------- Popover ---------------- */

export function Popover({ trigger, title, children, variant = "default", size = "md", nid, side = "bottom" }: NProps & { trigger: ReactElement; title?: ReactNode; children: ReactNode; side?: "top" | "right" | "bottom" | "left" }) {
  return (
    <RPopover.Root>
      <RPopover.Trigger asChild>{trigger}</RPopover.Trigger>
      <RPopover.Portal>
        <RPopover.Content side={side} sideOffset={8} collisionPadding={12} {...nRoot("popover", { variant, size, nid })}>
          {title ? <div {...nPart("popover", "title")}>{title}</div> : null}
          {children}
          <RPopover.Close asChild>
            <span {...nPart("popover", "close")}>
              <IconButton icon="x" label="Close" size="sm" />
            </span>
          </RPopover.Close>
          <RPopover.Arrow width={12} height={6} {...nPart("popover", "arrow")} />
        </RPopover.Content>
      </RPopover.Portal>
    </RPopover.Root>
  );
}

/* ---------------- Dialog ---------------- */

/**
 * The portal is force-mounted so our root wrapper (which carries data-n for the part selectors) never
 * decides when to unmount. Radix passes the portal's forceMount down to Overlay and Content, so they
 * opt back out here: each keeps its own presence and plays its close animation before unmounting.
 */
const ownPresence = { forceMount: false as unknown as true };

export const Dialog = RDialog.Root;
export const DialogTrigger = RDialog.Trigger;
export const DialogClose = RDialog.Close;

export interface DialogContentProps extends NProps {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
}

/** Dialog — focus trapped and restored, Escape closes, page made inert (Radix). */
export function DialogContent({ title, description, eyebrow, footer, children, variant = "default", size = "md", nid }: DialogContentProps) {
  return (
    <RDialog.Portal forceMount>
      <div {...nRoot("dialog", { variant, size, nid })}>
      <RDialog.Overlay {...ownPresence} {...nPart("dialog", "overlay")} />
      <RDialog.Content {...ownPresence} {...nPart("dialog", "panel")} aria-describedby={description ? undefined : undefined}>
        <div {...nPart("dialog", "header")}>
          <div>
            {eyebrow ? <span {...nPart("dialog", "eyebrow")}>{eyebrow}</span> : null}
            <RDialog.Title {...nPart("dialog", "title")}>{title}</RDialog.Title>
            {description ? <RDialog.Description {...nPart("dialog", "description")}>{description}</RDialog.Description> : null}
          </div>
          <RDialog.Close asChild>
            <span {...nPart("dialog", "close")}>
              <IconButton icon="x" label="Close" size="sm" />
            </span>
          </RDialog.Close>
        </div>
        {children ? <div {...nPart("dialog", "body")}>{children}</div> : null}
        {footer ? <div {...nPart("dialog", "footer")}>{footer}</div> : <div style={{ height: "var(--n-space-4)" }} />}
      </RDialog.Content>
      </div>
    </RDialog.Portal>
  );
}

/* ---------------- Drawer ---------------- */

export interface DrawerProps extends NProps {
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
  trigger?: ReactElement;
  title: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
  variant?: "right" | "left" | "bottom" | (string & {});
}

export function Drawer({ open, onOpenChange, trigger, title, description, footer, children, variant = "right", size = "md", nid }: DrawerProps) {
  return (
    <RDialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger ? <RDialog.Trigger asChild>{trigger}</RDialog.Trigger> : null}
      <RDialog.Portal forceMount>
        <div {...nRoot("drawer", { variant, size, nid })}>
        <RDialog.Overlay {...ownPresence} {...nPart("drawer", "overlay")} />
        <RDialog.Content {...ownPresence} {...nPart("drawer", "panel")} aria-describedby={undefined}>
          <div {...nPart("drawer", "header")}>
            <div>
              <RDialog.Title {...nPart("drawer", "title")}>{title}</RDialog.Title>
              {description ? <RDialog.Description {...nPart("drawer", "description")}>{description}</RDialog.Description> : null}
            </div>
            <RDialog.Close asChild>
              <span {...nPart("drawer", "close")}>
                <IconButton icon="x" label="Close" size="sm" />
              </span>
            </RDialog.Close>
          </div>
          <div {...nPart("drawer", "body")}>{children}</div>
          {footer ? <div {...nPart("drawer", "footer")}>{footer}</div> : null}
        </RDialog.Content>
        </div>
      </RDialog.Portal>
    </RDialog.Root>
  );
}

/* ---------------- Toast ---------------- */

export interface ToastData {
  id?: string;
  title: ReactNode;
  description?: ReactNode;
  variant?: "neutral" | "success" | "warning" | "danger" | "info";
  icon?: IconName;
  action?: { label: string; onClick: () => void };
}

const ToastCtx = createContext<(t: ToastData) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

const TOAST_ICON: Record<string, IconName> = { neutral: "bell", success: "check-circle", warning: "alert-triangle", danger: "alert-circle", info: "info" };

/** Toaster — provides useToast(); renders an aria-live region. Duration comes from the toastDuration behaviour prop. */
export function Toaster({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Array<ToastData & { id: string; closing?: boolean }>>([]);
  const vp = useRef<HTMLOListElement>(null);
  const drop = useCallback((id: string) => setItems((xs) => xs.filter((x) => x.id !== id)), []);
  // Closing plays the (faster) close animation first; a timer guarantees removal even without animationend.
  const remove = useCallback(
    (id: string) => {
      setItems((xs) => xs.map((x) => (x.id === id ? { ...x, closing: true } : x)));
      setTimeout(() => drop(id), 700);
    },
    [drop],
  );
  const push = useCallback(
    (t: ToastData) => {
      const id = t.id ?? Math.random().toString(36).slice(2);
      setItems((xs) => [...xs.slice(-3), { ...t, id }]);
      const raw = vp.current ? getComputedStyle(vp.current).getPropertyValue("--n-b-toastDuration") : "";
      const ms = parseFloat(raw) || 5000;
      setTimeout(() => remove(id), ms);
    },
    [remove],
  );
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <ol ref={vp} aria-live="polite" aria-label="Notifications" {...nRoot("toaster", {}, { variant: "bottom-right" })}>
        {items.map((t) => (
          <li key={t.id} {...nRoot("toast", { variant: t.variant ?? "neutral" })} data-state={t.closing ? "closed" : "open"} onAnimationEnd={(e) => t.closing && e.target === e.currentTarget && drop(t.id)}>
            <Icon name={t.icon ?? TOAST_ICON[t.variant ?? "neutral"]} {...nPart("toast", "icon")} />
            <div {...nPart("toast", "content")}>
              <span {...nPart("toast", "title")}>{t.title}</span>
              {t.description ? <span {...nPart("toast", "description")}>{t.description}</span> : null}
            </div>
            {t.action ? (
              <span {...nPart("toast", "action")}>
                <Button size="sm" variant="outline" onClick={t.action.onClick}>
                  {t.action.label}
                </Button>
              </span>
            ) : null}
            <span {...nPart("toast", "close")}>
              <IconButton icon="x" label="Dismiss" size="sm" onClick={() => remove(t.id)} />
            </span>
          </li>
        ))}
      </ol>
    </ToastCtx.Provider>
  );
}

/* ---------------- Command palette ---------------- */

export interface CommandItem {
  id: string;
  label: string;
  group?: string;
  hint?: string;
  icon?: IconName;
  keywords?: string[];
  shortcut?: string[];
  onSelect: () => void;
}

export interface CommandPaletteProps extends NProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  items: CommandItem[];
  placeholder?: string;
  label?: string;
}

function matches(item: CommandItem, q: string) {
  if (!q) return true;
  const hay = [item.label, item.group ?? "", ...(item.keywords ?? [])].join(" ").toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((t) => hay.includes(t));
}

/** CommandPalette — ARIA combobox: focus stays in input, ↑/↓ move, Enter runs, Esc closes. */
export function CommandPalette({ open, onOpenChange, items, placeholder = "Type a command…", label = "Command palette", nid }: CommandPaletteProps) {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const listId = useId();
  const list = useRef<HTMLDivElement>(null);
  const filtered = useMemo(() => items.filter((i) => matches(i, q)), [items, q]);
  const groups = useMemo(() => {
    const m = new Map<string, Array<{ item: CommandItem; index: number }>>();
    filtered.forEach((item, index) => m.set(item.group ?? "", [...(m.get(item.group ?? "") ?? []), { item, index }]));
    return [...m.entries()];
  }, [filtered]);
  const cur = filtered[Math.min(active, filtered.length - 1)];

  useEffect(() => {
    if (cur) list.current?.querySelector(`[data-cmd="${CSS.escape(cur.id)}"]`)?.scrollIntoView({ block: "nearest" });
  }, [cur]);

  const close = (o: boolean) => {
    if (!o) {
      setQ("");
      setActive(0);
    }
    onOpenChange(o);
  };
  const run = (i: CommandItem) => {
    close(false);
    i.onSelect();
  };
  const onKey = (e: KeyboardEvent) => {
    if (!filtered.length) return;
    const last = filtered.length - 1;
    const c = Math.min(active, last);
    if (e.key === "ArrowDown") setActive(c === last ? 0 : c + 1);
    else if (e.key === "ArrowUp") setActive(c === 0 ? last : c - 1);
    else if (e.key === "Enter" && cur) run(cur);
    else return;
    e.preventDefault();
  };
  const term = q.trim().split(/\s+/)[0]?.toLowerCase();
  const hl = (t: string) => {
    const at = term ? t.toLowerCase().indexOf(term) : -1;
    if (!term || at < 0) return t;
    return (
      <>
        {t.slice(0, at)}
        <mark {...nPart("commandPalette", "mark")}>{t.slice(at, at + term.length)}</mark>
        {t.slice(at + term.length)}
      </>
    );
  };

  return (
    <RDialog.Root open={open} onOpenChange={close}>
      <RDialog.Portal forceMount>
        <div {...nRoot("commandPalette", { nid }, { variant: "default" })}>
        <RDialog.Overlay {...ownPresence} {...nPart("commandPalette", "overlay")} />
        <RDialog.Content {...ownPresence} {...nPart("commandPalette", "panel")} aria-describedby={undefined}>
          <RDialog.Title style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>{label}</RDialog.Title>
          <div {...nPart("commandPalette", "search")}>
            <Icon name="search" />
            <input
              autoFocus
              role="combobox"
              aria-expanded
              aria-controls={listId}
              aria-activedescendant={cur ? `${listId}-${cur.id}` : undefined}
              aria-label={label}
              value={q}
              placeholder={placeholder}
              onChange={(e) => {
                setQ(e.target.value);
                setActive(0);
              }}
              onKeyDown={onKey}
              {...nPart("commandPalette", "input")}
            />
            <Kbd>esc</Kbd>
          </div>
          <div ref={list} id={listId} role="listbox" aria-label={label} {...nPart("commandPalette", "list")}>
            {filtered.length === 0 ? <p {...nPart("commandPalette", "empty")}>Nothing matches that.</p> : null}
            {groups.map(([g, entries]) => (
              <div key={g || "_"} role="group" aria-label={g || undefined}>
                {g ? (
                  <div aria-hidden {...nPart("commandPalette", "group")}>
                    {g}
                  </div>
                ) : null}
                {entries.map(({ item, index }) => (
                  <div
                    key={item.id}
                    id={`${listId}-${item.id}`}
                    data-cmd={item.id}
                    role="option"
                    aria-selected={cur?.id === item.id}
                    onPointerMove={() => setActive(index)}
                    onClick={() => run(item)}
                    {...nPart("commandPalette", "item", { selected: cur?.id === item.id })}
                  >
                    {item.icon ? <Icon name={item.icon} {...nPart("commandPalette", "itemIcon")} /> : null}
                    <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{hl(item.label)}</span>
                    {item.hint ? <span {...nPart("commandPalette", "hint")}>{item.hint}</span> : null}
                    {item.shortcut ? (
                      <span style={{ display: "flex", gap: "var(--n-space-1)" }}>
                        {item.shortcut.map((k) => (
                          <Kbd key={k}>{k}</Kbd>
                        ))}
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div {...nPart("commandPalette", "footer")}>
            <span>↑↓ move</span>
            <span>↵ run</span>
            <span style={{ marginLeft: "auto" }}>
              {filtered.length} / {items.length}
            </span>
          </div>
        </RDialog.Content>
        </div>
      </RDialog.Portal>
    </RDialog.Root>
  );
}

/** ⌘K / Ctrl+K toggles. */
export function useCommandShortcut(toggle: () => void, key = "k") {
  const ref = useRef(toggle);
  useEffect(() => {
    ref.current = toggle;
  });
  useEffect(() => {
    const on = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === key) {
        e.preventDefault();
        ref.current();
      }
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [key]);
}
