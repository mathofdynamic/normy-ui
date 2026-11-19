"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { AppShell as AppShellFrame, Avatar, Badge, Button, CommandPalette, Dock, Dropdown, Footer, IconButton, Input, Navbar, Row, Sidebar, Stack, Text, Toaster, useCommandShortcut, type CommandItem } from "@/components/normy";
import { applyMode, applySystem, motionReduced, motionSpeed, storedMode } from "@/engine/runtime/apply";
import { STARTERS } from "@/engine/systems";
import { PREVIEW_PAGES } from "./pages";

/* ---------------- brand ---------------- */

export function Brand({ name = "Lumen" }: { name?: string }) {
  return (
    <>
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.6" />
        <path d="M7 15.5c2.5-6 7.5-6 10 0" stroke="var(--n-color-accent)" strokeWidth="2" strokeLinecap="round" />
      </svg>
      {name}
    </>
  );
}

/* ---------------- page transition (reads motion.page-* tokens) ---------------- */

const PAGE_FX: Record<string, Keyframe[]> = {
  fade: [{ opacity: 0 }, { opacity: 1 }],
  rise: [{ opacity: 0, transform: "translateY(16px)" }, { opacity: 1, transform: "none" }],
  slide: [{ opacity: 0, transform: "translateX(24px)" }, { opacity: 1, transform: "none" }],
  zoom: [{ opacity: 0, transform: "scale(0.985)" }, { opacity: 1, transform: "none" }],
  blur: [{ opacity: 0, filter: "blur(8px)" }, { opacity: 1, filter: "none" }],
};

export function PageTransition({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const path = usePathname();
  // Animate only when the path really changes. A "first run" flag is not enough: React runs
  // effects twice on mount in development, which faded every freshly loaded page a second time.
  const prevPath = useRef<string | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    const prev = prevPath.current;
    prevPath.current = path;
    if (prev === null || prev === path) return;
    if (!el || motionReduced()) return;
    const cs = getComputedStyle(document.documentElement);
    const fx = cs.getPropertyValue("--n-motion-page-effect").trim() || "fade";
    if (fx === "none" || !PAGE_FX[fx]) return;
    const dur = parseFloat(cs.getPropertyValue("--n-motion-page-duration")) || 360;
    const easing = cs.getPropertyValue("--n-motion-page-easing").trim() || "ease-out";
    el.animate(PAGE_FX[fx], { duration: dur / motionSpeed(), easing });
  }, [path]);
  return (
    <div ref={ref} data-n-page="">
      {children}
    </div>
  );
}

/* ---------------- floating preview toolbar (hidden inside the Studio canvas) ---------------- */

export function PreviewToolbar() {
  const router = useRouter();
  const embedded = useSyncExternalStore(
    () => () => {},
    () => window.parent !== window,
    () => true,
  );
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"light" | "dark">(() => (typeof document !== "undefined" && document.documentElement.classList.contains("dark") ? "dark" : "light"));
  useCommandShortcut(() => setOpen((o) => !o), "j");
  if (embedded) return null;
  const items: CommandItem[] = [
    ...PREVIEW_PAGES.map((p) => ({ id: p.path, group: p.group, label: p.title, icon: p.icon, onSelect: () => router.push(p.path) })),
    ...STARTERS.map((s) => ({ id: `sys-${s.meta.id}`, group: "Apply design system", label: s.meta.name, icon: "palette" as const, onSelect: () => applySystem(s, { persist: true }) })),
    { id: "studio", group: "Go", label: "Open in Studio", icon: "sliders", onSelect: () => router.push("/studio") },
    { id: "hub", group: "Go", label: "Normy home", icon: "home", onSelect: () => router.push("/") },
  ];
  return (
    <>
      <Dock label="Preview tools" nid="preview-dock">
        <IconButton icon="grid" label="Pages and systems (Ctrl J)" size="sm" onClick={() => setOpen(true)} />
        <IconButton
          icon={mode === "dark" ? "sun" : "moon"}
          label="Toggle colour mode"
          size="sm"
          onClick={() => {
            const next = mode === "dark" ? "light" : "dark";
            applyMode(next);
            setMode(next);
          }}
        />
        <IconButton icon="sliders" label="Open in Studio" size="sm" onClick={() => router.push("/studio")} />
      </Dock>
      <CommandPalette open={open} onOpenChange={setOpen} items={items} placeholder="Jump to a page or apply a system…" label="Preview navigator" />
    </>
  );
}

export function PreviewFrame({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (window.parent === window) applyMode(storedMode(), false);
  }, []);
  return (
    <Toaster>
      <PageTransition>{children}</PageTransition>
      <PreviewToolbar />
    </Toaster>
  );
}

/* ---------------- landing shell ---------------- */

const LANDING_LINKS = [
  { label: "Product", href: "/preview/saas" },
  { label: "Pricing", href: "/preview/pricing" },
  { label: "Blog", href: "/preview/blog" },
  { label: "Shop", href: "/preview/shop" },
  { label: "Work", href: "/preview/portfolio" },
  { label: "Docs", href: "/preview/docs" },
];

export function LandingShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  return (
    <>
      <Navbar
        nid="site-nav"
        brand={<Brand />}
        links={LANDING_LINKS.map((l) => ({ ...l, current: path === l.href || (l.href !== "/preview/saas" && path.startsWith(l.href)) }))}
        actions={
          <Row gap={2}>
            <Button href="/preview/login" variant="ghost" size="sm">
              Log in
            </Button>
            <Button href="/preview/signup" size="sm" nid="nav-cta">
              Start free
            </Button>
          </Row>
        }
      />
      <main>{children}</main>
      <Footer
        nid="site-footer"
        brand={
          <Stack gap={3}>
            <Row gap={2}>
              <Brand />
            </Row>
            <Text variant="small">Lumen turns product analytics into decisions your whole team can read. Made in Lisbon and Montréal.</Text>
          </Stack>
        }
        columns={[
          { title: "Product", links: [{ label: "Overview", href: "/preview/saas" }, { label: "Pricing", href: "/preview/pricing" }, { label: "Changelog", href: "/preview/blog" }, { label: "Dashboard", href: "/preview/app" }] },
          { title: "Resources", links: [{ label: "Docs", href: "/preview/docs" }, { label: "Blog", href: "/preview/blog" }, { label: "Shop", href: "/preview/shop" }] },
          { title: "Company", links: [{ label: "Work", href: "/preview/portfolio" }, { label: "Sign up", href: "/preview/signup" }, { label: "Log in", href: "/preview/login" }] },
        ]}
        bottom="© 2026 Lumen Labs. A Normy preview."
        legal={
          <>
            <span>Privacy</span>
            <span>Terms</span>
          </>
        }
      />
    </>
  );
}

/* ---------------- dashboard shell ---------------- */

const APP_NAV = [
  { label: "Overview", href: "/preview/app", icon: "home" as const },
  { label: "Customers", href: "/preview/app/table", icon: "users" as const, count: "2.4k" },
  { label: "Inbox", href: "/preview/app/inbox", icon: "inbox" as const, count: 12 },
  { label: "Projects", href: "/preview/app/kanban", icon: "kanban" as const },
  { label: "Calendar", href: "/preview/app/calendar", icon: "calendar" as const },
];
const APP_NAV_2 = [
  { label: "Billing", href: "/preview/app/checkout", icon: "credit-card" as const },
  { label: "States", href: "/preview/app/states", icon: "layers" as const },
  { label: "Settings", href: "/preview/app/settings", icon: "settings" as const },
];

export function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const mark = <T extends { href: string }>(xs: T[]) => xs.map((x) => ({ ...x, current: path === x.href }));
  return (
    <AppShellFrame
      nid="app-shell"
      sidebar={
        <Sidebar
          nid="app-sidebar"
          header={
            <Row gap={2}>
              <Brand />
            </Row>
          }
          sections={[
            { label: "Workspace", items: mark(APP_NAV) },
            { label: "Account", items: mark(APP_NAV_2) },
          ]}
          footer={
            <Row gap={3}>
              <Avatar name="Inês Duarte" size="sm" status />
              <Stack gap={0}>
                <Text variant="small" as="span">
                  Inês Duarte
                </Text>
                <Text variant="caption" as="span">
                  Growth · Admin
                </Text>
              </Stack>
            </Row>
          }
        />
      }
      menu={
        <Dropdown
          trigger={<IconButton icon="menu" label="Navigation" variant="outline" size="sm" />}
          align="start"
          items={[...APP_NAV, ...APP_NAV_2].map((n) => ({ label: n.label, icon: n.icon, onSelect: () => router.push(n.href) }))}
        />
      }
      search={<Input label="Search" hideLabel required icon="search" placeholder="Search customers, events, docs…" size="sm" nid="app-search" />}
      status={
        <Badge variant="success" dot>
          All systems normal
        </Badge>
      }
      actions={
        <>
          <IconButton icon="bell" label="Notifications" variant="ghost" />
          <Button size="sm" icon="plus" nid="app-new">
            New report
          </Button>
        </>
      }
    >
      {children}
    </AppShellFrame>
  );
}
