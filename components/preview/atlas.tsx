"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Accordion,
  Alert,
  Avatar,
  AvatarGroup,
  Badge,
  Box,
  Breadcrumb,
  Button,
  Calendar,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Carousel,
  Chart,
  Checkbox,
  Chip,
  Code,
  Combobox,
  Container,
  DataList,
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
  Divider,
  Drawer,
  Dropdown,
  EmptyState,
  Feature,
  Footer,
  Grid,
  Heading,
  Hero,
  IconButton,
  Input,
  Kbd,
  Link,
  Marquee,
  Media,
  Navbar,
  PageHeader,
  Pagination,
  Popover,
  Price,
  Progress,
  Quote,
  RadioGroup,
  Row,
  Section,
  SegmentedControl,
  Select,
  Sidebar,
  Skeleton,
  Slider,
  Spinner,
  Stack,
  Stat,
  Stepper,
  Switch,
  Table,
  TBody,
  Td,
  Text,
  Textarea,
  Th,
  THead,
  Timeline,
  Tooltip,
  Tr,
  Tabs,
  useToast,
  CommandPalette,
} from "@/components/normy";
import { Icon } from "@/components/normy/icon";
import { COMPONENTS } from "@/engine/components";
import type { StateName } from "@/engine/types";
import { CATS } from "./component-list";

/* ------------------------------------------------------------------ *
 * Component Atlas — every component × variant × (size) × state.
 * States are frozen with data-n-force, exactly like the Studio does.
 * ------------------------------------------------------------------ */

import type { Sample } from "./sample-type";
import { LOOP_SAMPLES_A, LOOP_WIDE_A } from "./samples-loops-a";
import { LOOP_SAMPLES_B, LOOP_WIDE_B } from "./samples-loops-b";
import { LOOP_SAMPLES_C, LOOP_WIDE_C } from "./samples-loops-c";
import { LOOP_SAMPLES_D, LOOP_WIDE_D } from "./samples-loops-d";

export function Forced({ states, children }: { states: StateName[]; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !states.length) return;
    const nodes = el.querySelectorAll<HTMLElement>("[data-n], [data-n-part]");
    nodes.forEach((n) => n.setAttribute("data-n-force", states.join(" ")));
    return () => nodes.forEach((n) => n.removeAttribute("data-n-force"));
  }, [states]);
  return (
    <div ref={ref} style={{ minWidth: 0 }}>
      {children}
    </div>
  );
}

function ToastDemo() {
  const toast = useToast();
  return (
    <Button variant="outline" size="sm" onClick={() => toast({ title: "Report exported", description: "cohorts-nov.csv · 2.4 MB", variant: "success", action: { label: "Open", onClick: () => {} } })}>
      Show toast
    </Button>
  );
}

function PaletteDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" size="sm" icon="command" onClick={() => setOpen(true)}>
        Open palette
      </Button>
      <CommandPalette open={open} onOpenChange={setOpen} items={[{ id: "a", label: "New report", group: "Create", icon: "plus", onSelect: () => {} }, { id: "b", label: "Invite teammate", group: "Create", icon: "users", onSelect: () => {} }, { id: "c", label: "Toggle dark mode", group: "View", icon: "moon", onSelect: () => {} }]} />
    </>
  );
}

function DrawerDemo({ v }: { v: string }) {
  return (
    <Drawer variant={v} title="Filters" description="Refine the customer list" trigger={<Button variant="outline" size="sm">Open {v} drawer</Button>} footer={<Button size="sm">Apply</Button>}>
      <Stack gap={4}>
        <Checkbox label="Active only" defaultChecked />
        <Slider label="Min seats" defaultValue={5} max={30} />
      </Stack>
    </Drawer>
  );
}

export const SAMPLES: Record<string, Sample> = {
  icon: (v) => (
    <Row gap={3} wrap>
      {(["chart-line", "users", "bell", "sparkle", "settings", "heart"] as const).map((n) => (
        <Icon key={n} name={n} variant={v} />
      ))}
    </Row>
  ),
  box: (v, s) => (
    <Box variant={s ? "outline" : v} size={s ?? "md"}>
      <Text variant="small">Box · {v}</Text>
    </Box>
  ),
  stack: () => (
    <Stack gap={2}>
      {[1, 2, 3].map((i) => (
        <Box key={i} variant="sunken" size="sm">
          <Text variant="caption">Item {i}</Text>
        </Box>
      ))}
    </Stack>
  ),
  grid: () => (
    <Grid cols={3} gap={2}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Box key={i} variant="sunken" size="sm">
          <Text variant="caption">{i}</Text>
        </Box>
      ))}
    </Grid>
  ),
  container: (v) => (
    <Box variant="outline" size="sm">
      <Container variant={v}>
        <Box variant="sunken" size="sm">
          <Text variant="caption">Container · {v}</Text>
        </Box>
      </Container>
    </Box>
  ),
  section: (v, s) => (
    <Section variant={v} size={s ?? "sm"}>
      <Container>
        <Text>Section · {v}</Text>
      </Container>
    </Section>
  ),
  divider: (v) => (v === "vertical" ? <Row gap={3} style={{ height: 32 }}>A<Divider variant="vertical" />B</Row> : v === "labelled" ? <Divider label="or" /> : <Divider variant={v} />),
  heading: (v) => <Heading variant={v}>{v === "eyebrow" ? "Eyebrow label" : "Know why it grows"}</Heading>,
  text: (v) => <Text variant={v}>Analytics that answers the next question.</Text>,
  link: (v) => (
    <Link href="/preview/atlas" variant={v} icon="arrow-right">
      Read the guide
    </Link>
  ),
  code: (v) => (v === "block" ? <Code variant="block">{`lumen.track("signup", {\n  plan: "team"\n});`}</Code> : <Text>Call <Code>lumen.flush()</Code> first.</Text>),
  kbd: () => (
    <Row gap={1}>
      <Kbd>Ctrl</Kbd>
      <Kbd>K</Kbd>
    </Row>
  ),
  quote: (v) => (
    <Quote variant={v} cite="Priya Raman, Halcyon">
      We replaced three dashboards with one board.
    </Quote>
  ),
  button: (v, s) => (
    <Button variant={v} size={s} icon={v === "link" ? undefined : "plus"}>
      Button
    </Button>
  ),
  iconButton: (v, s) => <IconButton icon="settings" label="Settings" variant={v} size={s} />,
  badge: (v, s) => (
    <Badge variant={v} size={s} dot>
      {v}
    </Badge>
  ),
  chip: (v, s) => (
    <Row gap={2}>
      <Chip variant={v} size={s}>
        Filter
      </Chip>
      <Chip variant={v} size={s} onRemove={() => {}}>
        Tag
      </Chip>
    </Row>
  ),
  avatar: (v, s) => <Avatar name="Inês Duarte" variant={v} size={s} status />,
  avatarGroup: () => <AvatarGroup names={["Ada L", "Grace H", "Alan T", "Mei C", "Omar A", "Pia L"]} />,
  spinner: (v, s) => <Spinner variant={v} size={s} />,
  skeleton: (v) => <Skeleton variant={v} />,
  media: (v) => <Media variant={v} seed={5} alt="" caption="Fig. 1" ratio="16 / 10" />,
  input: (v, s) => <Input variant={v} size={s} label="Email" required icon="mail" placeholder="you@lumen.dev" hint="Work address" />,
  textarea: (v) => <Textarea variant={v} label="Bio" rows={2} showCount maxLength={120} defaultValue="Growth lead" />,
  select: (v, s) => <Select variant={v} size={s} label="Plan" required defaultValue="team" options={[{ value: "starter", label: "Starter" }, { value: "team", label: "Team" }]} />,
  combobox: (v) => <Combobox variant={v} label="Timezone" options={["Europe/Lisbon", "Europe/Berlin", "America/Montreal"]} value="Europe/Lisbon" />,
  checkbox: (v, s) => <Checkbox variant={v} size={s} label="Weekly digest" description="Monday 08:00" defaultChecked />,
  radio: (v) => <RadioGroup variant={v} legend="Billing" options={[{ value: "m", label: "Monthly" }, { value: "y", label: "Yearly", description: "Save 20%" }]} />,
  switch: (v, s) => <Switch variant={v} size={s} label="Alerts" description="Email me" defaultChecked />,
  slider: (v) => <Slider variant={v} label="Volume" defaultValue={60} ticks={5} />,
  segmented: (v, s) => <SegmentedControl variant={v} size={s} label="Range" options={[{ value: "d", label: "Day" }, { value: "w", label: "Week" }, { value: "m", label: "Month" }]} defaultValue="w" />,
  tabs: (v, s) => <Tabs variant={v} size={s} label="Tabs" items={[{ value: "a", label: "Overview", content: <Text variant="small">Overview panel</Text> }, { value: "b", label: "Activity", content: <Text variant="small">Activity panel</Text> }, { value: "c", label: "Settings", content: <Text variant="small">Settings panel</Text> }]} />,
  accordion: (v) => <Accordion variant={v} defaultValue="a" items={[{ value: "a", title: "What counts as an event?", content: "Any action you send." }, { value: "b", title: "Can I change plans?", content: "Yes, any time." }]} />,
  breadcrumb: (v) => <Breadcrumb variant={v} items={[{ label: "Docs", href: "/preview/atlas" }, { label: "Concepts", href: "/preview/atlas" }, { label: "Cohorts" }]} />,
  pagination: (v, s) => <Pagination variant={v} size={s} page={3} total={9} onPageChange={() => {}} summary="21–30 of 84" />,
  navbar: (v) => <Navbar variant={v} brand={<><Icon name="sparkle" />Lumen</>} links={[{ label: "Product", href: "/preview/atlas", current: true }, { label: "Pricing", href: "/preview/atlas" }]} actions={<Button size="sm">Start</Button>} />,
  sidebar: (v) => (
    <div style={{ height: 260, overflow: "hidden" }}>
      <Sidebar variant={v} sections={[{ label: "Workspace", items: [{ label: "Overview", href: "/preview/atlas", icon: "home", current: true }, { label: "Inbox", href: "/preview/atlas", icon: "inbox", count: 12 }, { label: "Settings", href: "/preview/atlas", icon: "settings" }] }]} />
    </div>
  ),
  dropdown: () => <Dropdown trigger={<Button variant="outline" size="sm" iconEnd="chevron-down">Actions</Button>} items={[{ type: "label", label: "Report" }, { label: "Duplicate", icon: "copy", shortcut: "Ctrl D" }, { label: "Share", icon: "share" }, { type: "separator" }, { label: "Delete", icon: "trash" }]} />,
  stepper: (v) => <Stepper variant={v} current={1} steps={[{ label: "Plan" }, { label: "Details" }, { label: "Pay" }]} />,
  card: (v, s) => (
    <Card variant={v} size={s}>
      <CardHeader eyebrow="Release" title="Tokens freeze" action={<Badge>Fri</Badge>} />
      <CardBody>Lock the tokens before beta.</CardBody>
      <CardFooter>
        <Button size="xs">Approve</Button>
      </CardFooter>
    </Card>
  ),
  table: (v, s) => (
    <Table variant={v} size={s} label="Sample table">
      <THead>
        <Tr>
          <Th>Name</Th>
          <Th sorted="desc">MRR</Th>
        </Tr>
      </THead>
      <TBody>
        <Tr>
          <Td>Halcyon</Td>
          <Td>$1,806</Td>
        </Tr>
        <Tr selected>
          <Td>Parcel</Td>
          <Td>$1,419</Td>
        </Tr>
      </TBody>
    </Table>
  ),
  stat: (v, s) => <Stat variant={v} size={s} label="MRR" icon="credit-card" value="$72,410" delta="12.4%" meta="vs Oct" />,
  chart: (v) => <Chart variant={v} kind="area" label="Sample" labels={["M", "T", "W", "T", "F"]} series={[{ name: "A", data: [3, 5, 4, 7, 9] }, { name: "B", data: [2, 3, 3, 4, 5], color: 3 }]} height={140} />,
  calendar: (v) => <Calendar variant={v} events={[{ date: "2026-11-20", title: "Webinar" }]} selected="2026-11-20" />,
  progress: (v, s) => <Progress variant={v} size={s} label="Upload" value={62} showValue />,
  timeline: (v) => <Timeline variant={v} items={[{ title: "Halcyon upgraded", time: "12 min ago", icon: "arrow-up-right" }, { title: "Report sent", time: "3 h ago", icon: "send" }]} />,
  dataList: (v) => <DataList variant={v} items={[["Seats", "14"], ["Plan", "Team"], ["Renews", "Dec 1"]]} />,
  tooltip: () => (
    <Tooltip content="Duplicate this page" shortcut="Ctrl D">
      <Button variant="outline" size="sm">
        Hover or focus me
      </Button>
    </Tooltip>
  ),
  popover: () => (
    <Popover trigger={<Button variant="outline" size="sm">Open popover</Button>} title="Share report">
      <Input label="Invite" hideLabel required placeholder="name@company.com" size="sm" />
    </Popover>
  ),
  dialog: (v) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Open {v} dialog
        </Button>
      </DialogTrigger>
      <DialogContent variant={v} eyebrow="Settings" title="Rename project" description="The URL updates too." footer={<><DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose><DialogClose asChild><Button>Save</Button></DialogClose></>}>
        <Input label="Name" required defaultValue="Lumen Growth" />
      </DialogContent>
    </Dialog>
  ),
  drawer: (v) => <DrawerDemo v={v} />,
  toast: () => <ToastDemo />,
  toaster: () => <Text variant="caption">Viewport for toasts — see Toast.</Text>,
  commandPalette: () => <PaletteDemo />,
  dock: () => <Text variant="caption">Floating pill — see the preview toolbar bottom-right.</Text>,
  alert: (v, s) => (
    <Alert variant={v} size={s} title="Heads up">
      Your trial ends in 3 days.
    </Alert>
  ),
  emptyState: (v) => <EmptyState variant={v} icon="inbox" title="No projects yet" description="Create one to get started." actions={<Button size="sm">New project</Button>} />,
  carousel: (v) => (
    <Carousel variant={v} label="Sample carousel">
      {[2, 7, 12].map((s) => (
        <Media key={s} seed={s} alt="" ratio="16 / 8" variant="bleed" />
      ))}
    </Carousel>
  ),
  marquee: (v) => (
    <Marquee variant={v} label="Sample marquee">
      {["Halcyon", "Parcel", "Meridian", "Tallow", "Quanta"].map((x) => (
        <Text key={x} variant="strong" as="span">
          {x}
        </Text>
      ))}
    </Marquee>
  ),
  hero: (v) => <Hero variant={v} eyebrow={<Badge variant="accent">New</Badge>} title="Know why it grows." lead="Answers your whole team can read." actions={<Button>Start</Button>} media={v === "split" ? <Media seed={3} alt="" /> : undefined} />,
  footer: (v) => <Footer variant={v} brand={<Text variant="strong">Lumen</Text>} columns={[{ title: "Product", links: [{ label: "Pricing", href: "/preview/atlas" }] }, { title: "Company", links: [{ label: "About", href: "/preview/atlas" }] }]} bottom="© 2026" />,
  feature: (v) => (
    <Feature variant={v} icon="zap" number={v === "numbered" ? "01" : undefined} title="Sub-second queries">
      Answers before you blink.
    </Feature>
  ),
  price: (v) => <Price variant={v} amount={49} period="seat / mo" strike="$59" />,
  appShell: () => <Text variant="caption">Dashboard frame — see the Dashboard pages.</Text>,
  pageHeader: (v) => <PageHeader variant={v} eyebrow="Workspace" title="Customers" description="64 accounts" actions={<Button size="sm">Add</Button>} />,
  ...LOOP_SAMPLES_A,
  ...LOOP_SAMPLES_B,
  ...LOOP_SAMPLES_C,
  ...LOOP_SAMPLES_D,
};

export { CATS } from "./component-list";

export const WIDE = new Set(["section", "navbar", "hero", "footer", "carousel", "marquee", "table", "chart", "calendar", "sidebar", "card", "pageHeader", "tabs", "accordion", "media", ...LOOP_WIDE_A, ...LOOP_WIDE_B, ...LOOP_WIDE_C, ...LOOP_WIDE_D]);
export const STATE_COLS: StateName[] = ["hover", "focus", "active", "disabled", "selected", "error", "loading", "open", "current"];

export function Atlas() {
  const [q, setQ] = useState("");
  const [showStates, setShowStates] = useState(true);
  const list = useMemo(() => COMPONENTS.filter((c) => !q || `${c.label} ${c.type} ${c.category}`.toLowerCase().includes(q.toLowerCase())), [q]);
  const total = COMPONENTS.reduce((a, c) => a + Math.max(1, c.variants.length) * Math.max(1, c.sizes.length) * (1 + c.states.length), 0);
  return (
    <Section size="sm">
      <Container variant="wide">
        <Stack gap={10}>
          <PageHeader
            variant="large"
            eyebrow="Labs · Component Atlas"
            title={`${COMPONENTS.length} components, every variant and state`}
            description={`${total.toLocaleString()} variant × size × state combinations, all driven by the active design system. States are frozen with data-n-force.`}
            actions={
              <>
                <Input label="Filter components" hideLabel required size="sm" icon="search" placeholder="Filter…" value={q} onChange={(e) => setQ(e.target.value)} />
                <Switch label="States" checked={showStates} onCheckedChange={setShowStates} size="sm" />
              </>
            }
          />
          {CATS.map((cat) => {
            const items = list.filter((c) => c.category === cat.id);
            if (!items.length) return null;
            return (
              <Stack key={cat.id} gap={6} as="section" aria-label={cat.label}>
                <Heading variant="h3">{cat.label}</Heading>
                {items.map((c) => {
                  const sample = SAMPLES[c.type];
                  const variants = c.variants.length ? c.variants : ["default"];
                  const states = STATE_COLS.filter((s) => c.states.includes(s));
                  return (
                    <Card key={c.type} variant="outline" nid={`atlas-${c.type}`}>
                      <CardHeader eyebrow={`${c.category} · ${Object.keys(c.parts).length} parts`} title={c.label} description={c.description} action={<Badge variant="outline">{variants.length} variants</Badge>} />
                      <CardBody>
                        {!sample ? (
                          <Text variant="caption">No sample.</Text>
                        ) : (
                          <Stack gap={5}>
                            <Grid cols={WIDE.has(c.type) ? { base: 1, lg: 2 } : { base: 1, md: 2, lg: 4 }} gap={5}>
                              {variants.map((v) => (
                                <Stack key={v} gap={2}>
                                  <Text variant="label">·{v}</Text>
                                  {sample(v)}
                                </Stack>
                              ))}
                            </Grid>
                            {c.sizes.length > 1 ? (
                              <Stack gap={2}>
                                <Text variant="label">Sizes</Text>
                                <Row gap={5} wrap align="flex-start">
                                  {c.sizes.map((s) => (
                                    <Stack key={s} gap={1}>
                                      <Text variant="caption">{s}</Text>
                                      {sample(c.defaultVariant ?? variants[0], s)}
                                    </Stack>
                                  ))}
                                </Row>
                              </Stack>
                            ) : null}
                            {showStates && states.length ? (
                              <Stack gap={2}>
                                <Text variant="label">States (forced)</Text>
                                <Grid cols={WIDE.has(c.type) ? { base: 1, lg: 2 } : { base: 1, md: 2, lg: 4 }} gap={5}>
                                  {states.map((s) => (
                                    <Stack key={s} gap={1}>
                                      <Text variant="caption">:{s}</Text>
                                      <Forced states={[s]}>{sample(c.defaultVariant ?? variants[0])}</Forced>
                                    </Stack>
                                  ))}
                                </Grid>
                              </Stack>
                            ) : null}
                          </Stack>
                        )}
                      </CardBody>
                    </Card>
                  );
                })}
              </Stack>
            );
          })}
        </Stack>
      </Container>
    </Section>
  );
}
