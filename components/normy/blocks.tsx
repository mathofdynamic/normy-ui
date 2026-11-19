import NextLink from "next/link";
import type { ReactNode } from "react";
import { nPart, nRoot, type NProps } from "@/engine/react";

/* Page blocks built from parts. Still pure structure — all looks come from rules. */

export interface HeroProps extends NProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  actions?: ReactNode;
  meta?: ReactNode;
  media?: ReactNode;
  variant?: "split" | "centered" | "editorial" | (string & {});
}

export function Hero({ variant, nid, eyebrow, title, lead, actions, meta, media }: HeroProps) {
  // A split hero needs a visual; without one, centre the copy instead of leaving half the screen empty.
  variant ??= media ? "split" : "centered";
  return (
    <section {...nRoot("hero", { variant, nid })}>
      <div {...nPart("hero", "inner")}>
        <div {...nPart("hero", "copy")}>
          {eyebrow ? <div {...nPart("hero", "eyebrow")}>{eyebrow}</div> : null}
          <h1 {...nPart("hero", "title")}>{title}</h1>
          {lead ? <p {...nPart("hero", "lead")}>{lead}</p> : null}
          {actions ? <div {...nPart("hero", "actions")}>{actions}</div> : null}
          {meta ? <div {...nPart("hero", "meta")}>{meta}</div> : null}
        </div>
        {media ? <div {...nPart("hero", "media")}>{media}</div> : null}
      </div>
    </section>
  );
}

export interface FooterProps extends NProps {
  brand: ReactNode;
  columns: Array<{ title: string; links: Array<{ label: string; href: string }> }>;
  legal?: ReactNode;
  bottom?: ReactNode;
}

export function Footer({ variant = "plain", nid, brand, columns, legal, bottom }: FooterProps) {
  return (
    <footer {...nRoot("footer", { variant, nid })}>
      <div {...nPart("footer", "inner")}>
        <div {...nPart("footer", "brand")}>{brand}</div>
        <div {...nPart("footer", "columns")}>
          {columns.map((c) => (
            <nav key={c.title} aria-label={c.title} {...nPart("footer", "column")}>
              <span {...nPart("footer", "title")}>{c.title}</span>
              {c.links.map((l) => (
                <NextLink key={l.label} href={l.href} {...nPart("footer", "link")}>
                  {l.label}
                </NextLink>
              ))}
            </nav>
          ))}
        </div>
        <div {...nPart("footer", "bottom")}>
          <span>{bottom}</span>
          {legal ? <span {...nPart("footer", "legal")}>{legal}</span> : null}
        </div>
      </div>
    </footer>
  );
}

/* ---------------- App shell / page header / dock ---------------- */

export interface AppShellProps extends NProps {
  sidebar: ReactNode;
  menu?: ReactNode;
  search?: ReactNode;
  /** Shown from md up (status badges etc.). */
  status?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}

export function AppShell({ variant = "default", nid, sidebar, menu, search, status, actions, children }: AppShellProps) {
  return (
    <div {...nRoot("appShell", { variant, nid })}>
      <div {...nPart("appShell", "sidebar")}>{sidebar}</div>
      <div {...nPart("appShell", "main")}>
        <header {...nPart("appShell", "bar")}>
          {menu ? <div {...nPart("appShell", "menu")}>{menu}</div> : null}
          {search ? <div {...nPart("appShell", "search")}>{search}</div> : null}
          {status ? <div {...nPart("appShell", "status")}>{status}</div> : null}
          {actions ? <div {...nPart("appShell", "actions")}>{actions}</div> : null}
        </header>
        <main {...nPart("appShell", "content")}>{children}</main>
      </div>
    </div>
  );
}

export interface PageHeaderProps extends NProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ variant = "default", nid, eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <div {...nRoot("pageHeader", { variant, nid })}>
      <div {...nPart("pageHeader", "copy")}>
        {eyebrow ? <span {...nPart("pageHeader", "eyebrow")}>{eyebrow}</span> : null}
        <h1 {...nPart("pageHeader", "title")}>{title}</h1>
        {description ? <p {...nPart("pageHeader", "description")}>{description}</p> : null}
      </div>
      {actions ? <div {...nPart("pageHeader", "actions")}>{actions}</div> : null}
    </div>
  );
}

export function Dock({ variant = "bottom-right", nid, children, label = "Tools" }: NProps & { children: ReactNode; label?: string }) {
  return (
    <div role="toolbar" aria-label={label} {...nRoot("dock", { variant, nid })}>
      {children}
    </div>
  );
}
