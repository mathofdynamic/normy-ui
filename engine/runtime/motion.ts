"use client";

import { currentResult, motionReduced, motionSpeed, onApply } from "./apply";

/* ------------------------------------------------------------------ *
 * Motion runtime. Reads motion config from CSS custom properties that
 * the compiled rules set (same cascade as everything else) and runs:
 *  - entrance animations (batched, staggered, in-view / load, once/every)
 *  - interaction fx (magnetic, tilt+glare, ripple, spotlight, cursor, parallax, press)
 *  - scroll-linked effects (parallax, fade, reveal, scale, rotate, blur, progress, velocity-skew)
 *  - behaviours (typewriter, count-up)
 * ------------------------------------------------------------------ */

/* Bookkeeping lives in JS (never in DOM attributes) so streamed hydration never sees mutations. */
let entered = new WeakSet<Element>();
const tracked = new Set<HTMLElement>();
const typed = new WeakMap<HTMLElement, string>();
let counted = new WeakSet<Element>();

function cssVar(cs: CSSStyleDeclaration, name: string) {
  return cs.getPropertyValue(name).trim();
}

export function parseTime(v: string, fallback: number): number {
  if (!v) return fallback;
  const m = v.match(/(-?[\d.]+)\s*(ms|s)?/);
  if (!m) return fallback;
  const n = parseFloat(m[1]);
  return m[2] === "s" ? n * 1000 : n;
}

const num = (v: string, fb: number) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fb;
};

/* ---------------- entrance ---------------- */

export interface EnterConfig {
  effect: string;
  opacity: number;
  x: string;
  y: string;
  scale: number;
  rotate: number;
  blur: number;
  skew: number;
  clip: string;
  duration: number;
  delay: number;
  easing: string;
  stagger: number;
  from: string;
  trigger: string;
  threshold: number;
  margin: string;
  once: boolean;
}

const PRESETS: Record<string, Partial<EnterConfig>> = {
  fade: { opacity: 0 },
  rise: { opacity: 0, y: "24px" },
  fall: { opacity: 0, y: "-24px" },
  "slide-left": { opacity: 0, x: "40px" },
  "slide-right": { opacity: 0, x: "-40px" },
  zoom: { opacity: 0, scale: 0.92 },
  "zoom-out": { opacity: 0, scale: 1.08 },
  blur: { opacity: 0, blur: 12 },
  flip: { opacity: 0, rotate: -8, y: "16px" },
  swing: { opacity: 0, rotate: 6, x: "-12px" },
  "clip-up": { clip: "up" },
  "clip-down": { clip: "down" },
  "clip-left": { clip: "left" },
  "clip-right": { clip: "right" },
  iris: { clip: "iris", opacity: 0 },
  skew: { opacity: 0, skew: 8, y: "20px" },
  drop: { opacity: 0, y: "-40px", scale: 1.04 },
  custom: {},
};

export function readEnter(el: Element): EnterConfig | null {
  const cs = getComputedStyle(el);
  const effect = cssVar(cs, "--n-enter");
  if (!effect || effect === "none") return null;
  const p = PRESETS[effect] ?? {};
  const v = (name: string) => cssVar(cs, `--n-enter-${name}`);
  return {
    effect,
    opacity: v("opacity") ? num(v("opacity"), 0) : (p.opacity ?? 1),
    x: v("x") || p.x || "0px",
    y: v("y") || p.y || "0px",
    scale: v("scale") ? num(v("scale"), 1) : (p.scale ?? 1),
    rotate: v("rotate") ? num(v("rotate"), 0) : (p.rotate ?? 0),
    blur: v("blur") ? num(v("blur"), 0) : (p.blur ?? 0),
    skew: v("skew") ? num(v("skew"), 0) : (p.skew ?? 0),
    clip: v("clip") || p.clip || "none",
    duration: parseTime(v("duration"), 600),
    delay: parseTime(v("delay"), 0),
    easing: v("easing") || "cubic-bezier(0.22, 1, 0.36, 1)",
    stagger: parseTime(v("stagger"), 60),
    from: v("from") || "first",
    trigger: v("trigger") || "inview",
    threshold: num(v("threshold"), 0.15),
    margin: v("margin") || "0%",
    once: (v("once") || "once") !== "every",
  };
}

const CLIPS: Record<string, string> = {
  up: "inset(100% 0 0 0)",
  down: "inset(0 0 100% 0)",
  left: "inset(0 0 0 100%)",
  right: "inset(0 100% 0 0)",
  iris: "circle(0% at 50% 50%)",
};
const CLIP_END: Record<string, string> = { iris: "circle(150% at 50% 50%)" };

export function enterKeyframes(c: EnterConfig): Keyframe[] {
  const from: Keyframe = {
    opacity: c.opacity,
    transform: `translate(${c.x}, ${c.y}) scale(${c.scale}) rotate(${c.rotate}deg) skewY(${c.skew}deg)`,
  };
  const to: Keyframe = { opacity: 1, transform: "translate(0px, 0px) scale(1) rotate(0deg) skewY(0deg)" };
  if (c.blur) {
    from.filter = `blur(${c.blur}px)`;
    to.filter = "blur(0px)";
  }
  if (c.clip !== "none" && CLIPS[c.clip]) {
    from.clipPath = CLIPS[c.clip];
    to.clipPath = CLIP_END[c.clip] ?? "inset(0 0 0 0)";
  }
  return [from, to];
}

const running = new WeakMap<Element, Animation>();
const holds = new WeakMap<Element, Animation>();

/** Keep an element in its entrance start pose until it is revealed. */
function hold(el: HTMLElement, c: EnterConfig) {
  if (motionReduced() || holds.has(el)) return;
  try {
    const from = enterKeyframes(c)[0];
    holds.set(el, el.animate([from, from], { duration: 1, fill: "forwards" }));
  } catch {
    /* ignore */
  }
}
function release(el: Element) {
  holds.get(el)?.cancel();
  holds.delete(el);
}

export function playEnter(el: HTMLElement, c: EnterConfig, extraDelay = 0) {
  entered.add(el);
  tracked.add(el);
  if (motionReduced()) return release(el);
  const speed = motionSpeed();
  running.get(el)?.cancel();
  try {
    const a = el.animate(enterKeyframes(c), {
      duration: c.duration / speed,
      delay: (c.delay + extraDelay) / speed,
      easing: c.easing,
      fill: "backwards",
    });
    running.set(el, a);
    release(el); // the entrance animation's backwards fill now holds the start pose
    a.onfinish = () => running.delete(el);
  } catch {
    release(el);
  }
}

/** Stagger order index for an element within its batch. */
function staggerIndex(i: number, n: number, from: string) {
  if (from === "last") return n - 1 - i;
  if (from === "center") return Math.abs(i - (n - 1) / 2);
  if (from === "random") return Math.floor(((i * 9301 + 49297) % 233280) / 233280 * n);
  return i;
}

/* ---------------- runtime state ---------------- */

let started = false;
let io: IntersectionObserver[] = [];
let mo: MutationObserver | null = null;
let scanTimer: ReturnType<typeof setTimeout> | null = null;
let batch: Array<{ el: HTMLElement; c: EnterConfig }> = [];
let batchRaf = 0;
let observed = new WeakSet<Element>();
let fxCache = new WeakMap<Element, FxConfig | null>();
let scrollEls: Array<{ el: HTMLElement; effect: string; intensity: number }> = [];
let parallaxEls: Array<{ el: HTMLElement; depth: number }> = [];

function queue(el: HTMLElement, c: EnterConfig) {
  batch.push({ el, c });
  if (!batchRaf) batchRaf = requestAnimationFrame(flush);
}

function flush() {
  batchRaf = 0;
  const groups = new Map<Element | null, typeof batch>();
  for (const item of batch) {
    const key = item.el.parentElement;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  batch = [];
  for (const items of groups.values()) {
    items.sort((a, b) => (a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
    items.forEach((it, i) => playEnter(it.el, it.c, staggerIndex(i, items.length, it.c.from) * it.c.stagger));
  }
}

/**
 * True when the page was already revealed before the runtime started (slow first load, e.g. a
 * dev server compiling). Then elements on screen must not be hidden and re-animated: that reads
 * as the page loading twice. Only content below the fold still animates as it scrolls in.
 */
let lateStart = false;
const onScreen = (el: HTMLElement) => {
  const r = el.getBoundingClientRect();
  return r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
};

function observe(el: HTMLElement, c: EnterConfig) {
  if (observed.has(el)) return;
  observed.add(el);
  if (c.trigger === "none" || (lateStart && (c.trigger === "load" || onScreen(el)))) {
    entered.add(el);
    return;
  }
  if (c.trigger === "load" || motionReduced()) {
    hold(el, c);
    queue(el, c);
    return;
  }
  hold(el, c);
  const obs = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const t = e.target as HTMLElement;
        if (e.isIntersecting) {
          if (c.once && entered.has(t)) continue;
          queue(t, c);
          if (c.once) obs.unobserve(t);
        } else if (!c.once && entered.has(t)) {
          entered.delete(t);
          running.get(t)?.cancel();
          hold(t, c);
        }
      }
    },
    { threshold: Math.min(1, Math.max(0, c.threshold)), rootMargin: `0px 0px ${c.margin.startsWith("-") ? c.margin : `-${c.margin}`} 0px` },
  );
  obs.observe(el);
  io.push(obs);
}

/** Entrance part of a scan only: cheap enough to run synchronously before paint. */
function scanEnter(root: ParentNode) {
  const manifest = currentResult()?.manifest;
  if (!manifest?.enter.length) return;
  let nodes: HTMLElement[];
  try {
    const sel = manifest.enter.join(",");
    nodes = Array.from(root.querySelectorAll<HTMLElement>(sel));
    if (root instanceof HTMLElement && root.matches(sel)) nodes.unshift(root);
  } catch {
    return;
  }
  for (const el of nodes) {
    if (entered.has(el) || observed.has(el)) continue;
    const c = readEnter(el);
    if (c) observe(el, c);
    else entered.add(el);
  }
}

/** Hand over from the boot script's CSS hold to the runtime's per-element holds. */
function releasePre() {
  document.documentElement.removeAttribute("data-n-pre");
}

export function scan(root: ParentNode = document) {
  const manifest = currentResult()?.manifest;
  if (!manifest) return releasePre();
  if (manifest.enter.length) {
    const sel = manifest.enter.join(",");
    let nodes: NodeListOf<HTMLElement>;
    try {
      nodes = root.querySelectorAll<HTMLElement>(sel);
    } catch {
      return;
    }
    nodes.forEach((el) => {
      if (entered.has(el) || observed.has(el)) return;
      const c = readEnter(el);
      if (c) observe(el, c);
      else entered.add(el);
    });
  }
  // scroll + parallax sets
  scrollEls = [];
  parallaxEls = [];
  const sel2 = [...manifest.scroll, ...manifest.fx].join(",");
  if (sel2) {
    try {
      document.querySelectorAll<HTMLElement>(sel2).forEach((el) => {
        const cs = getComputedStyle(el);
        const effect = cssVar(cs, "--n-scroll");
        if (effect && effect !== "none") scrollEls.push({ el, effect, intensity: num(cssVar(cs, "--n-scroll-intensity"), 1) });
        const depth = num(cssVar(cs, "--n-fx-parallax"), 0);
        if (depth) parallaxEls.push({ el, depth });
      });
    } catch {
      /* ignore */
    }
  }
  behaviours(root);
  onScroll();
  releasePre();
}

/** Re-run entrance animations (Studio "Replay", Motion Lab). */
export function replay(root: ParentNode = document) {
  for (const el of tracked) release(el);
  entered = new WeakSet();
  observed = new WeakSet();
  counted = new WeakSet();
  for (const el of tracked) if (!el.isConnected) tracked.delete(el);
  io.forEach((o) => o.disconnect());
  io = [];
  root.querySelectorAll<HTMLElement>('[data-n="text"], [data-n="heading"]').forEach((el) => {
    const orig = typed.get(el);
    if (orig !== undefined) {
      el.textContent = orig;
      typed.delete(el);
    }
  });
  scan(root);
}

/* ---------------- interaction fx ---------------- */

interface FxConfig {
  magnetic: number;
  radius: number;
  tilt: number;
  glare: number;
  ripple: boolean;
  spotlight: boolean;
  spotSize: number;
  cursor: string;
  cursorLabel: string;
  press: number;
}

function readFx(el: Element): FxConfig | null {
  if (fxCache.has(el)) return fxCache.get(el)!;
  const cs = getComputedStyle(el);
  const v = (n: string) => cssVar(cs, `--n-fx-${n}`);
  const c: FxConfig = {
    magnetic: num(v("magnetic"), 0),
    radius: num(v("magnetic-radius"), 80),
    tilt: num(v("tilt"), 0),
    glare: num(v("glare"), 0),
    ripple: v("ripple") === "on",
    spotlight: v("spotlight") === "on",
    spotSize: num(v("spot-size"), 280),
    cursor: v("cursor") || "none",
    cursorLabel: v("cursor-label").replace(/^["']|["']$/g, ""),
    press: num(v("press"), 1),
  };
  const any = c.magnetic || c.tilt || c.ripple || c.spotlight || c.cursor !== "none" || c.press !== 1;
  fxCache.set(el, any ? c : null);
  return any ? c : null;
}

function fxTarget(start: EventTarget | null): { el: HTMLElement; c: FxConfig } | null {
  let node = start instanceof Element ? start : null;
  while (node && node !== document.documentElement) {
    if (node instanceof HTMLElement && (node.hasAttribute("data-n") || node.hasAttribute("data-n-part"))) {
      const c = readFx(node);
      if (c) return { el: node, c };
    }
    node = node.parentElement;
  }
  return null;
}

let cursorEl: HTMLDivElement | null = null;
const cursorPos = { x: 0, y: 0, tx: 0, ty: 0 };
let cursorRaf = 0;
let active: { el: HTMLElement; c: FxConfig } | null = null;

function overlay(el: HTMLElement, key: string): HTMLSpanElement {
  let o = el.querySelector<HTMLSpanElement>(`:scope > [data-n-fx="${key}"]`);
  if (!o) {
    o = document.createElement("span");
    o.dataset.nFx = key;
    Object.assign(o.style, { position: "absolute", inset: "0", borderRadius: "inherit", pointerEvents: "none", zIndex: "1", transition: "opacity 200ms", opacity: "0" });
    if (getComputedStyle(el).position === "static") el.style.position = "relative";
    el.appendChild(o);
  }
  return o;
}

function onMove(e: PointerEvent) {
  if (motionReduced()) return;
  const hit = fxTarget(e.target);
  if (active && (!hit || hit.el !== active.el)) leave(active);
  active = hit;
  // cursor follower
  cursorPos.tx = e.clientX;
  cursorPos.ty = e.clientY;
  if (hit?.c.cursor && hit.c.cursor !== "none") showCursor(hit.c);
  else hideCursor();
  // parallax (global)
  if (parallaxEls.length) {
    const nx = e.clientX / window.innerWidth - 0.5;
    const ny = e.clientY / window.innerHeight - 0.5;
    for (const p of parallaxEls) p.el.style.transform = `translate(${nx * p.depth}px, ${ny * p.depth}px)`;
  }
  if (!hit) return;
  const { el, c } = hit;
  const r = el.getBoundingClientRect();
  const px = e.clientX - r.left;
  const py = e.clientY - r.top;
  const t: string[] = [];
  if (c.magnetic) {
    const dx = px - r.width / 2;
    const dy = py - r.height / 2;
    t.push(`translate(${dx * c.magnetic * 0.4}px, ${dy * c.magnetic * 0.4}px)`);
  }
  if (c.tilt) {
    const rx = (py / r.height - 0.5) * -2 * c.tilt;
    const ry = (px / r.width - 0.5) * 2 * c.tilt;
    t.unshift("perspective(800px)");
    t.push(`rotateX(${rx}deg) rotateY(${ry}deg)`);
    if (c.glare) {
      const g = overlay(el, "glare");
      g.style.opacity = String(c.glare);
      g.style.background = `radial-gradient(circle at ${px}px ${py}px, rgb(255 255 255 / 0.45), transparent 55%)`;
      g.style.mixBlendMode = "soft-light";
    }
  }
  if (t.length) {
    el.style.transition = "transform 120ms ease-out";
    el.style.transform = t.join(" ");
  }
  if (c.spotlight) {
    const s = overlay(el, "spot");
    s.style.opacity = "1";
    s.style.background = `radial-gradient(${c.spotSize}px circle at ${px}px ${py}px, var(--n-fx-spot-color, color-mix(in oklch, var(--n-color-accent) 22%, transparent)), transparent 70%)`;
  }
}

function leave(h: { el: HTMLElement; c: FxConfig }) {
  if (h.c.magnetic || h.c.tilt) {
    h.el.style.transition = "transform 420ms cubic-bezier(.22,1,.36,1)";
    h.el.style.transform = "";
  }
  h.el.querySelectorAll<HTMLElement>(":scope > [data-n-fx]").forEach((o) => (o.style.opacity = "0"));
}

function onDown(e: PointerEvent) {
  const hit = fxTarget(e.target);
  if (!hit) return;
  const { el, c } = hit;
  if (c.press !== 1 && !motionReduced()) {
    el.style.scale = String(c.press);
    const up = () => {
      el.style.scale = "";
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointerup", up);
  }
  if (c.ripple && !motionReduced()) {
    const r = el.getBoundingClientRect();
    const size = Math.max(r.width, r.height) * 2.2;
    const span = document.createElement("span");
    span.setAttribute("data-n-ripple", "");
    Object.assign(span.style, { width: `${size}px`, height: `${size}px`, left: `${e.clientX - r.left - size / 2}px`, top: `${e.clientY - r.top - size / 2}px` });
    const cs = getComputedStyle(el);
    if (cs.position === "static") el.style.position = "relative";
    if (cs.overflow !== "hidden") el.style.overflow = "hidden";
    el.appendChild(span);
    span.addEventListener("animationend", () => span.remove());
    setTimeout(() => span.remove(), 1200);
  }
}

function showCursor(c: FxConfig) {
  if (!cursorEl) {
    cursorEl = document.createElement("div");
    cursorEl.setAttribute("aria-hidden", "true");
    Object.assign(cursorEl.style, {
      position: "fixed",
      left: "0",
      top: "0",
      zIndex: "2147483000",
      pointerEvents: "none",
      display: "grid",
      placeItems: "center",
      borderRadius: "999px",
      transition: "width 200ms, height 200ms, opacity 200ms, background-color 200ms",
      fontFamily: "var(--n-font-mono)",
      fontSize: "11px",
      color: "var(--n-color-text-on-accent)",
    });
    document.body.appendChild(cursorEl);
  }
  const s = cursorEl.style;
  s.opacity = "1";
  s.mixBlendMode = c.cursor === "blend" ? "difference" : "normal";
  const size = c.cursor === "dot" ? 10 : c.cursor === "label" ? 64 : c.cursor === "blend" ? 48 : 36;
  s.width = s.height = `${size}px`;
  s.background = c.cursor === "ring" ? "transparent" : c.cursor === "blend" ? "white" : "var(--n-color-accent)";
  s.border = c.cursor === "ring" ? "1.5px solid var(--n-color-accent)" : "none";
  cursorEl.textContent = c.cursor === "label" ? c.cursorLabel || "View" : "";
  if (!cursorRaf) cursorRaf = requestAnimationFrame(moveCursor);
}

function moveCursor() {
  cursorRaf = 0;
  if (!cursorEl) return;
  cursorPos.x += (cursorPos.tx - cursorPos.x) * 0.25;
  cursorPos.y += (cursorPos.ty - cursorPos.y) * 0.25;
  const w = cursorEl.offsetWidth;
  cursorEl.style.transform = `translate(${cursorPos.x - w / 2}px, ${cursorPos.y - w / 2}px)`;
  if (cursorEl.style.opacity !== "0") cursorRaf = requestAnimationFrame(moveCursor);
}

function hideCursor() {
  if (cursorEl) cursorEl.style.opacity = "0";
}

/* ---------------- scroll ---------------- */

let lastY = 0;
let velocity = 0;
let scrollRaf = 0;

function onScroll() {
  if (scrollRaf) return;
  scrollRaf = requestAnimationFrame(() => {
    scrollRaf = 0;
    const y = window.scrollY;
    velocity = velocity * 0.8 + (y - lastY) * 0.2;
    lastY = y;
    if (motionReduced()) return;
    const vh = window.innerHeight;
    const docP = y / Math.max(1, document.documentElement.scrollHeight - vh);
    for (const s of scrollEls) {
      const r = s.el.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
      const k = s.intensity;
      const st = s.el.style;
      switch (s.effect) {
        case "parallax":
          st.transform = `translateY(${(p - 0.5) * -120 * k}px)`;
          break;
        case "fade":
          st.opacity = String(Math.min(1, p * 2.2));
          break;
        case "reveal":
          st.clipPath = `inset(0 0 ${Math.max(0, (1 - p * 2.2) * 100)}% 0)`;
          break;
        case "scale":
          st.transform = `scale(${0.82 + 0.18 * Math.min(1, p * 2) * Math.max(0.2, k)})`;
          break;
        case "rotate":
          st.transform = `rotate(${(p - 0.5) * 24 * k}deg)`;
          break;
        case "blur":
          st.filter = `blur(${(1 - Math.min(1, p * 2.2)) * 10 * k}px)`;
          break;
        case "progress":
          st.transformOrigin = "left";
          st.transform = `scaleX(${docP})`;
          break;
        case "velocity-skew":
          st.transform = `skewY(${Math.max(-8, Math.min(8, velocity * 0.15 * k))}deg)`;
          break;
      }
    }
    if (Math.abs(velocity) > 0.1 && scrollEls.some((s) => s.effect === "velocity-skew")) onScroll();
  });
}

/* ---------------- behaviours: typewriter, count-up ---------------- */

/** Text-mutating behaviours wait until streaming hydration has settled. */
let settled = false;
function whenSettled() {
  if (settled) return;
  const go = () =>
    setTimeout(() => {
      settled = true;
      behaviours(document);
    }, 700);
  if (document.readyState === "complete") go();
  else window.addEventListener("load", go, { once: true });
}

function behaviours(root: ParentNode) {
  if (typeof window === "undefined") return;
  if (!settled) {
    whenSettled();
    return;
  }
  root.querySelectorAll<HTMLElement>('[data-n="text"], [data-n="heading"]').forEach((el) => {
    if (typed.has(el)) return;
    const cs = getComputedStyle(el);
    if (cssVar(cs, "--n-b-typewriter") !== "on" || el.children.length) return;
    const full = el.textContent ?? "";
    typed.set(el, full);
    if (motionReduced()) return;
    const speed = num(cssVar(cs, "--n-b-typewriterSpeed"), 40) / motionSpeed();
    const loop = cssVar(cs, "--n-b-typewriterLoop") === "yes";
    let i = 0;
    let dir = 1;
    const caret = document.createElement("span");
    caret.setAttribute("data-n-part", "text.caret");
    caret.setAttribute("aria-hidden", "true");
    el.setAttribute("aria-label", full);
    const tick = () => {
      if (!el.isConnected || typed.get(el) !== full) return;
      i += dir;
      el.textContent = full.slice(0, i);
      el.appendChild(caret);
      if (i >= full.length) {
        if (!loop) return;
        dir = -1;
        setTimeout(tick, 1600);
        return;
      }
      if (i <= 0) {
        dir = 1;
      }
      setTimeout(tick, dir > 0 ? speed : speed / 2);
    };
    el.textContent = "";
    el.appendChild(caret);
    setTimeout(tick, 300);
  });

  root.querySelectorAll<HTMLElement>('[data-n="stat"]').forEach((el) => {
    const cs = getComputedStyle(el);
    if (cssVar(cs, "--n-b-countUp") !== "on") return;
    const target = el.querySelector<HTMLElement>("[data-n-count]");
    if (!target || counted.has(target)) return;
    counted.add(target);
    const text = target.textContent ?? "";
    const m = text.match(/-?[\d,]*\.?\d+/);
    if (!m || motionReduced()) return;
    const final = parseFloat(m[0].replace(/,/g, ""));
    const decimals = (m[0].split(".")[1] ?? "").length;
    const dur = parseTime(cssVar(cs, "--n-b-countUpDuration"), 1200) / motionSpeed();
    const fmt = (v: number) => text.replace(m[0], v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }));
    const obs = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      obs.disconnect();
      const t0 = performance.now();
      const step = (now: number) => {
        const p = Math.min(1, (now - t0) / dur);
        const e = 1 - Math.pow(1 - p, 3);
        target.textContent = fmt(final * e);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
    obs.observe(target);
  });
}

/* ---------------- lifecycle ---------------- */

export function startMotion() {
  if (started || typeof window === "undefined") return () => {};
  started = true;
  const pre = (window as unknown as { __nPre?: string }).__nPre;
  lateStart = pre === "expired" || (pre === undefined && !document.documentElement.hasAttribute("data-n-pre"));
  const rescan = () => {
    if (scanTimer) clearTimeout(scanTimer);
    scanTimer = setTimeout(() => scan(), 60);
  };
  const offApply = onApply(() => {
    fxCache = new WeakMap();
    rescan();
  });
  mo = new MutationObserver((muts) => {
    let added = false;
    for (const m of muts)
      for (const n of m.addedNodes) {
        if (n instanceof HTMLElement) {
          // Runs as a microtask, i.e. before the new content is painted: no visible-then-hidden flash.
          scanEnter(n);
          added = true;
        }
      }
    if (added) rescan();
  });
  mo.observe(document.body, { childList: true, subtree: true });
  document.addEventListener("pointermove", onMove, { passive: true });
  document.addEventListener("pointerdown", onDown, { passive: true });
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  scan();
  lateStart = false; // only the first scan of a page load can be late
  return () => {
    started = false;
    offApply();
    mo?.disconnect();
    io.forEach((o) => o.disconnect());
    document.removeEventListener("pointermove", onMove);
    document.removeEventListener("pointerdown", onDown);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onScroll);
  };
}
