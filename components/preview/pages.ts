import type { IconName } from "@/components/normy/icon";

export interface PreviewPage {
  path: string;
  title: string;
  group: "Landing" | "Dashboard" | "Labs";
  icon: IconName;
  description: string;
}

/** Every preview page — the Studio, hub, Analyzer and screenshot scripts read this list. */
export const PREVIEW_PAGES: PreviewPage[] = [
  { path: "/preview/saas", title: "SaaS home", group: "Landing", icon: "rocket", description: "Marketing home with hero, logos, features, testimonials and CTA." },
  { path: "/preview/pricing", title: "Pricing", group: "Landing", icon: "tag", description: "Plans, comparison table and FAQ." },
  { path: "/preview/blog", title: "Blog", group: "Landing", icon: "file", description: "Article index with featured post and categories." },
  { path: "/preview/blog/article", title: "Article", group: "Landing", icon: "bookmark", description: "Long-form reading layout." },
  { path: "/preview/shop", title: "Shop listing", group: "Landing", icon: "bag", description: "Product grid with filters and sort." },
  { path: "/preview/shop/product", title: "Product", group: "Landing", icon: "cart", description: "Product detail with gallery, variants and reviews." },
  { path: "/preview/portfolio", title: "Portfolio", group: "Landing", icon: "image", description: "Studio portfolio with case studies." },
  { path: "/preview/docs", title: "Docs", group: "Landing", icon: "code", description: "Documentation page with sidebar and table of contents." },
  { path: "/preview/login", title: "Log in", group: "Landing", icon: "lock", description: "Authentication." },
  { path: "/preview/signup", title: "Sign up", group: "Landing", icon: "user", description: "Account creation with plan choice." },
  { path: "/preview/not-found", title: "404", group: "Landing", icon: "help", description: "Not-found page." },
  { path: "/preview/app", title: "Analytics", group: "Dashboard", icon: "chart-line", description: "KPI cards, charts and a table." },
  { path: "/preview/app/table", title: "Data table", group: "Dashboard", icon: "table", description: "Filters, sort, selection and pagination." },
  { path: "/preview/app/settings", title: "Settings", group: "Dashboard", icon: "settings", description: "Profile, notifications and billing forms." },
  { path: "/preview/app/kanban", title: "Kanban", group: "Dashboard", icon: "kanban", description: "Board with columns and cards." },
  { path: "/preview/app/inbox", title: "Inbox", group: "Dashboard", icon: "inbox", description: "Conversation list and chat thread." },
  { path: "/preview/app/calendar", title: "Calendar", group: "Dashboard", icon: "calendar", description: "Month view with events." },
  { path: "/preview/app/checkout", title: "Checkout", group: "Dashboard", icon: "credit-card", description: "Multi-step checkout flow." },
  { path: "/preview/app/states", title: "States", group: "Dashboard", icon: "layers", description: "Empty, loading and error states." },
  { path: "/preview/atlas", title: "Component Atlas", group: "Labs", icon: "grid", description: "Every component × variant × size × state." },
  { path: "/preview/motion", title: "Motion Lab", group: "Labs", icon: "zap", description: "Every animation type, isolated, with controls." },
  { path: "/preview/analyzer", title: "Analyzer", group: "Labs", icon: "target", description: "Coverage, contrast, token usage, unused rules." },
];
