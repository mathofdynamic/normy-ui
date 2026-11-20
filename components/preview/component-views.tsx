"use client";

import NextLink from "next/link";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  Badge,
  Breadcrumb,
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Container,
  Grid,
  Heading,
  Input,
  PageHeader,
  Row,
  Section,
  Stack,
  Table,
  TBody,
  Td,
  Text,
  Th,
  THead,
  Tr,
} from "@/components/normy";
import { COMPONENTS } from "@/engine/components";
import { onApply } from "@/engine/runtime/apply";
import { readEnter } from "@/engine/runtime/motion";
import type { ComponentDef } from "@/engine/types";
import { Forced, SAMPLES, STATE_COLS, WIDE } from "./atlas";
import { CATS, COMPONENTS_PATH } from "./component-list";

/* ------------------------------------------------------------------ *
 * Components views, shown inside the Studio canvas (and on their own):
 *  - Card view   /preview/components         every component as a card
 *  - Canvas view /preview/components/<type>  one component in full:
 *    variants, sizes, frozen states, motion behaviour, anatomy.
 * Everything renders from the active system, so Studio edits show live.
 * ------------------------------------------------------------------ */

const SHOWN = COMPONENTS.filter((c) => SAMPLES[c.type]);
const variantsOf = (c: ComponentDef) => (c.variants.length ? c.variants : ["default"]);
const defaultVariant = (c: ComponentDef) => c.defaultVariant ?? variantsOf(c)[0];

/**
 * A sample, fitted into a fixed stage: rendered at its natural size (wide components at a
 * desktop-like width), measured, then scaled down only as much as the stage needs.
 */
function Stage({ type, children, height = "12rem" }: { type: string; children: ReactNode; height?: string }) {
  // Narrow by nature even though the Atlas lays it out wide.
  const wide = WIDE.has(type) && type !== "sidebar";
  const stageRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState({ scale: 1, top: false });
  useEffect(() => {
    const stage = stageRef.current;
    const inner = innerRef.current;
    if (!stage || !inner) return;
    const fit = () => {
      const pad = 24;
      const sw = stage.clientWidth - pad * 2;
      const sh = stage.clientHeight - pad * 2;
      const iw = inner.scrollWidth;
      const ih = inner.scrollHeight;
      if (!iw || !ih) return;
      // Fit the whole sample when that keeps it readable; otherwise fit the width and show its top.
      const whole = Math.min(1, sw / iw, sh / ih);
      const byWidth = Math.min(1, sw / iw);
      setFit(whole >= byWidth * 0.75 ? { scale: whole, top: false } : { scale: byWidth, top: true });
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(stage);
    ro.observe(inner);
    return () => ro.disconnect();
  }, []);
  const stage: CSSProperties = {
    position: "relative",
    height,
    overflow: "hidden",
    borderRadius: "var(--n-radius-md)",
    background: "var(--n-color-surface-sunken)",
  };
  const inner: CSSProperties = {
    position: "absolute",
    left: "50%",
    top: fit.top ? "1.5rem" : "50%",
    width: wide ? "40rem" : "max-content",
    maxWidth: wide ? undefined : "26rem",
    transform: fit.top ? `translateX(-50%) scale(${fit.scale})` : `translate(-50%, -50%) scale(${fit.scale})`,
    transformOrigin: fit.top ? "top center" : "center",
    pointerEvents: "none",
  };
  return (
    <div ref={stageRef} style={stage} inert>
      <div ref={innerRef} style={inner}>
        {children}
      </div>
    </div>
  );
}

/* ---------------- card view ---------------- */

export function ComponentGallery() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const list = useMemo(
    () => SHOWN.filter((c) => (cat === "all" || c.category === cat) && (!q || `${c.label} ${c.type} ${c.description}`.toLowerCase().includes(q.toLowerCase()))),
    [q, cat],
  );
  return (
    <Section size="sm">
      <Container variant="wide">
        <Stack gap={8}>
          <PageHeader
            eyebrow="Components"
            title={`${SHOWN.length} components`}
            description="Every building block of the system. Open one to see all its variants, sizes, states and motion, and to edit it on its own."
            actions={<Input label="Find a component" hideLabel size="sm" icon="search" placeholder="Find a component…" value={q} onChange={(e) => setQ(e.target.value)} />}
          />
          <Row gap={2} wrap>
            <Chip selected={cat === "all"} onClick={() => setCat("all")}>
              All
            </Chip>
            {CATS.filter((c) => SHOWN.some((s) => s.category === c.id)).map((c) => (
              <Chip key={c.id} selected={cat === c.id} onClick={() => setCat(c.id)}>
                {c.label}
              </Chip>
            ))}
          </Row>
          {list.length ? (
            <Grid cols={{ base: 1, md: 2, lg: 3 }} gap={5}>
              {list.map((c) => (
                <GalleryCard key={c.type} c={c} />
              ))}
            </Grid>
          ) : (
            <Text variant="muted">No component matches “{q}”.</Text>
          )}
        </Stack>
      </Container>
    </Section>
  );
}

function GalleryCard({ c }: { c: ComponentDef }) {
  const v = variantsOf(c).length;
  const href = `${COMPONENTS_PATH}/${c.type}`;
  return (
    <Card variant="interactive" as="article" nid={`gallery-${c.type}`} style={{ position: "relative" }}>
      <CardBody>
        <Stack gap={4}>
          <Stage type={c.type}>{SAMPLES[c.type](defaultVariant(c))}</Stage>
          <Stack gap={1}>
            <Row gap={2} justify="space-between">
              <Heading variant="h4" as="h2">
                {c.label}
              </Heading>
              <Badge variant="outline">{CATS.find((x) => x.id === c.category)?.label ?? c.category}</Badge>
            </Row>
            <Text variant="small">{c.description}</Text>
            <Text variant="caption">
              {v} variant{v === 1 ? "" : "s"}
              {c.sizes.length ? ` · ${c.sizes.length} size${c.sizes.length === 1 ? "" : "s"}` : ""}
              {c.states.length ? ` · ${c.states.length} state${c.states.length === 1 ? "" : "s"}` : ""}
            </Text>
          </Stack>
        </Stack>
      </CardBody>
      <NextLink href={href} aria-label={`Open ${c.label}`} style={{ position: "absolute", inset: 0, borderRadius: "inherit" }} />
    </Card>
  );
}

/* ---------------- canvas view ---------------- */

export function ComponentDetail({ type }: { type: string }) {
  const c = SHOWN.find((x) => x.type === type);
  const [replayKey, setReplayKey] = useState(0);
  if (!c) {
    return (
      <Section size="sm">
        <Container>
          <Stack gap={4}>
            <Heading>No component called “{type}”</Heading>
            <Button href={COMPONENTS_PATH} variant="outline" icon="arrow-left">
              All components
            </Button>
          </Stack>
        </Container>
      </Section>
    );
  }
  const i = SHOWN.indexOf(c);
  const prev = SHOWN[(i - 1 + SHOWN.length) % SHOWN.length];
  const next = SHOWN[(i + 1) % SHOWN.length];
  const sample = SAMPLES[c.type];
  const variants = variantsOf(c);
  const states = STATE_COLS.filter((s) => c.states.includes(s));
  const wide = WIDE.has(c.type);
  const cols = wide ? { base: 1, lg: 2 } : { base: 1, md: 2, lg: 3 };
  return (
    <Section size="sm">
      <Container variant="wide">
        <Stack gap={10}>
          <Stack gap={5}>
            <Row gap={3} justify="space-between" wrap>
              <Breadcrumb items={[{ label: "Components", href: COMPONENTS_PATH }, { label: CATS.find((x) => x.id === c.category)?.label ?? c.category }, { label: c.label }]} />
              <Row gap={2}>
                <Button href={`${COMPONENTS_PATH}/${prev.type}`} variant="ghost" size="sm" icon="arrow-left">
                  {prev.label}
                </Button>
                <Button href={`${COMPONENTS_PATH}/${next.type}`} variant="ghost" size="sm" iconEnd="arrow-right">
                  {next.label}
                </Button>
              </Row>
            </Row>
            <PageHeader
              eyebrow={CATS.find((x) => x.id === c.category)?.label ?? c.category}
              title={c.label}
              description={c.description}
              actions={
                <Row gap={2} wrap>
                  <Badge variant="outline">{variants.length} variant{variants.length === 1 ? "" : "s"}</Badge>
                  {c.sizes.length ? <Badge variant="outline">{c.sizes.length} size{c.sizes.length === 1 ? "" : "s"}</Badge> : null}
                  {states.length ? <Badge variant="outline">{states.length} state{states.length === 1 ? "" : "s"}</Badge> : null}
                </Row>
              }
            />
          </Stack>

          <Block title="Variants" hint="Every style this component comes in. In the Studio, select one to edit just that style.">
            <Grid cols={cols} gap={5}>
              {variants.map((v) => (
                <Tile key={v} wide={wide} label={v} note={v === defaultVariant(c) ? "default" : undefined}>
                  {sample(v)}
                </Tile>
              ))}
            </Grid>
          </Block>

          {c.sizes.length > 1 ? (
            <Block title="Sizes" hint={`Shown in the ${defaultVariant(c)} variant.`}>
              <Grid cols={cols} gap={5}>
                {c.sizes.map((s) => (
                  <Tile key={s} wide={wide} label={s} note={s === c.defaultSize ? "default" : undefined}>
                    {sample(defaultVariant(c), s)}
                  </Tile>
                ))}
              </Grid>
            </Block>
          ) : null}

          {states.length ? (
            <Block title="States" hint="Frozen so you can compare them side by side. Edit each one with the state tabs in the Edit panel.">
              <Grid cols={cols} gap={5}>
                <Tile wide={wide} label="rest">{sample(defaultVariant(c))}</Tile>
                {states.map((s) => (
                  <Tile key={s} wide={wide} label={s}>
                    <Forced states={[s]}>{sample(defaultVariant(c))}</Forced>
                  </Tile>
                ))}
              </Grid>
            </Block>
          ) : null}

          <Block
            title="Motion"
            hint="How it enters, and how it answers the pointer. Hover, press and focus the live sample; replay the entrance after you change it."
            action={
              <Button variant="outline" size="sm" icon="refresh" onClick={() => setReplayKey((k) => k + 1)}>
                Replay entrance
              </Button>
            }
          >
            <Stack gap={5}>
              <MotionTable type={c.type} parts={Object.keys(c.parts)} replayKey={replayKey} />
              <Tile wide={wide} label="live">
                <div key={replayKey} data-normy-live="">
                  {sample(defaultVariant(c))}
                </div>
              </Tile>
            </Stack>
          </Block>

          <Block title="Anatomy" hint="The parts you can style on their own (Edit panel → Part).">
            <Table label={`${c.label} parts`}>
              <THead>
                <Tr>
                  <Th>Part</Th>
                  <Th>What it is</Th>
                </Tr>
              </THead>
              <TBody>
                {Object.entries(c.parts).filter(([k]) => k !== "root").map(([k, v]) => (
                  <Tr key={k}>
                    <Td>
                      <Text variant="mono" as="span">
                        {k}
                      </Text>
                    </Td>
                    <Td>{typeof v === "string" ? v : v.label}</Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </Block>
        </Stack>
      </Container>
    </Section>
  );
}

function Block({ title, hint, action, children }: { title: string; hint?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <Stack gap={5} as="section" aria-label={title}>
      <Row gap={4} justify="space-between" align="flex-end" wrap>
        <Stack gap={1}>
          <Heading variant="h3">{title}</Heading>
          {hint ? <Text variant="muted">{hint}</Text> : null}
        </Stack>
        {action}
      </Row>
      {children}
    </Stack>
  );
}

function Tile({ label, note, wide, children }: { label: string; note?: string; wide?: boolean; children: ReactNode }) {
  return (
    <Card variant="outline">
      <CardHeader eyebrow={note} title={label} level="h4" />
      <CardBody>
        <div style={{ minWidth: 0, display: "grid", alignContent: "center", justifyItems: wide ? "stretch" : "center", minHeight: "5rem" }}>{children}</div>
      </CardBody>
    </Card>
  );
}

/* ---------------- motion behaviour, read from the rendered component ---------------- */

interface MotionRow {
  element: string;
  entrance: string;
  interaction: string;
  scroll: string;
}

function describe(el: HTMLElement, label: string): MotionRow | null {
  const cs = getComputedStyle(el);
  const enter = readEnter(el);
  const entrance = enter ? `${enter.effect} · ${Math.round(enter.duration)}ms${enter.delay ? ` +${Math.round(enter.delay)}ms` : ""}${enter.stagger ? ` · stagger ${Math.round(enter.stagger)}ms` : ""} · on ${enter.trigger}` : "—";
  const props = cs.transitionProperty.split(",").map((s) => s.trim());
  const durs = cs.transitionDuration.split(",").map((s) => parseFloat(s) * (s.includes("ms") ? 1 : 1000));
  const longest = Math.max(0, ...durs);
  const fx = (n: string) => cs.getPropertyValue(`--n-fx-${n}`).trim();
  const bits: string[] = [];
  if (longest > 0) bits.push(`transitions ${props.slice(0, 3).join(", ")}${props.length > 3 ? "…" : ""} · ${Math.round(longest)}ms`);
  if (parseFloat(fx("magnetic")) > 0) bits.push("magnetic");
  if (parseFloat(fx("tilt")) > 0) bits.push("tilt");
  if (fx("ripple") === "on") bits.push("ripple");
  if (fx("spotlight") === "on") bits.push("spotlight");
  if (fx("cursor") && fx("cursor") !== "none") bits.push(`cursor ${fx("cursor")}`);
  if (fx("press") && fx("press") !== "1") bits.push(`press scale ${fx("press")}`);
  const sc = cs.getPropertyValue("--n-scroll").trim();
  const other: string[] = [];
  if (sc && sc !== "none") other.push(`scroll ${sc}`);
  if (el.hasAttribute("data-n-loop")) {
    const v = (n: string) => cs.getPropertyValue(n).trim();
    other.push(`loop ${v("--n-loop-duration") || "default length"} at ${v("--n-loop-speed") || "1"}×${v("--n-loop-direction") === "reverse" ? " reversed" : ""}`);
  }
  const names = cs.animationName.split(",").map((x) => x.trim());
  const counts = cs.animationIterationCount.split(",").map((x) => x.trim());
  const looping = names.filter((n, i) => n !== "none" && (counts[i] ?? counts[0]) === "infinite");
  if (looping.length) other.push(`moves forever · ${Math.round(parseFloat(cs.animationDuration) * (cs.animationDuration.includes("ms") ? 1 : 1000))}ms cycle`);
  const open = cs.getPropertyValue("--n-open").trim();
  if (open && open !== "none") other.push(`opens with ${open}, closes ${cs.getPropertyValue("--n-close-speed").trim() || "1.6"}× faster`);
  if (!enter && !bits.length && !other.length) return null;
  return { element: label, entrance, interaction: bits.join(" · ") || "—", scroll: other.join(" · ") || "—" };
}

function MotionTable({ type, parts, replayKey }: { type: string; parts: string[]; replayKey: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [rows, setRows] = useState<MotionRow[] | null>(null);
  useEffect(() => {
    const read = () => {
      const live = ref.current?.closest("section")?.querySelector<HTMLElement>("[data-normy-live]");
      const root = live?.querySelector<HTMLElement>(`[data-n="${type}"]`) ?? live?.querySelector<HTMLElement>("[data-n]");
      if (!root) return setRows([]);
      const out: MotionRow[] = [];
      const r = describe(root, "whole component");
      if (r) out.push(r);
      for (const p of parts) {
        if (p === "root") continue;
        const el = root.querySelector<HTMLElement>(`[data-n-part="${type}.${p}"]`);
        const d = el ? describe(el, p) : null;
        if (d) out.push(d);
      }
      setRows(out);
    };
    const t = setTimeout(read, 120);
    const off = onApply(() => setTimeout(read, 60));
    return () => {
      clearTimeout(t);
      off();
    };
  }, [type, parts, replayKey]);
  return (
    <div ref={ref} style={{ minWidth: 0 }}>
      {rows === null ? null : rows.length ? (
        <Table label="Motion behaviour" variant="boxed">
          <THead>
            <Tr>
              <Th>Element</Th>
              <Th>Entrance</Th>
              <Th>Pointer</Th>
              <Th>Loop · scroll · open</Th>
            </Tr>
          </THead>
          <TBody>
            {rows.map((r) => (
              <Tr key={r.element}>
                <Td>{r.element}</Td>
                <Td>{r.entrance}</Td>
                <Td>{r.interaction}</Td>
                <Td>{r.scroll}</Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      ) : (
        <Text variant="muted">This component has no motion in the current system. Add an entrance, a hover effect or a loop in the Studio&apos;s Motion panel.</Text>
      )}
    </div>
  );
}
