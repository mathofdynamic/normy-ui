import type { IconName } from "@/components/normy/icon";

/* Believable content for the preview apps (product: "Lumen", a product-analytics SaaS). */

export const LOGOS = ["Northwind", "Halcyon", "Brightline", "Kestrel & Co", "Oddfellow", "Parcel", "Meridian", "Tallow", "Quanta", "Fieldnote"];

export const FEATURES: Array<{ icon: IconName; title: string; text: string }> = [
  { icon: "chart-line", title: "Funnels that explain themselves", text: "Every drop-off comes with the three events most likely to have caused it, ranked by lift." },
  { icon: "users", title: "Cohorts in plain language", text: "Type “people who invited a teammate in week one” and Lumen builds the cohort for you." },
  { icon: "bell", title: "Alerts that respect your sleep", text: "Anomaly detection learns your weekly rhythm, so Monday mornings stop paging the on-call." },
  { icon: "shield", title: "Private by construction", text: "EU or US residency, field-level redaction and SSO on every plan, not just Enterprise." },
  { icon: "zap", title: "Sub-second queries", text: "A columnar engine tuned for event data answers 2 billion-row questions before you blink." },
  { icon: "layers", title: "One model, every tool", text: "Push metrics to Slack, Notion and your warehouse from a single, versioned definition." },
];

export const TESTIMONIALS = [
  { quote: "We replaced three dashboards and a weekly meeting with one Lumen board. Retention questions take minutes now, not sprints.", name: "Priya Raman", role: "VP Product, Halcyon" },
  { quote: "The cohort builder is the first analytics UI our designers actually open without being asked.", name: "Tomás Ibarra", role: "Head of Design, Parcel" },
  { quote: "Lumen caught a checkout regression 40 minutes after deploy. It paid for the year that afternoon.", name: "Hannah Okafor", role: "Engineering Manager, Brightline" },
];

export const STATS = [
  { label: "Events processed / day", value: "4.2B" },
  { label: "Median query time", value: "380ms" },
  { label: "Teams onboarded", value: "2,310" },
  { label: "Avg. time to first insight", value: "11 min" },
];

export const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: 0,
    period: "mo",
    blurb: "For side projects and the curious.",
    features: ["1M events / month", "3 seats", "30-day history", "Community support"],
    cta: "Start free",
  },
  {
    id: "team",
    name: "Team",
    price: 49,
    period: "seat / mo",
    blurb: "For product teams shipping weekly.",
    features: ["25M events / month", "Unlimited dashboards", "2-year history", "Anomaly alerts", "Slack & Notion sync"],
    cta: "Start 14-day trial",
    featured: true,
  },
  {
    id: "scale",
    name: "Scale",
    price: 129,
    period: "seat / mo",
    blurb: "For companies with a data team.",
    features: ["Unlimited events", "Warehouse sync", "SAML SSO & SCIM", "Data residency", "99.95% SLA"],
    cta: "Talk to sales",
  },
];

export const PLAN_MATRIX: Array<[string, string, string, string]> = [
  ["Events per month", "1M", "25M", "Unlimited"],
  ["Seats", "3", "Unlimited", "Unlimited"],
  ["Data retention", "30 days", "2 years", "Custom"],
  ["Anomaly alerts", "—", "✓", "✓"],
  ["Warehouse sync", "—", "—", "✓"],
  ["SSO", "Google", "Google, Okta", "SAML + SCIM"],
  ["Support", "Community", "Email, 1 day", "Dedicated, 1 hour"],
];

export const FAQS = [
  { q: "What counts as an event?", a: "Any action you send to Lumen: a page view, a click, a server-side purchase. Identify and group calls are free." },
  { q: "Can I change plans later?", a: "Yes. Upgrades are prorated to the day; downgrades take effect at the end of your billing period." },
  { q: "Do you offer discounts for non-profits?", a: "Registered non-profits and open-source projects get the Team plan at 60% off. Write to us with a link." },
  { q: "Where is my data stored?", a: "You choose EU (Frankfurt) or US (Virginia) at signup. Data never leaves the region you pick." },
];

export const POSTS = [
  { slug: "article", title: "The retention curve is lying to you", excerpt: "Why averaged cohorts hide your best users, and the three-line query that brings them back into view.", author: "Mara Lindqvist", date: "Nov 12, 2026", read: "8 min", tag: "Analysis", seed: 3 },
  { slug: "article", title: "Designing alerts people don't mute", excerpt: "Lessons from a year of anomaly detection in production, and the threshold maths we threw away.", author: "Kofi Mensah", date: "Nov 4, 2026", read: "6 min", tag: "Engineering", seed: 7 },
  { slug: "article", title: "Lumen 4.0: questions in plain language", excerpt: "Type the question, get the chart. What we learned teaching a query planner to read English.", author: "Inês Duarte", date: "Oct 28, 2026", read: "5 min", tag: "Product", seed: 11 },
  { slug: "article", title: "A field guide to event naming", excerpt: "Object–action, past tense, no abbreviations. The conventions that keep a tracking plan sane at 400 events.", author: "Mara Lindqvist", date: "Oct 19, 2026", read: "11 min", tag: "Guides", seed: 5 },
  { slug: "article", title: "What 2,000 onboarding funnels taught us", excerpt: "The median product loses 62% of signups before the first aha moment. The top decile loses 23%. Here's the difference.", author: "Sam Whitlock", date: "Oct 2, 2026", read: "9 min", tag: "Analysis", seed: 13 },
  { slug: "article", title: "Moving 4 billion events a day to Rust", excerpt: "Our ingestion rewrite cut p99 latency by 71%. The parts that went wrong were not the parts we expected.", author: "Kofi Mensah", date: "Sep 21, 2026", read: "14 min", tag: "Engineering", seed: 2 },
];

export const PRODUCTS = [
  { id: "p1", name: "Field Notebook, A5", price: 24, rating: 4.8, reviews: 214, tag: "Bestseller", color: "Moss", seed: 4 },
  { id: "p2", name: "Desk Mat, Felt", price: 58, rating: 4.6, reviews: 98, tag: "New", color: "Charcoal", seed: 9 },
  { id: "p3", name: "Mechanical Pencil 0.5", price: 18, rating: 4.9, reviews: 431, tag: "", color: "Vermilion", seed: 1 },
  { id: "p4", name: "Monitor Riser, Oak", price: 129, rating: 4.7, reviews: 62, tag: "", color: "Natural", seed: 6 },
  { id: "p5", name: "Analytics Hoodie", price: 72, rating: 4.5, reviews: 140, tag: "Limited", color: "Ink", seed: 12 },
  { id: "p6", name: "Ceramic Mug, 350ml", price: 22, rating: 4.8, reviews: 388, tag: "", color: "Bone", seed: 8 },
  { id: "p7", name: "Cable Organiser Set", price: 16, rating: 4.3, reviews: 57, tag: "", color: "Graphite", seed: 10 },
  { id: "p8", name: "Weekly Planner Pad", price: 14, rating: 4.7, reviews: 203, tag: "Bestseller", color: "Sand", seed: 14 },
  { id: "p9", name: "Brass Desk Clock", price: 89, rating: 4.9, reviews: 41, tag: "New", color: "Brass", seed: 15 },
];

export const PROJECTS = [
  { title: "Halcyon Health", kind: "Product design · 2026", text: "A patient app that turned a 14-step booking flow into three screens.", seed: 2 },
  { title: "Parcel Logistics", kind: "Brand & web · 2025", text: "Identity, site and motion system for a carbon-neutral courier.", seed: 6 },
  { title: "Meridian Bank", kind: "Design system · 2025", text: "A 120-component system shipped to 9 teams in 11 months.", seed: 9 },
  { title: "Tallow Candles", kind: "E-commerce · 2024", text: "Headless shop with a 31% lift in conversion after launch.", seed: 12 },
  { title: "Kestrel Studio", kind: "Editorial · 2024", text: "A typographic magazine for an architecture practice.", seed: 4 },
  { title: "Quanta Research", kind: "Data viz · 2023", text: "Interactive climate reports read by 2M people in a week.", seed: 15 },
];

const FIRST = ["Ada", "Bruno", "Chiara", "Dmitri", "Elif", "Farah", "Gustavo", "Hana", "Ivo", "Jonas", "Kaia", "Luca", "Mei", "Nadia", "Omar", "Pia", "Quentin", "Rosa", "Sven", "Tara", "Umar", "Vera", "Wen", "Ximena", "Yusuf", "Zoe"];
const LAST = ["Okoro", "Silva", "Bianchi", "Volkov", "Yilmaz", "Haddad", "Rocha", "Sato", "Novak", "Berg", "Tamm", "Ferri", "Chen", "Karim", "Aziz", "Lund", "Moreau", "Diaz", "Holm", "Rao"];
const COMPANIES = ["Northwind", "Halcyon", "Brightline", "Oddfellow", "Parcel", "Meridian", "Tallow", "Quanta", "Fieldnote", "Kestrel"];
const STATUS = ["Active", "Trial", "Churn risk", "Paused"] as const;
const PLANS_SHORT = ["Starter", "Team", "Scale"] as const;

export interface Customer {
  id: string;
  name: string;
  email: string;
  company: string;
  plan: (typeof PLANS_SHORT)[number];
  status: (typeof STATUS)[number];
  mrr: number;
  seats: number;
  lastSeen: string;
}

export const CUSTOMERS: Customer[] = Array.from({ length: 64 }, (_, i) => {
  const f = FIRST[(i * 7) % FIRST.length];
  const l = LAST[(i * 11) % LAST.length];
  const plan = PLANS_SHORT[(i * 5) % 3];
  return {
    id: `C-${1040 + i}`,
    name: `${f} ${l}`,
    email: `${f.toLowerCase()}.${l.toLowerCase()}@${COMPANIES[i % COMPANIES.length].toLowerCase()}.com`,
    company: COMPANIES[i % COMPANIES.length],
    plan,
    status: STATUS[(i * 3) % 4 === 3 ? 3 : (i * 13) % 7 === 0 ? 2 : (i * 3) % 5 === 0 ? 1 : 0],
    mrr: plan === "Starter" ? 0 : plan === "Team" ? 49 * (2 + (i % 9)) : 129 * (4 + (i % 12)),
    seats: 2 + ((i * 17) % 30),
    lastSeen: `${1 + ((i * 3) % 28)}d ago`,
  };
});

export const REVENUE = [38, 41, 40, 45, 49, 52, 50, 57, 61, 66, 64, 72];
export const REVENUE_PREV = [30, 33, 35, 36, 38, 40, 41, 43, 46, 47, 50, 52];
export const MONTHS = ["Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];
export const SIGNUPS = [120, 180, 140, 210, 260, 230, 310];
export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const CHANNELS = [
  { name: "Organic", data: [42], color: 1 },
  { name: "Referral", data: [23], color: 3 },
  { name: "Paid", data: [19], color: 4 },
  { name: "Partners", data: [16], color: 5 },
];

export const ACTIVITY: Array<{ title: string; time: string; body?: string; icon: IconName }> = [
  { title: "Halcyon upgraded to Scale", time: "12 min ago", body: "+$1,548 MRR · 12 seats", icon: "arrow-up-right" },
  { title: "Anomaly: checkout conversion −18%", time: "1 h ago", body: "Started after deploy #4821", icon: "alert-triangle" },
  { title: "Weekly report sent to #growth", time: "3 h ago", icon: "send" },
  { title: "Brightline invited 4 teammates", time: "Yesterday", icon: "users" },
  { title: "New dashboard: Activation v2", time: "Yesterday", body: "by Kofi Mensah", icon: "layout" },
];

export interface Task {
  id: string;
  title: string;
  tag: string;
  tagTone: "accent" | "info" | "success" | "warning" | "neutral";
  assignees: string[];
  due?: string;
  progress?: number;
  comments?: number;
}

export const KANBAN: Array<{ id: string; title: string; tasks: Task[] }> = [
  {
    id: "backlog",
    title: "Backlog",
    tasks: [
      { id: "t1", title: "Cohort export to CSV with custom columns", tag: "Feature", tagTone: "info", assignees: ["Mei Chen"], comments: 3 },
      { id: "t2", title: "Audit event names in the iOS app", tag: "Data", tagTone: "neutral", assignees: ["Omar Aziz", "Pia Lund"] },
      { id: "t3", title: "Dark mode for embedded charts", tag: "Design", tagTone: "accent", assignees: ["Tara Rao"], due: "Dec 2" },
    ],
  },
  {
    id: "progress",
    title: "In progress",
    tasks: [
      { id: "t4", title: "Natural-language filters: date ranges", tag: "Feature", tagTone: "info", assignees: ["Inês Duarte", "Kofi Mensah"], progress: 64, comments: 12, due: "Nov 26" },
      { id: "t5", title: "Reduce p99 ingest latency below 200ms", tag: "Infra", tagTone: "warning", assignees: ["Sven Holm"], progress: 38 },
    ],
  },
  {
    id: "review",
    title: "In review",
    tasks: [{ id: "t6", title: "Onboarding checklist v3", tag: "Growth", tagTone: "success", assignees: ["Rosa Diaz", "Luca Ferri"], progress: 92, comments: 7, due: "Nov 21" }],
  },
  {
    id: "done",
    title: "Done",
    tasks: [
      { id: "t7", title: "SAML SSO for Scale workspaces", tag: "Security", tagTone: "neutral", assignees: ["Jonas Berg"], comments: 4 },
      { id: "t8", title: "Retention heatmap redesign", tag: "Design", tagTone: "accent", assignees: ["Tara Rao", "Mei Chen"] },
    ],
  },
];

export const THREADS = [
  { id: "m1", name: "Priya Raman", company: "Halcyon", preview: "Can we get the funnel export before Thursday's board meeting?", time: "09:42", unread: true },
  { id: "m2", name: "Tomás Ibarra", company: "Parcel", preview: "Thanks — the cohort builder walkthrough was great.", time: "08:15", unread: true },
  { id: "m3", name: "Hannah Okafor", company: "Brightline", preview: "We're seeing duplicate events from the Android SDK since 4.2.", time: "Yesterday" },
  { id: "m4", name: "Billing", company: "Lumen", preview: "Invoice INV-2291 for November is ready.", time: "Yesterday" },
  { id: "m5", name: "Kofi Mensah", company: "Lumen", preview: "Pushed a fix for the timezone bug in weekly reports.", time: "Mon" },
  { id: "m6", name: "Elif Yilmaz", company: "Meridian", preview: "Do you support data residency in Switzerland?", time: "Mon" },
];

export const MESSAGES = [
  { from: "Priya Raman", me: false, text: "Morning! Can we get the onboarding funnel export before Thursday's board meeting?", time: "09:31" },
  { from: "Me", me: true, text: "Absolutely. Do you want it split by acquisition channel, or the overall view?", time: "09:34" },
  { from: "Priya Raman", me: false, text: "Split by channel please — and if possible, flag the step where paid traffic drops.", time: "09:38" },
  { from: "Priya Raman", me: false, text: "Our board keeps asking why paid converts worse after week one.", time: "09:42" },
];

export const EVENTS = [
  { date: "2026-11-03", title: "Sprint planning" },
  { date: "2026-11-06", title: "Halcyon QBR" },
  { date: "2026-11-11", title: "Design review" },
  { date: "2026-11-13", title: "Launch: Lumen 4.1" },
  { date: "2026-11-18", title: "Board prep" },
  { date: "2026-11-18", title: "1:1 Kofi" },
  { date: "2026-11-20", title: "Customer webinar" },
  { date: "2026-11-24", title: "Offsite — Lisbon" },
  { date: "2026-11-25", title: "Offsite — Lisbon" },
  { date: "2026-11-27", title: "Invoice run" },
];

export const DOCS_NAV = [
  { label: "Getting started", items: ["Introduction", "Install the SDK", "Your first event", "Identify users"] },
  { label: "Concepts", items: ["Events & properties", "Cohorts", "Funnels", "Retention"] },
  { label: "API", items: ["Authentication", "Query API", "Export API", "Webhooks"] },
];
