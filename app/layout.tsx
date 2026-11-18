import type { Metadata } from "next";
import { NormyRuntime } from "@/components/runtime/normy-runtime";
import { TooltipProvider } from "@/components/normy/overlay";
import { compile } from "@/engine/compile";
import { COMPONENTS } from "@/engine/components";
import { BOOT_SCRIPT, STYLE_ID } from "@/engine/runtime/apply";
import { DEFAULT_SYSTEM } from "@/engine/systems";
import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Normy — design engine & studio",
  description: "A rule-driven design engine, a visual studio, and a 60-component React library that re-skins from data.",
};

/* The default system is compiled on the server so the first paint is styled. */
const DEFAULT_CSS = compile(DEFAULT_SYSTEM, COMPONENTS).css;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className={fontVariables}>
      <head>
        <style id={STYLE_ID} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: DEFAULT_CSS }} />
        <script dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />
      </head>
      <body>
        <TooltipProvider>{children}</TooltipProvider>
        <NormyRuntime />
      </body>
    </html>
  );
}
