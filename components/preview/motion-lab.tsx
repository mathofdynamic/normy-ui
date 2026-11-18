"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Badge, Box, Button, Card, CardBody, CardHeader, Carousel, Container, Grid, Heading, Marquee, Media, PageHeader, Row, Section, SegmentedControl, Select, Slider, Stack, Stat, Switch, Text } from "@/components/normy";
import { EasingCurve, PropertyControl } from "@/components/studio/controls";
import { r } from "@/engine/system";
import { getDef } from "@/engine/registry";
import { AMBIENT_EFFECTS, ENTER_PRESETS } from "@/engine/registry";
import { applySystem, currentSystem, onApply, storedSystem } from "@/engine/runtime/apply";
import { enterKeyframes, readEnter, replay } from "@/engine/runtime/motion";
import { DEFAULT_SYSTEM } from "@/engine/systems";
import type { DesignSystem, EasingValue, Props, Rule, Value } from "@/engine/types";

/* ------------------------------------------------------------------ *
 * Motion Lab — every animation type isolated. All demos are driven by
 * transient rules (never saved) applied through the same engine.
 * ------------------------------------------------------------------ */

const ENTERS = ENTER_PRESETS.filter((p) => p !== "none" && p !== "custom");
const AMBIENTS = AMBIENT_EFFECTS.filter((a) => a !== "none");
const SCROLLS = ["parallax", "fade", "reveal", "scale", "rotate", "blur", "velocity-skew"];

const easingDef = getDef("enterEasing")!;

export function MotionLab() {
  const base = useRef<DesignSystem | null>(null);
  const [speed, setSpeed] = useState(1);
  const [off, setOff] = useState(false);
  const [reduce, setReduce] = useState("system");
  const [custom, setCustom] = useState<Props>({ enterOpacity: 0, enterY: "40px", enterScale: 0.9, enterRotate: -6, enterBlur: "6px", enterDuration: 900, enterStagger: 90, enterStaggerFrom: "center", enterEasing: { kind: "easing", type: "spring", stiffness: 260, damping: 18, mass: 1 } });
  const [scrub, setScrub] = useState(60);
  const scrubEl = useRef<HTMLDivElement>(null);
  const scrubAnim = useRef<Animation | null>(null);
  const [carousel, setCarousel] = useState("slide");

  const labRules = useMemo<Rule[]>(() => {
    const rules: Rule[] = [];
    ENTERS.forEach((p) => rules.push(r({ component: "box", instance: `lab-enter-${p}` }, { enterEffect: p, enterTrigger: "load", enterDuration: 900 })));
    rules.push(r({ component: "box", variant: "lab-stagger" }, { enterEffect: "custom", enterTrigger: "load", ...custom }));
    rules.push(r({ component: "box", instance: "lab-scrub" }, { enterEffect: "custom", enterTrigger: "none", ...custom }));
    AMBIENTS.forEach((a) =>
      rules.push(
        r({ component: "box", instance: `lab-amb-${a}` }, {
          ambientEffect: a,
          ambientDuration: a === "spin" ? 2400 : a === "blink" ? 1200 : 2600,
          ambientIterations: "infinite",
          ambientDirection: a === "float" || a === "breathe" ? "alternate" : "normal",
          ambientEasing: { kind: "easing", type: "preset", name: a === "spin" || a === "shimmer" || a === "gradient-shift" ? "linear" : "ease-in-out" },
          ambientPauseOnHover: "yes",
          ...(a === "shimmer" ? { gradient: { kind: "gradient", type: "linear", angle: 100, stops: [{ color: "transparent", pos: 30 }, { color: "color-mix(in oklch, var(--n-color-accent) 40%, transparent)", pos: 50 }, { color: "transparent", pos: 70 }] }, backgroundSize: "200% 100%" } : {}),
          ...(a === "gradient-shift" ? { gradient: { kind: "gradient", type: "linear", angle: 120, stops: [{ color: "{color.chart-1}", pos: 0 }, { color: "{color.chart-3}", pos: 50 }, { color: "{color.chart-5}", pos: 100 }] }, backgroundSize: "300% 300%" } : {}),
        }),
      ),
    );
    SCROLLS.forEach((s) => rules.push(r({ component: "box", instance: `lab-scroll-${s}` }, { scrollEffect: s, scrollIntensity: 1 })));
    rules.push(r({ component: "box", instance: "lab-scroll-progress" }, { scrollEffect: "progress", height: "4px", bg: "{color.accent}", position: "sticky", top: 0, zIndex: "{z.sticky}" }));
    rules.push(r({ component: "button", instance: "lab-magnetic" }, { fxMagnetic: 0.6 }));
    rules.push(r({ component: "button", instance: "lab-ripple" }, { fxRipple: "on", overflow: "hidden" }));
    rules.push(r({ component: "button", instance: "lab-press" }, { fxPressScale: 0.9 }));
    rules.push(r({ component: "card", instance: "lab-tilt" }, { fxTilt: 12, fxTiltGlare: 0.8 }));
    rules.push(r({ component: "card", instance: "lab-spot" }, { fxSpotlight: "on", fxSpotlightSize: "260px" }));
    ["dot", "ring", "blend", "label"].forEach((c) => rules.push(r({ component: "box", instance: `lab-cursor-${c}` }, { fxCursor: c, fxCursorLabel: '"Open"', cursor: "none" })));
    rules.push(r({ component: "card", instance: "lab-parallax-card" }, { overflow: "hidden" }));
    rules.push(r({ component: "stack", instance: "lab-scroll-section" }, { overflowX: "clip" }));
    rules.push(r({ component: "box", instance: "lab-parallax-1" }, { fxParallax: 24 }));
    rules.push(r({ component: "box", instance: "lab-parallax-2" }, { fxParallax: -40 }));
    rules.push(r({ component: "card", instance: "lab-hover" }, { transitionDuration: 500, transitionEasing: { kind: "easing", type: "spring", stiffness: 300, damping: 14, mass: 1 } }));
    rules.push(r({ component: "card", instance: "lab-hover", state: "hover" }, { translateY: -10, rotate: -2, shadow: "{shadow.4}", transitionDuration: 220 }));
    rules.push(r({ component: "carousel", instance: "lab-carousel" }, { carouselTransition: carousel, carouselInterval: 2600 }));
    rules.push(r({ component: "text", instance: "lab-type" }, { typewriter: "on", typewriterSpeed: 45, typewriterLoop: "yes", fontFamily: "{font.mono}", fontSize: "{text.lg}" }));
    rules.push(r({ component: "stat", instance: "lab-count" }, { countUp: "on", countUpDuration: 1600 }));
    rules.push(r({ component: "marquee", instance: "lab-marquee-fast" }, { marqueeSpeed: 160, marqueeDirection: "right" }));
    return rules;
  }, [custom, carousel]);

  // Apply the active system + lab rules + transient global motion overrides.
  useEffect(() => {
    base.current ??= currentSystem() ?? storedSystem() ?? DEFAULT_SYSTEM;
    const s = base.current;
    const sys: DesignSystem = { ...s, tokens: { ...s.tokens, "motion.speed": speed, "motion.enabled": !off, "motion.reduce": reduce } };
    applySystem(sys, { extra: labRules });
    setTimeout(() => replay(), 30);
  }, [labRules, speed, off, reduce]);

  // If the Studio pushes a new system while the lab is open, keep the lab rules on top.
  useEffect(
    () =>
      onApply((_r, s) => {
        if (s.meta.id !== base.current?.meta.id) base.current = s;
      }),
    [],
  );

  // Timeline scrubber: a paused WAAPI animation built from the cascaded config.
  useEffect(() => {
    const el = scrubEl.current;
    if (!el) return;
    const t = setTimeout(() => {
      const c = readEnter(el);
      if (!c) return;
      scrubAnim.current?.cancel();
      scrubAnim.current = el.animate(enterKeyframes(c), { duration: c.duration, easing: c.easing, fill: "both" });
      scrubAnim.current.pause();
      scrubAnim.current.currentTime = (scrub / 100) * c.duration;
    }, 60);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [labRules]);
  useEffect(() => {
    const a = scrubAnim.current;
    if (!a) return;
    const d = Number(a.effect?.getTiming().duration ?? 900);
    a.currentTime = (scrub / 100) * d;
  }, [scrub]);

  const setC = (k: string, v: Value | undefined) => setCustom((c) => {
    const n = { ...c };
    if (v === undefined) delete n[k];
    else n[k] = v;
    return n;
  });

  return (
    <>
      <Box nid="lab-scroll-progress" aria-hidden />
      <Section size="sm">
        <Container variant="wide">
          <Stack gap={10}>
            <PageHeader
              variant="large"
              eyebrow="Labs · Motion Lab"
              title="Every animation, isolated."
              description="Entrance, interaction, scroll and ambient motion — all of it is data. These demos are transient rules on top of the active system; open the Studio to make them permanent."
              actions={<Button icon="play" onClick={() => replay()} nid="lab-replay">Replay all</Button>}
            />

            <Card nid="lab-global">
              <CardHeader eyebrow="Global" title="Master controls" description="Speed divides every duration. Reduce follows or overrides prefers-reduced-motion. Disable turns everything off for comparison." />
              <CardBody>
                <Grid cols={{ base: 1, md: 3 }} gap={6}>
                  <Slider label="Master speed" min={0.25} max={3} step={0.25} value={speed} onValueChange={setSpeed} format={(v) => `${v}×`} ticks={6} />
                  <Stack gap={2}>
                    <Text variant="label">Reduced motion</Text>
                    <SegmentedControl label="Reduced motion policy" value={reduce} onValueChange={setReduce} options={[{ value: "system", label: "Follow OS" }, { value: "always", label: "Always" }, { value: "never", label: "Ignore" }]} />
                  </Stack>
                  <Switch label="Disable all motion" description="Instantly compare with and without." checked={off} onCheckedChange={setOff} />
                </Grid>
              </CardBody>
            </Card>

            <Stack gap={5} as="section" aria-label="Entrance presets">
              <Heading variant="h3">Entrance presets</Heading>
              <Grid cols={{ base: 2, md: 3, lg: 6 }} gap={4}>
                {ENTERS.map((p, i) => (
                  <Box key={p} nid={`lab-enter-${p}`} variant="surface" size="md">
                    <Stack gap={2}>
                      <Media seed={i + 1} alt="" ratio="4 / 3" />
                      <Text variant="mono">{p}</Text>
                    </Stack>
                  </Box>
                ))}
              </Grid>
            </Stack>

            <Grid cols={{ base: 1, lg: "22rem minmax(0, 1fr)" }} gap={6} as="section" aria-label="Custom entrance">
              <Card nid="lab-builder">
                <CardHeader eyebrow="Custom entrance" title="Build one" description="Every field is a registry property." />
                <CardBody>
                  <Stack gap={3}>
                    {["enterOpacity", "enterX", "enterY", "enterScale", "enterRotate", "enterBlur", "enterSkew", "enterClip", "enterDuration", "enterDelay", "enterStagger", "enterStaggerFrom"].map((id) => {
                      const def = getDef(id)!;
                      return (
                        <Stack key={id} gap={1}>
                          <Text variant="caption">{def.label}</Text>
                          <PropertyControl def={def} value={custom[id] ?? null} onChange={(v) => setC(id, v)} />
                        </Stack>
                      );
                    })}
                    <Text variant="caption">Easing</Text>
                    <PropertyControl def={easingDef} value={custom.enterEasing ?? null} onChange={(v) => setC("enterEasing", v)} />
                  </Stack>
                </CardBody>
              </Card>
              <Stack gap={6}>
                <Card>
                  <CardHeader eyebrow="Stagger" title="Six siblings, one rule" action={<Button size="sm" variant="outline" icon="play" onClick={() => replay()}>Replay</Button>} />
                  <CardBody>
                    <Grid cols={{ base: 3, md: 6 }} gap={3}>
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Box key={i} variant="lab-stagger" size="sm">
                          <Media seed={i * 3} alt="" ratio="1" />
                        </Box>
                      ))}
                    </Grid>
                  </CardBody>
                </Card>
                <Card nid="lab-timeline">
                  <CardHeader eyebrow="Timeline" title="Scrub the custom entrance" description="A paused animation built from the cascaded config; drag to inspect any frame." />
                  <CardBody>
                    <Grid cols={{ base: 1, md: "1fr 12rem" }} gap={6} align="center">
                      <Stack gap={4}>
                        <Box variant="sunken" size="lg">
                          <Row justify="center">
                            <div ref={scrubEl} data-n="box" data-n-variant="raised" data-n-size="md" data-n-id="lab-scrub" style={{ width: "10rem" }}>
                              <Media seed={7} alt="" ratio="1" />
                            </div>
                          </Row>
                        </Box>
                        <Slider label="Timeline" value={scrub} onValueChange={setScrub} format={(v) => `${v}%`} ticks={11} />
                      </Stack>
                      <Stack gap={2} align="center">
                        <EasingCurve easing={custom.enterEasing as EasingValue | undefined} size={150} playing={scrub} />
                        <Text variant="caption">Easing curve</Text>
                      </Stack>
                    </Grid>
                  </CardBody>
                </Card>
              </Stack>
            </Grid>

            <Stack gap={5} as="section" aria-label="Interaction effects">
              <Heading variant="h3">Interaction</Heading>
              <Grid cols={{ base: 1, md: 2, lg: 3 }} gap={5}>
                <Card>
                  <CardHeader eyebrow="fxMagnetic · fxRipple · fxPressScale" title="Buttons" />
                  <CardBody>
                    <Row gap={3} wrap>
                      <Button nid="lab-magnetic">Magnetic</Button>
                      <Button nid="lab-ripple" variant="outline">
                        Ripple
                      </Button>
                      <Button nid="lab-press" variant="soft">
                        Press
                      </Button>
                    </Row>
                  </CardBody>
                </Card>
                <Card nid="lab-tilt">
                  <CardHeader eyebrow="fxTilt + glare" title="Tilt me" description="Perspective tilt follows the pointer." />
                  <CardBody>
                    <Media seed={4} alt="" ratio="16 / 9" />
                  </CardBody>
                </Card>
                <Card nid="lab-spot">
                  <CardHeader eyebrow="fxSpotlight" title="Spotlight" description="A soft light follows the cursor." />
                  <CardBody>
                    <Text variant="small">Move across this card.</Text>
                  </CardBody>
                </Card>
                <Card nid="lab-hover">
                  <CardHeader eyebrow="Hover state + spring" title="Separate enter & exit" description="220 ms in on hover, 500 ms spring out on leave." />
                </Card>
                <Card>
                  <CardHeader eyebrow="fxCursor" title="Cursor followers" />
                  <CardBody>
                    <Grid cols={4} gap={2}>
                      {["dot", "ring", "blend", "label"].map((c) => (
                        <Box key={c} nid={`lab-cursor-${c}`} variant="sunken" size="md">
                          <Text variant="caption">{c}</Text>
                        </Box>
                      ))}
                    </Grid>
                  </CardBody>
                </Card>
                <Card nid="lab-parallax-card">
                  <CardHeader eyebrow="fxParallax" title="Pointer parallax" description="Two layers at different depths." />
                  <CardBody>
                    <Row gap={6} justify="center">
                      <Box nid="lab-parallax-1" variant="accent" size="lg">
                        <Text variant="strong">Near</Text>
                      </Box>
                      <Box nid="lab-parallax-2" variant="inverse" size="lg">
                        <Text variant="strong">Far</Text>
                      </Box>
                    </Row>
                  </CardBody>
                </Card>
              </Grid>
            </Stack>

            <Stack gap={5} as="section" aria-label="Ambient">
              <Heading variant="h3">Ambient (autonomous)</Heading>
              <Text variant="muted">Hover any tile to pause it (ambientPauseOnHover).</Text>
              <Grid cols={{ base: 2, md: 4, lg: 5 }} gap={4}>
                {AMBIENTS.map((a) => (
                  <Box key={a} nid={`lab-amb-${a}`} variant="surface" size="lg">
                    <Stack gap={2} align="center">
                      <Badge variant="accent">{a}</Badge>
                    </Stack>
                  </Box>
                ))}
              </Grid>
              <Grid cols={{ base: 1, lg: 2 }} gap={5}>
                <Card>
                  <CardHeader eyebrow="Typewriter · count-up" title="Behaviours" />
                  <CardBody>
                    <Stack gap={5}>
                      <Text nid="lab-type">Ask Lumen why signups dropped last Tuesday.</Text>
                      <Stat nid="lab-count" label="Events today" value="4,218,903" delta="8.1%" variant="plain" />
                    </Stack>
                  </CardBody>
                </Card>
                <Card>
                  <CardHeader eyebrow="Carousel" title="Slideshow" action={<div style={{ width: "9rem" }}><Select label="Transition" hideLabel required size="sm" value={carousel} onValueChange={setCarousel} options={["slide", "fade", "scale", "stack"].map((x) => ({ value: x, label: x }))} /></div>} />
                  <CardBody>
                    <Carousel label="Motion lab carousel" nid="lab-carousel">
                      {[3, 8, 13, 5].map((s) => (
                        <Media key={s} seed={s} alt="" ratio="16 / 8" variant="bleed" />
                      ))}
                    </Carousel>
                  </CardBody>
                </Card>
              </Grid>
              <Stack gap={3}>
                <Marquee label="Marquee default">
                  {["Funnels", "Cohorts", "Alerts", "Retention", "Journeys", "Experiments"].map((x) => (
                    <Heading key={x} variant="h4" as="span">
                      {x} ✦
                    </Heading>
                  ))}
                </Marquee>
                <Marquee label="Marquee fast reverse" nid="lab-marquee-fast">
                  {["160 px/s", "direction: right", "pause on hover"].map((x) => (
                    <Text key={x} variant="mono">
                      {x} ·
                    </Text>
                  ))}
                </Marquee>
              </Stack>
            </Stack>

            <Stack gap={5} as="section" aria-label="Scroll-linked" nid="lab-scroll-section">
              <Heading variant="h3">Scroll-linked</Heading>
              <Text variant="muted">Scroll the page: each tile is driven by its position in the viewport. The bar at the very top shows page progress.</Text>
              <Grid cols={{ base: 1, md: 2, lg: 4 }} gap={5}>
                {SCROLLS.map((s, i) => (
                  <Box key={s} nid={`lab-scroll-${s}`} variant="raised" size="md">
                    <Stack gap={2}>
                      <Media seed={i + 9} alt="" ratio="4 / 3" />
                      <Text variant="mono">{s}</Text>
                    </Stack>
                  </Box>
                ))}
              </Grid>
              <Box style={{ height: "40vh" }} aria-hidden />
            </Stack>
          </Stack>
        </Container>
      </Section>
    </>
  );
}
