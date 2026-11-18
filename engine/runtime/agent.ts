"use client";

import { applyMode, applySystem } from "./apply";
import type { FromCanvas, PickedTarget, ToCanvas } from "./channel";
import { replay } from "./motion";

/* ------------------------------------------------------------------ *
 * Preview agent — runs inside a Studio canvas iframe. Applies systems
 * sent by the Studio, implements inspect mode, force-state and
 * highlighting, and reports instances back.
 * ------------------------------------------------------------------ */

let inspectOn = false;
let hoverBox: HTMLDivElement | null = null;
let selBox: HTMLDivElement | null = null;
let forced: HTMLElement[] = [];
let lastPath = "";

const post = (msg: FromCanvas) => window.parent.postMessage(msg, location.origin);

function box(color: string, dashed = false): HTMLDivElement {
  const d = document.createElement("div");
  d.setAttribute("aria-hidden", "true");
  Object.assign(d.style, {
    position: "fixed",
    pointerEvents: "none",
    zIndex: "2147483600",
    border: `1.5px ${dashed ? "dashed" : "solid"} ${color}`,
    borderRadius: "2px",
    transition: "all 80ms ease-out",
    display: "none",
    boxShadow: `0 0 0 9999px transparent`,
  });
  const tag = document.createElement("span");
  Object.assign(tag.style, {
    position: "absolute",
    left: "-1.5px",
    bottom: "100%",
    background: color,
    color: "#fff",
    font: "500 10px/1.6 ui-monospace, monospace",
    padding: "0 5px",
    whiteSpace: "nowrap",
    borderRadius: "2px 2px 0 0",
  });
  d.appendChild(tag);
  document.body.appendChild(d);
  return d;
}

function place(b: HTMLDivElement, el: Element | null, label = "") {
  if (!el) {
    b.style.display = "none";
    return;
  }
  const r = el.getBoundingClientRect();
  Object.assign(b.style, { display: "block", left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
  (b.firstChild as HTMLSpanElement).textContent = label;
  (b.firstChild as HTMLSpanElement).style.bottom = r.top < 18 ? "auto" : "100%";
  (b.firstChild as HTMLSpanElement).style.top = r.top < 18 ? "100%" : "auto";
}

/** Resolve the Normy target for any DOM element. */
export function targetOf(start: Element | null): { el: HTMLElement; target: PickedTarget } | null {
  let node = start;
  while (node && node !== document.body) {
    if (node instanceof HTMLElement || node instanceof SVGElement) {
      const part = node.getAttribute("data-n-part");
      const comp = node.getAttribute("data-n");
      if (part) {
        const [c, p] = part.split(".");
        const root = node.closest(`[data-n="${c}"]`);
        if (root) return { el: node as HTMLElement, target: info(root, c, p) };
      }
      if (comp) return { el: node as HTMLElement, target: info(node, comp) };
    }
    node = node.parentElement;
  }
  return null;
}

function info(root: Element, component: string, part?: string): PickedTarget {
  const variant = root.getAttribute("data-n-variant") ?? undefined;
  const size = root.getAttribute("data-n-size") ?? undefined;
  const instance = root.getAttribute("data-n-id") ?? undefined;
  const label = `${component}${variant ? `·${variant}` : ""}${part ? ` › ${part}` : ""}${instance ? ` #${instance}` : ""}`;
  return { component, variant, size, part, instance, label };
}

function onMove(e: PointerEvent) {
  if (!inspectOn) return;
  const t = targetOf(e.target as Element);
  hoverBox ??= box("#2f6fed", true);
  place(hoverBox, t?.el ?? null, t?.target.label);
}

function onClick(e: MouseEvent) {
  if (!inspectOn) return;
  e.preventDefault();
  e.stopPropagation();
  const t = targetOf(e.target as Element);
  if (!t) return;
  selBox ??= box("#e8492b");
  place(selBox, t.el, t.target.label);
  post({ type: "picked", target: t.target });
}

function sendInstances() {
  const list: Array<{ id: string; component: string; variant?: string }> = [];
  document.querySelectorAll<HTMLElement>("[data-n-id]").forEach((el) => {
    const id = el.getAttribute("data-n-id")!;
    if (!list.some((x) => x.id === id)) list.push({ id, component: el.getAttribute("data-n") ?? "?", variant: el.getAttribute("data-n-variant") ?? undefined });
  });
  const components: Record<string, string[]> = {};
  document.querySelectorAll<HTMLElement>("[data-n]").forEach((el) => {
    const c = el.getAttribute("data-n")!;
    const v = el.getAttribute("data-n-variant");
    components[c] ??= [];
    if (v && !components[c].includes(v)) components[c].push(v);
  });
  post({ type: "instances", path: location.pathname, list, components });
}

function applyForce(msg: Extract<ToCanvas, { type: "force" }>) {
  forced.forEach((el) => el.removeAttribute("data-n-force"));
  forced = [];
  if (!msg.target || !msg.states.length) return;
  const sel = msg.target.instance ? `[data-n-id="${CSS.escape(msg.target.instance)}"]` : msg.target.component ? `[data-n="${CSS.escape(msg.target.component)}"]` : "";
  if (!sel) return;
  document.querySelectorAll<HTMLElement>(sel).forEach((el) => {
    el.setAttribute("data-n-force", msg.states.join(" "));
    forced.push(el);
    // also stateful parts inside
    el.querySelectorAll<HTMLElement>("[data-n-part]").forEach((p) => {
      p.setAttribute("data-n-force", msg.states.join(" "));
      forced.push(p);
    });
  });
}

function highlight(t: Extract<ToCanvas, { type: "highlight" }>["target"]) {
  selBox ??= box("#e8492b");
  if (!t) return place(selBox, null);
  let sel = t.instance ? `[data-n-id="${CSS.escape(t.instance)}"]` : t.component ? `[data-n="${CSS.escape(t.component)}"]` : "";
  if (sel && t.part && t.component) sel += ` [data-n-part="${t.component}.${t.part}"]`;
  const el = sel ? document.querySelector(sel) : null;
  if (el) el.scrollIntoView({ block: "nearest", behavior: "smooth" });
  place(selBox, el, t.instance ? `#${t.instance}` : (t.component ?? ""));
}

export function startAgent() {
  if (window.parent === window) return () => {};
  const onMessage = (e: MessageEvent<ToCanvas>) => {
    if (e.origin !== location.origin) return;
    const m = e.data;
    switch (m?.type) {
      case "system":
        applySystem(m.system, { extra: m.extra });
        break;
      case "mode":
        applyMode(m.mode, false);
        break;
      case "inspect":
        inspectOn = m.on;
        document.documentElement.style.cursor = m.on ? "crosshair" : "";
        if (!m.on && hoverBox) place(hoverBox, null);
        break;
      case "force":
        applyForce(m);
        break;
      case "highlight":
        highlight(m.target);
        break;
      case "replay":
        replay();
        break;
      case "scan":
        sendInstances();
        break;
    }
  };
  window.addEventListener("message", onMessage);
  document.addEventListener("pointermove", onMove, true);
  document.addEventListener("click", onClick, true);
  const tick = setInterval(() => {
    if (location.pathname !== lastPath) {
      lastPath = location.pathname;
      post({ type: "ready", path: lastPath });
      setTimeout(sendInstances, 400);
    }
  }, 300);
  const onScroll = () => {
    if (hoverBox) place(hoverBox, null);
    if (selBox) place(selBox, null);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  return () => {
    clearInterval(tick);
    window.removeEventListener("message", onMessage);
    document.removeEventListener("pointermove", onMove, true);
    document.removeEventListener("click", onClick, true);
    window.removeEventListener("scroll", onScroll);
  };
}
