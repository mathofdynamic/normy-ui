"use client";

import NextLink from "next/link";
import { useState, type ReactNode } from "react";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  CommandPalette,
  Container,
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
  Drawer,
  Dropdown,
  Feature,
  Grid,
  Hero,
  IconButton,
  Input,
  Link,
  Media,
  PageHeader,
  Popover,
  Price,
  Row,
  Section,
  Select,
  Stack,
  Stat,
  Switch,
  Tabs,
  Text,
  Tooltip,
  useToast,
} from "@/components/normy";
import { COMPONENTS } from "@/engine/components";
import { replay as replayMotion } from "@/engine/runtime/motion";
import type { StateName } from "@/engine/types";
import { Forced, SAMPLES } from "./atlas";
import { COMPONENTS_PATH } from "./component-list";

/* ------------------------------------------------------------------ *
 * Motion workspace — the canvas side of the Studio's Motion section.
 * One page per kind of motion, built from real components so every
 * edit in the Motion panel shows here (and on every page) at once:
 *   /preview/motion-studio/entrance     how things appear, and in what order
 *   /preview/motion-studio/open-close   pop-ups, menus, dialogs, drawers, toasts
 *   /preview/motion-studio/interactive  hover, press, focus, loading
 *   /preview/motion-studio/loops        everything that moves on its own
 * ------------------------------------------------------------------ */

import { INTERACTIVE_LIST, LOOP_TYPES, MOTION_TABS, type MotionTab } from "./motion-list";

export { MOTION_PATH, MOTION_TABS } from "./motion-list";

const replay = () => setTimeout(() => replayMotion(document), 0);

function Head({ tab, children }: { tab: MotionTab; children?: ReactNode }) {
  const t = MOTION_TABS.find((x) => x.id === tab)!;
  return <PageHeader eyebrow="Motion" title={t.label} description={t.hint} actions={children} />;
}

/* ---------------- entrance ---------------- */

function EntranceStage() {
  const [key, setKey] = useState(0);
  return (
    <>
      <Section size="sm">
        <Container>
          <Head tab="entrance">
            <Button
              icon="play"
              onClick={() => {
                setKey((k) => k + 1);
                replay();
              }}
            >
              Replay entrance
            </Button>
          </Head>
        </Container>
      </Section>
      <div key={key}>
        <Hero
          eyebrow={<Badge variant="accent">New · Motion</Badge>}
          title="Everything arrives in its own time."
          lead="Each block on this page uses your entrance settings. Change the effect, speed or sequence in the panel and press Replay."
          actions={
            <>
              <Button>Get started</Button>
              <Button variant="outline">See how</Button>
            </>
          }
          media={<Media seed={4} alt="" ratio="4 / 3" variant="rounded" />}
        />
        <Section>
          <Container>
            <Stack gap={6}>
              <Stack gap={2}>
                <Text variant="caption">A row of features — they share one sequence</Text>
              </Stack>
              <Grid cols={{ base: 1, md: 3 }} gap={5}>
                <Feature variant="card" icon="zap" title="Fast by default">
                  Sub-second answers on every chart.
                </Feature>
                <Feature variant="card" icon="users" title="Made for teams">
                  Share a view, not a spreadsheet.
                </Feature>
                <Feature variant="card" icon="sparkle" title="Quietly smart">
                  It points at what changed and why.
                </Feature>
              </Grid>
            </Stack>
          </Container>
        </Section>
        <Section variant="muted">
          <Container>
            <Stack gap={6}>
              <Text variant="caption">Cards and stats further down only animate once you scroll to them</Text>
              <Grid cols={{ base: 1, md: 2, lg: 4 }} gap={4}>
                <Stat label="Revenue" value="$48.2k" delta="+12%" />
                <Stat label="Active users" value="3,904" delta="+4%" />
                <Stat label="Churn" value="1.8%" delta="-0.3%" trend="down" />
                <Stat label="NPS" value="62" delta="+5" />
              </Grid>
              <Grid cols={{ base: 1, md: 3 }} gap={5}>
                {["Starter", "Team", "Scale"].map((name, i) => (
                  <Card key={name} variant={i === 1 ? "raised" : "outline"}>
                    <CardHeader title={name} description={i === 1 ? "Most teams pick this" : "Everything to begin"} />
                    <CardBody>
                      <Price amount={[0, 49, 129][i]} period="seat / mo" />
                    </CardBody>
                  </Card>
                ))}
              </Grid>
            </Stack>
          </Container>
        </Section>
      </div>
    </>
  );
}

/* ---------------- open & close ---------------- */

function Tile({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  return (
    <Card variant="outline">
      <CardBody>
        <Stack gap={3}>
          <Stack gap={1}>
            <Text variant="strong">{title}</Text>
            <Text variant="small">{hint}</Text>
          </Stack>
          <Row gap={2} wrap>
            {children}
          </Row>
        </Stack>
      </CardBody>
    </Card>
  );
}

function OpenCloseStage() {
  const toast = useToast();
  const [drawer, setDrawer] = useState<null | "right" | "left" | "bottom">(null);
  const [palette, setPalette] = useState(false);
  return (
    <>
      <Section size="sm">
        <Container>
          <Stack gap={5}>
            <Head tab="open-close" />
            <Text>Open each one, then close it (Esc, click outside, or the close button). Closing is always quicker than opening, so it gets out of the way.</Text>
            <Grid cols={{ base: 1, md: 2, lg: 3 }} gap={4}>
              <Tile title="Dialog" hint="Centred modal with a backdrop">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>Open dialog</Button>
                  </DialogTrigger>
                  <DialogContent
                    title="Invite your team"
                    description="They will get an email with a link."
                    footer={
                      <>
                        <DialogClose asChild>
                          <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <DialogClose asChild>
                          <Button>Send invites</Button>
                        </DialogClose>
                      </>
                    }
                  >
                    <Input label="Email addresses" placeholder="ana@example.com, li@example.com" />
                  </DialogContent>
                </Dialog>
              </Tile>
              <Tile title="Drawer" hint="Slides in from an edge">
                {(["right", "left", "bottom"] as const).map((v) => (
                  <Button key={v} variant="outline" onClick={() => setDrawer(v)}>
                    {v === "bottom" ? "Bottom sheet" : `From ${v}`}
                  </Button>
                ))}
                <Drawer open={drawer !== null} onOpenChange={(o) => !o && setDrawer(null)} variant={drawer ?? "right"} title="Filters" description="Narrow the list down.">
                  <Stack gap={4}>
                    <Switch label="Only active customers" defaultChecked />
                    <Switch label="Include trials" />
                  </Stack>
                </Drawer>
              </Tile>
              <Tile title="Menu" hint="Drop-down list of actions">
                <Dropdown
                  align="start"
                  trigger={
                    <Button variant="outline" icon="menu">
                      Actions
                    </Button>
                  }
                  items={[{ label: "Rename", icon: "pencil" }, { label: "Duplicate", icon: "copy" }, { label: "Share", icon: "users" }, { type: "separator" }, { label: "Delete", icon: "trash" }]}
                />
              </Tile>
              <Tile title="Select" hint="A list of choices">
                <Select label="Plan" hideLabel options={[{ value: "starter", label: "Starter" }, { value: "team", label: "Team" }, { value: "scale", label: "Scale" }]} defaultValue="team" />
              </Tile>
              <Tile title="Popover" hint="Rich panel anchored to a button">
                <Popover trigger={<Button variant="outline">Open popover</Button>} title="Quick note">
                  <Text variant="small">Popovers carry a little more than a tooltip: a title, text, even a form.</Text>
                </Popover>
              </Tile>
              <Tile title="Tooltip" hint="Short label on hover or focus">
                <Tooltip content="Copies the link">
                  <IconButton icon="copy" label="Copy link" variant="outline" />
                </Tooltip>
                <Tooltip content="Notifications" side="bottom">
                  <IconButton icon="bell" label="Notifications" variant="outline" />
                </Tooltip>
              </Tile>
              <Tile title="Toast" hint="A message that comes and goes">
                <Button variant="outline" onClick={() => toast({ title: "Saved", description: "Your changes are live.", variant: "success" })}>
                  Show toast
                </Button>
                <Button variant="outline" onClick={() => toast({ title: "Heads up", description: "Your trial ends in 3 days.", variant: "warning" })}>
                  Warning toast
                </Button>
              </Tile>
              <Tile title="Command palette" hint="Search everything (Ctrl K in apps)">
                <Button variant="outline" icon="search" onClick={() => setPalette(true)}>
                  Open palette
                </Button>
                <CommandPalette
                  open={palette}
                  onOpenChange={setPalette}
                  items={[
                    { id: "new", label: "New project", group: "Create", icon: "plus", onSelect: () => {} },
                    { id: "invite", label: "Invite teammate", group: "Create", icon: "users", onSelect: () => {} },
                    { id: "settings", label: "Open settings", group: "Go to", icon: "settings", onSelect: () => {} },
                    { id: "billing", label: "Billing", group: "Go to", icon: "chart-line", onSelect: () => {} },
                  ]}
                />
              </Tile>
            </Grid>
          </Stack>
        </Container>
      </Section>
    </>
  );
}

/* ---------------- interactive ---------------- */

const RENDER: Record<string, () => ReactNode> = {
  button: () => <Button>Continue</Button>,
  "button-outline": () => <Button variant="outline">Cancel</Button>,
  iconButton: () => <IconButton icon="heart" label="Like" variant="outline" />,
  link: () => <Link href="#">Read the guide</Link>,
  card: () => (
    <Card variant="interactive" style={{ width: "13rem" }}>
      <CardBody>
        <Stack gap={1}>
          <Text variant="strong">Weekly report</Text>
          <Text variant="small">Opens the summary</Text>
        </Stack>
      </CardBody>
    </Card>
  ),
  chip: () => <Chip>Design</Chip>,
  input: () => <Input label="Name" hideLabel placeholder="Your name" />,
  switch: () => <Switch label="Email me" defaultChecked />,
  tabs: () => (
    <Tabs
      label="Range"
      items={[
        { value: "d", label: "Day", content: null },
        { value: "w", label: "Week", content: null },
        { value: "m", label: "Month", content: null },
      ]}
    />
  ),
};
const INTERACTIVE_TARGETS = INTERACTIVE_LIST.map((t) => ({ ...t, render: () => RENDER[t.id]?.() }));

const COLS: Array<{ state: StateName | null; label: string }> = [
  { state: null, label: "Rest" },
  { state: "hover", label: "Hover" },
  { state: "active", label: "Pressed" },
  { state: "focus", label: "Focus" },
  { state: "disabled", label: "Disabled" },
];

function InteractiveStage() {
  return (
    <>
      <Section size="sm">
        <Container>
          <Stack gap={5}>
            <Head tab="interactive" />
            <Text>Every state side by side, frozen, plus a live one to try with your mouse or keyboard (Tab). Pick a kind of element in the panel to change how it reacts.</Text>
            <div style={{ overflowX: "auto" }}>
              <table style={{ borderCollapse: "separate", borderSpacing: "0 var(--n-space-3)", width: "100%", minWidth: "60rem" }}>
                <thead>
                  <tr>
                    <th />
                    {COLS.map((c) => (
                      <th key={c.label} style={{ textAlign: "start" }}>
                        <Text variant="caption" as="span">
                          {c.label}
                        </Text>
                      </th>
                    ))}
                    <th style={{ textAlign: "start" }}>
                      <Text variant="caption" as="span">
                        Try it
                      </Text>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {INTERACTIVE_TARGETS.map((t) => (
                    <tr key={t.id} id={`i-${t.id}`}>
                      <th style={{ textAlign: "start", paddingInlineEnd: "var(--n-space-4)", verticalAlign: "middle" }}>
                        <Text variant="strong" as="span">
                          {t.label}
                        </Text>
                      </th>
                      {COLS.map((c) => (
                        <td key={c.label} style={{ verticalAlign: "middle", paddingInlineEnd: "var(--n-space-4)" }}>
                          <div inert style={{ pointerEvents: "none" }}>
                            {c.state ? <Forced states={[c.state]}>{t.render()}</Forced> : t.render()}
                          </div>
                        </td>
                      ))}
                      <td style={{ verticalAlign: "middle" }}>{t.render()}</td>
                    </tr>
                  ))}
                  <tr>
                    <th style={{ textAlign: "start", verticalAlign: "middle" }}>
                      <Text variant="strong" as="span">
                        Loading
                      </Text>
                    </th>
                    <td colSpan={6}>
                      <Row gap={3}>
                        <Button loading>Saving</Button>
                        <Button variant="outline" loading>
                          Loading
                        </Button>
                      </Row>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Stack>
        </Container>
      </Section>
    </>
  );
}

/* ---------------- loops ---------------- */

function LoopsStage() {
  const loops = LOOP_TYPES.map((t) => COMPONENTS.find((c) => c.type === t)).filter((c): c is NonNullable<typeof c> => !!c && !!SAMPLES[c.type]);
  return (
    <>
      <Section size="sm">
        <Container>
          <Stack gap={5}>
            <Head tab="loops" />
            <Text>Components that move on their own, forever, without a seam. They pause when off screen and can pause on hover. Open one to edit every detail.</Text>
            <Grid cols={{ base: 1, lg: 2 }} gap={5}>
              {loops.map((c) => (
                <Card key={c.type} variant="outline">
                  <CardHeader
                    title={c.label}
                    description={c.description}
                    action={
                      <NextLink href={`${COMPONENTS_PATH}/${c.type}`} style={{ color: "var(--n-color-accent-text)", fontSize: "var(--n-text-sm)" }}>
                        Open
                      </NextLink>
                    }
                  />
                  <CardBody>
                    <div style={{ minHeight: "10rem", display: "grid", alignItems: "center", overflow: "hidden" }}>{SAMPLES[c.type](c.defaultVariant ?? c.variants[0] ?? "default", c.defaultSize)}</div>
                  </CardBody>
                </Card>
              ))}
            </Grid>
          </Stack>
        </Container>
      </Section>
    </>
  );
}

export function MotionWorkspace({ tab }: { tab: string }) {
  if (tab === "open-close") return <OpenCloseStage />;
  if (tab === "interactive") return <InteractiveStage />;
  if (tab === "loops") return <LoopsStage />;
  return <EntranceStage />;
}
