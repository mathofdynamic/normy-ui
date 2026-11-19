"use client";

import { useEffect, type ReactNode } from "react";
import { TooltipProvider } from "./components/overlay";
import { MOTION_POLICY } from "./runtime/manifest";
import { startMotion } from "./runtime/motion";

/** Starts the Normy motion runtime and the tooltip provider. Put it once around the app. */
export function NormyProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.documentElement.dataset.nMotion = MOTION_POLICY;
    let stop = () => {};
    const t = setTimeout(() => (stop = startMotion()), document.readyState === "complete" ? 0 : 50);
    return () => {
      clearTimeout(t);
      stop();
    };
  }, []);
  return <TooltipProvider>{children}</TooltipProvider>;
}
