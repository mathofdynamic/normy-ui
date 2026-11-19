"use client";

import { useEffect, useRef, useState } from "react";
import type { FromCanvas, ToCanvas } from "@/engine/runtime/channel";
import type { DesignSystem } from "@/engine/types";
import { getComponent } from "@/engine/components";
import { defaultPart, describeScope } from "./edit-panel";
import { DEVICES, useStudio } from "./store";

/** The system the canvas should render: transient motion overrides (speed / off) never touch the saved system. */
function canvasSystem(s: DesignSystem, speed: number, off: boolean): DesignSystem {
  if (speed === 1 && !off) return s;
  return { ...s, tokens: { ...s.tokens, ...(speed !== 1 ? { "motion.speed": speed } : null), ...(off ? { "motion.enabled": false } : null) } };
}

function Frame({ role, label }: { role: "current" | "baseline"; label?: string }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [avail, setAvail] = useState({ w: 800, h: 600 });
  const page = useStudio((s) => s.page);
  const device = useStudio((s) => s.device);
  const width = DEVICES[device].width;

  // Fit the device width into the available stage.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      setAvail({ w, h });
      setScale(width ? Math.min(1, w / width) : 1);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);

  const send = (msg: ToCanvas) => ref.current?.contentWindow?.postMessage(msg, location.origin);

  // Push state into the iframe whenever it changes (rAF-throttled).
  useEffect(() => {
    let raf = 0;
    const push = () => {
      const st = useStudio.getState();
      const sys = role === "baseline" ? st.baseline : st.system;
      send({ type: "system", system: canvasSystem(sys, st.speed, st.motionOff) });
      send({ type: "mode", mode: st.mode });
      if (role === "current") {
        send({ type: "inspect", on: st.inspect });
        const forceStates = st.force.length ? st.force : st.scope.state ? [st.scope.state] : [];
        send({ type: "force", states: forceStates, target: st.scope.component ? { component: st.scope.component, instance: st.scope.instance } : null });
        const sc = st.scope;
        send({ type: "highlight", target: sc.component && !st.advanced && st.panel === "edit" && st.panelOpen ? { component: sc.component, instance: sc.instance, part: sc.part, variant: sc.variant, label: describeScope(sc) } : null });
      }
    };
    const unsub = useStudio.subscribe((s, prev) => {
      if (s.system === prev.system && s.baseline === prev.baseline && s.mode === prev.mode && s.inspect === prev.inspect && s.force === prev.force && s.scope === prev.scope && s.advanced === prev.advanced && s.panel === prev.panel && s.panelOpen === prev.panelOpen && s.speed === prev.speed && s.motionOff === prev.motionOff) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(push);
    });
    const onLoad = () => setTimeout(push, 50);
    const el = ref.current;
    el?.addEventListener("load", onLoad);
    return () => {
      unsub();
      cancelAnimationFrame(raf);
      el?.removeEventListener("load", onLoad);
    };
  }, [role]);

  // Messages from the iframe.
  useEffect(() => {
    if (role !== "current") return;
    const onMsg = (e: MessageEvent<FromCanvas>) => {
      if (e.origin !== location.origin || e.source !== ref.current?.contentWindow) return;
      const m = e.data;
      const st = useStudio.getState();
      if (m.type === "ready") {
        if (m.path !== st.page) st.set({ page: m.path });
        setTimeout(() => {
          const s2 = useStudio.getState();
          send({ type: "system", system: canvasSystem(s2.system, s2.speed, s2.motionOff) });
          send({ type: "mode", mode: s2.mode });
          send({ type: "inspect", on: s2.inspect });
        }, 30);
      } else if (m.type === "instances") st.set({ instances: m.list, pageComponents: m.components });
      else if (m.type === "picked") {
        const t = m.target;
        // Small controls (buttons, inputs…) are almost always meant as a whole; bigger blocks keep the clicked part.
        st.set({ picked: t, panel: "edit", panelOpen: true });
        st.setScope(st.advanced ? { component: t.component, part: t.part, instance: t.instance } : { component: t.component, part: defaultPart(getComponent(t.component), t.part) });
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [role]);

  // Replay / highlight requests from the toolbar.
  useEffect(() => {
    const onReplay = () => send({ type: "replay" });
    const onHi = (e: Event) => send({ type: "highlight", target: (e as CustomEvent).detail });
    window.addEventListener("studio:replay", onReplay);
    window.addEventListener("studio:highlight", onHi);
    return () => {
      window.removeEventListener("studio:replay", onReplay);
      window.removeEventListener("studio:highlight", onHi);
    };
  }, []);

  const w = width ?? avail.w;
  const h = width ? avail.h / scale - 4 : avail.h - 4;
  const src = `${page}${page.includes("?") ? "&" : "?"}studio=1`;
  return (
    <div className="st-frame-wrap" ref={box}>
      {label ? <span className="st-frame-label">{label}</span> : null}
      <div className="st-frame" data-device={device} style={{ width: w, height: h, transform: `scale(${scale})` }}>
        <iframe ref={ref} title={role === "baseline" ? "Before (saved)" : "Live canvas"} src={src} />
      </div>
    </div>
  );
}

export function Canvas() {
  const compare = useStudio((s) => s.compare);
  return (
    <div className="st-stage">
      {compare ? <Frame role="baseline" label="Before · last saved" /> : null}
      <Frame role="current" label={compare ? "After · current draft" : undefined} />
    </div>
  );
}
