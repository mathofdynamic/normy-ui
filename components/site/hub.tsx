"use client";

import { useEffect, useState } from "react";
import { Badge, Box, Button, Card, CardBody, CardFooter, CardHeader, Container, Feature, Footer, Grid, Heading, Hero, Link, Navbar, Row, Section, Stack, Stat, Stepper, Text, Toaster, useToast } from "@/components/normy";
import { Icon } from "@/components/normy/icon";
import { PREVIEW_PAGES } from "@/components/preview/pages";
import { COMPONENTS } from "@/engine/components";
import { getDef, registryStats } from "@/engine/registry";
import { applySystem, currentSystem, onApply } from "@/engine/runtime/apply";
import { STARTERS } from "@/engine/systems";
import type { DesignSystem } from "@/engine/types";

function Logo() {
  return (
    <>
      <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden fill="none">
        <path d="M1 6V1h5M14 1h5v5M19 14v5h-5M6 19H1v-5" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="10" cy="10" r="3" fill="var(--n-color-accent)" />
      </svg>
      normy
    </>
  );
}

/** Swatch strip read straight from a system's tokens (falls back to the registry defaults). */
function Swatches({ s }: { s: DesignSystem }) {
  const keys = ["color.bg", "color.surface-raised", "color.text", "color.accent", "color.chart-2", "color.chart-3"];
  return (
    <Row gap={0} aria-hidden>
      {keys.map((k) => (
        <span key={k} style={{ flex: 1, height: "2.25rem", background: String(s.tokens[k] ?? getDef(k)?.default ?? "transparent"), borderBlock: "1px solid var(--n-color-border)" }} />
      ))}
    </Row>
  );
}

function SystemPicker() {
  const toast = useToast();
  const [active, setActive] = useState<string>("normy");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActive(currentSystem()?.meta.id ?? "normy");
    return onApply((_r, s) => setActive(s.meta.id));
  }, []);
  return (
    <Grid cols={{ base: 1, md: 2, lg: 3 }} gap={5}>
      {STARTERS.map((s) => (
        <Card key={s.meta.id} variant="interactive" selected={active === s.meta.id} as="article" nid={`system-${s.meta.id}`}>
          <Swatches s={s} />
          <CardHeader
            eyebrow={s.meta.tags?.join(" · ")}
            title={s.meta.name}
            description={s.meta.description}
            action={active === s.meta.id ? <Badge variant="accent">Active</Badge> : null}
          />
          <CardBody>
            <Text variant="caption">
              {s.rules.length} rules · {Object.keys(s.tokens).length + Object.keys(s.dark).length} token overrides · same components
            </Text>
          </CardBody>
          <CardFooter>
            <Button
              size="sm"
              variant={active === s.meta.id ? "soft" : "outline"}
              onClick={() => {
                applySystem(s, { persist: true });
                toast({ title: `${s.meta.name} applied`, description: "Every page, preview and lab now uses it.", variant: "success" });
              }}
            >
              {active === s.meta.id ? "Applied" : "Apply everywhere"}
            </Button>
            <Button size="sm" variant="ghost" href="/preview/saas" iconEnd="arrow-right">
              Preview
            </Button>
          </CardFooter>
        </Card>
      ))}
    </Grid>
  );
}

export function Hub() {
  const st = registryStats();
  return (
    <Toaster>
      <Navbar
        nid="hub-nav"
        variant="blurred"
        brand={<Logo />}
        links={[
          { label: "Systems", href: "#systems" },
          { label: "Engine", href: "#engine" },
          { label: "Previews", href: "#previews" },
          { label: "Atlas", href: "/preview/atlas" },
          { label: "Motion", href: "/preview/motion" },
          { label: "Analyzer", href: "/preview/analyzer" },
        ]}
        actions={
          <Button size="sm" href="/studio" icon="sliders" nid="hub-studio">
            Open Studio
          </Button>
        }
      />
      <Hero
        nid="hub-hero"
        eyebrow={
          <Badge variant="accent" dot="pulse">
            Design engine · Studio · {COMPONENTS.length} components
          </Badge>
        }
        title={
          <>
            One engine.
            <br />
            Every look.
          </>
        }
        lead={`Normy drives every visual and motion decision from data: ${st.total} registry properties, resolved through an eight-level cascade into one stylesheet. Design it in the Studio, save it as a system, ship it anywhere.`}
        actions={
          <>
            <Button size="lg" href="/studio" icon="sliders" nid="hub-cta">
              Open the Studio
            </Button>
            <Button size="lg" variant="outline" href="#systems">
              Try a starter system
            </Button>
          </>
        }
        meta={
          <Row gap={4} wrap>
            <Text variant="small" as="span">
              Local-first · saves to design-systems/
            </Text>
            <Text variant="small" as="span">
              Exports CSS · Tailwind · TS · W3C tokens
            </Text>
          </Row>
        }
        media={
          <Grid cols={2} gap={4}>
            <Stat label="Registry properties" value={String(st.total)} meta={`${st.tokens} tokens · ${st.properties} props`} icon="sliders" />
            <Stat label="Components" value={String(COMPONENTS.length)} meta="all rule-driven" icon="grid" />
            <Stat label="Starter systems" value={String(STARTERS.length)} meta="zero component forks" icon="palette" />
            <Stat label="Preview pages" value={String(PREVIEW_PAGES.length)} meta="landing · dashboard · labs" icon="layout" />
          </Grid>
        }
      />

      <Section variant="muted" nid="systems">
        <Container>
          <Stack gap={10}>
            <Stack gap={3}>
              <Heading variant="eyebrow">Starter systems</Heading>
              <Heading variant="h2">Same components. Nine identities.</Heading>
              <Text variant="lead">Each starter is only tokens and rules. Apply one and every page — this one included — re-skins instantly.</Text>
            </Stack>
            <SystemPicker />
          </Stack>
        </Container>
      </Section>

      <Section nid="engine">
        <Container>
          <Grid cols={{ base: 1, lg: 2 }} gap={12} align="center">
            <Stack gap={5}>
              <Heading variant="eyebrow">The cascade</Heading>
              <Heading variant="h2">Set a value anywhere. See where it came from.</Heading>
              <Text variant="lead">Rules resolve lowest to highest priority. The Studio shows the origin of every value and lets you reset any scope.</Text>
              <Link href="/studio" variant="strong" icon="arrow-right">
                Inspect it in the Studio
              </Link>
            </Stack>
            <Card variant="outline">
              <CardBody>
                <Stepper variant="vertical" current={8} steps={[{ label: "Global", description: "Tokens: colour roles, type, space, motion" }, { label: "Component type", description: "Button, Card, Navbar…" }, { label: "Variant / size", description: "Including variants you name yourself" }, { label: "Part (slot)", description: "label, icon, track, thumb…" }, { label: "Instance", description: "One element, by nid" }, { label: "State", description: "hover, focus, active, disabled, loading…" }, { label: "Breakpoint", description: "sm · md · lg · xl · 2xl" }, { label: "Colour mode", description: "light / dark" }]} />
              </CardBody>
            </Card>
          </Grid>
        </Container>
      </Section>

      <Section variant="bordered">
        <Container>
          <Grid cols={{ base: 1, md: 2, lg: 4 }} gap={6}>
            <Feature variant="card" icon="sliders" title="Registry-driven">
              Every knob is declared once — label, control, CSS mapping, constraints — and appears in the inspector, resolver, exports and docs.
            </Feature>
            <Feature variant="card" icon="zap" title="Three motion layers">
              Entrance, interaction and ambient motion are properties too, with springs compiled to CSS linear() easing.
            </Feature>
            <Feature variant="card" icon="layers" title="Saved as data">
              Systems save to disk with snapshots, diffs and exports to CSS, Tailwind, TypeScript and W3C tokens.
            </Feature>
            <Feature variant="card" icon="eye" title="Analysed">
              Contrast in both modes, coverage, token usage and dead rules — measured live by the Analyzer.
            </Feature>
          </Grid>
        </Container>
      </Section>

      <Section variant="muted" nid="previews">
        <Container>
          <Stack gap={10}>
            <Stack gap={3}>
              <Heading variant="eyebrow">Preview apps</Heading>
              <Heading variant="h2">Real products, built only from Normy.</Heading>
            </Stack>
            {(["Landing", "Dashboard", "Labs"] as const).map((g) => (
              <Stack key={g} gap={4}>
                <Heading variant="h4" as="h3">
                  {g}
                </Heading>
                <Grid cols={{ base: 1, md: 2, lg: 4 }} gap={4}>
                  {PREVIEW_PAGES.filter((p) => p.group === g).map((p) => (
                    <Card key={p.path} variant="interactive" size="sm" as="article">
                      <CardHeader title={<Link href={p.path} variant="subtle">{p.title}</Link>} description={p.description} action={<Icon name={p.icon} variant="accent" />} />
                    </Card>
                  ))}
                </Grid>
              </Stack>
            ))}
          </Stack>
        </Container>
      </Section>

      <Section variant="inverse">
        <Container variant="narrow">
          <Stack gap={6} align="center">
            <Heading variant="h1" style={{ textAlign: "center" }}>
              Design the rules, not the pixels.
            </Heading>
            <Row gap={3} wrap justify="center">
              <Button size="lg" href="/studio" icon="sliders">
                Open the Studio
              </Button>
              <Button size="lg" variant="ghost" href="/preview/atlas">
                Browse the Atlas
              </Button>
            </Row>
          </Stack>
        </Container>
      </Section>

      <Footer
        nid="hub-footer"
        brand={
          <Stack gap={2}>
            <Row gap={2}>
              <Logo />
            </Row>
            <Text variant="small">A design engine and studio. Runs locally; nothing leaves your machine.</Text>
          </Stack>
        }
        columns={[
          { title: "Make", links: [{ label: "Studio", href: "/studio" }, { label: "Atlas", href: "/preview/atlas" }, { label: "Motion Lab", href: "/preview/motion" }] },
          { title: "Check", links: [{ label: "Analyzer", href: "/preview/analyzer" }, { label: "SaaS preview", href: "/preview/saas" }, { label: "Dashboard preview", href: "/preview/app" }] },
        ]}
        bottom="Normy · 2026"
      />
      <Box aria-hidden />
    </Toaster>
  );
}
