"use client";

import { useEffect } from "react";
import { applyMode, applySystem, LS_SYSTEM, resolveMode, storedMode, storedSystem } from "@/engine/runtime/apply";
import { broadcast } from "@/engine/runtime/channel";
import { startMotion } from "@/engine/runtime/motion";
import { startAgent } from "@/engine/runtime/agent";
import { DEFAULT_SYSTEM } from "@/engine/systems";

/**
 * Applies the active design system on every page except the Studio
 * (which runs its own fixed system and drives canvases explicitly).
 * Listens for live updates from the Studio via BroadcastChannel/storage.
 */
export function NormyRuntime() {
  useEffect(() => {
    if (location.pathname.startsWith("/studio")) return;
    applySystem(storedSystem() ?? DEFAULT_SYSTEM);
    const pref = storedMode();
    applyMode(pref, false);
    // Start motion once streaming hydration has settled.
    let stopMotion = () => {};
    const go = () => (stopMotion = startMotion());
    const timer = setTimeout(go, document.readyState === "complete" ? 0 : 50);

    const stopAgent = startAgent();
    const inCanvas = window.parent !== window;
    const bc = inCanvas ? null : broadcast();
    const onMsg = (e: MessageEvent) => {
      const d = e.data;
      if (d?.type === "system") applySystem(d.system, { extra: d.extra });
      if (d?.type === "mode") applyMode(d.mode, false);
    };
    bc?.addEventListener("message", onMsg);
    const onStorage = (e: StorageEvent) => {
      if (e.key === LS_SYSTEM && e.newValue) applySystem(JSON.parse(e.newValue));
    };
    window.addEventListener("storage", onStorage);
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onScheme = () => {
      if ((document.documentElement.dataset.nModePref ?? "system") === "system") document.documentElement.classList.toggle("dark", resolveMode("system") === "dark");
    };
    mq.addEventListener("change", onScheme);
    return () => {
      clearTimeout(timer);
      stopMotion();
      stopAgent();
      bc?.removeEventListener("message", onMsg);
      window.removeEventListener("storage", onStorage);
      mq.removeEventListener("change", onScheme);
    };
  }, []);
  return null;
}
