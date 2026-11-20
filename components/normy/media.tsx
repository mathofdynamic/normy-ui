"use client";

import { Children, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { nPart, nRoot, type NProps } from "@/engine/react";
import { IconButton } from "./button";
import { ms, prefersReducedMotion, useBehavior } from "./use-behavior";

/* ------------------------------------------------------------------ *
 * Carousel — autoplay, interval, transition (slide/fade/scale/stack),
 * loop and pause-on-hover are behaviour props read from the cascade.
 * ------------------------------------------------------------------ */

export function Carousel({ variant = "default", nid, label, children }: NProps & { label: string; children: ReactNode }) {
  const slides = Children.toArray(children);
  const ref = useRef<HTMLElement>(null);
  const b = useBehavior(ref, { carouselAutoplay: "on", carouselInterval: "4500ms", carouselTransition: "slide", carouselLoop: "on", carouselPause: "yes" });
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [drag, setDrag] = useState<{ x0: number; dx: number } | null>(null);
  const count = slides.length;
  const loop = b.carouselLoop !== "off";

  const go = (i: number) => setIndex(loop ? (i + count) % count : Math.max(0, Math.min(count - 1, i)));

  useEffect(() => {
    if (b.carouselAutoplay === "off" || paused || drag || count < 2 || prefersReducedMotion()) return;
    const t = setInterval(() => setIndex((i) => (loop ? (i + 1) % count : Math.min(i + 1, count - 1))), ms(b.carouselInterval, 4500));
    return () => clearInterval(t);
  }, [b.carouselAutoplay, b.carouselInterval, paused, drag, count, loop]);

  const mode = b.carouselTransition;
  const trackStyle: CSSProperties =
    mode === "slide" ? { translate: `calc(${-index * 100}% + ${drag?.dx ?? 0}px) 0`, transitionDuration: drag ? "0s" : undefined } : { display: "grid" };

  return (
    <section
      ref={ref}
      aria-roledescription="carousel"
      aria-label={label}
      {...nRoot("carousel", { variant, nid }, {}, { dragging: !!drag })}
      onPointerEnter={() => b.carouselPause !== "no" && setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div
        {...nPart("carousel", "viewport")}
        onPointerDown={(e) => {
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          setDrag({ x0: e.clientX, dx: 0 });
        }}
        onPointerMove={(e) => drag && setDrag({ ...drag, dx: e.clientX - drag.x0 })}
        onPointerUp={() => {
          if (drag && Math.abs(drag.dx) > 40) go(index + (drag.dx < 0 ? 1 : -1));
          setDrag(null);
        }}
        onPointerCancel={() => setDrag(null)}
      >
        <div {...nPart("carousel", "track")} style={trackStyle} aria-live={paused ? "polite" : "off"}>
          {slides.map((s, i) => {
            const active = i === index;
            const style: CSSProperties =
              mode === "slide"
                ? {}
                : {
                    gridArea: "1 / 1",
                    opacity: active ? 1 : 0,
                    scale: mode === "scale" ? (active ? "1" : "0.92") : undefined,
                    translate: mode === "stack" ? (active ? "0 0" : `${(i - index) * 6}% 0`) : undefined,
                    zIndex: active ? 1 : 0,
                  };
            return (
              <div key={i} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${count}`} aria-hidden={!active} {...nPart("carousel", "slide", { selected: active })} style={style}>
                {s}
              </div>
            );
          })}
        </div>
      </div>
      <div {...nPart("carousel", "controls")}>
        <div {...nPart("carousel", "dots")} role="tablist" aria-label="Choose slide">
          {slides.map((_, i) => (
            <button key={i} type="button" role="tab" aria-selected={i === index} aria-label={`Slide ${i + 1}`} onClick={() => go(i)} {...nPart("carousel", "dot", { selected: i === index })} />
          ))}
        </div>
        <div style={{ display: "flex", gap: "var(--n-space-1)" }}>
          <IconButton icon="arrow-left" label="Previous slide" variant="outline" size="sm" onClick={() => go(index - 1)} disabled={!loop && index === 0} />
          <IconButton icon="arrow-right" label="Next slide" variant="outline" size="sm" onClick={() => go(index + 1)} disabled={!loop && index === count - 1} />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * Marquee — infinite ticker. Speed (px/s), direction, pause on hover.
 * Stops entirely under reduced motion.
 * ------------------------------------------------------------------ */

export function Marquee({ variant = "fade", nid, label, children }: NProps & { label: string; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const b = useBehavior(ref, { marqueeSpeed: "60", marqueeDirection: "left", marqueePause: "yes" });
  const hovering = useRef(false);
  const items = Children.toArray(children);
  const [copies, setCopies] = useState(2);

  // Enough copies that the strip always covers the region, even on very wide screens.
  useEffect(() => {
    const el = track.current;
    const region = ref.current;
    if (!el || !region) return;
    const fit = () => {
      const kids = el.children as HTMLCollectionOf<HTMLElement>;
      if (kids.length <= items.length) return;
      const period = kids[items.length].offsetLeft - kids[0].offsetLeft;
      if (period > 0) setCopies(Math.max(2, Math.ceil(region.clientWidth / period) + 1));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(region);
    return () => ro.disconnect();
  }, [items.length]);

  useEffect(() => {
    const el = track.current;
    if (!el || prefersReducedMotion()) return;
    let x = 0;
    let last = performance.now();
    let raf = 0;
    const speed = parseFloat(b.marqueeSpeed) || 60;
    const dir = b.marqueeDirection === "right" ? 1 : -1;
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const paused = (hovering.current && b.marqueePause !== "no") || ref.current?.hasAttribute("data-n-paused");
      if (!paused) {
        // One period = where the second copy starts. Measuring it (instead of scrollWidth / 2)
        // includes the gap after the last item, so the loop lands exactly on itself: no jump.
        const kids = el.children as HTMLCollectionOf<HTMLElement>;
        const period = kids.length > items.length ? kids[items.length].offsetLeft - kids[0].offsetLeft : el.scrollWidth / 2;
        const cs = getComputedStyle(el);
        const motion = (parseFloat(cs.getPropertyValue("--n-motion-speed")) || 1) * (parseFloat(cs.getPropertyValue("--n-motion-loop-speed")) || 1);
        x += dir * speed * motion * dt;
        if (period > 0) {
          while (x <= -period) x += period;
          while (x > 0) x -= period;
        }
        el.style.transform = `translate3d(${x}px,0,0)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [b.marqueeSpeed, b.marqueeDirection, b.marqueePause, items.length]);

  return (
    <section
      ref={ref}
      aria-label={label}
      {...nRoot("marquee", { variant, nid })}
      data-n-loop=""
      suppressHydrationWarning
      onPointerEnter={() => (hovering.current = true)}
      onPointerLeave={() => (hovering.current = false)}
    >
      <div ref={track} {...nPart("marquee", "track")}>
        {Array.from({ length: copies }, (_, copy) => copy).map((copy) =>
          items.map((c, i) => (
            <div key={`${copy}-${i}`} aria-hidden={copy > 0 || undefined} {...nPart("marquee", "item")}>
              {c}
            </div>
          )),
        )}
      </div>
    </section>
  );
}
