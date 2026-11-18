"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Button, Navbar } from "@/components/normy";
import { Brand } from "@/components/preview/shells";

const LINKS = [
  { label: "Atlas", href: "/preview/atlas" },
  { label: "Motion Lab", href: "/preview/motion" },
  { label: "Analyzer", href: "/preview/analyzer" },
  { label: "Preview apps", href: "/preview/saas" },
];

export default function LabsLayout({ children }: { children: ReactNode }) {
  const path = usePathname();
  return (
    <>
      <Navbar
        nid="labs-nav"
        variant="blurred"
        brand={<Brand name="Normy Labs" />}
        links={LINKS.map((l) => ({ ...l, current: path === l.href }))}
        actions={
          <Button size="sm" href="/studio" icon="sliders">
            Studio
          </Button>
        }
      />
      <main>{children}</main>
    </>
  );
}
