"use client";

import { useEffect, useState } from "react";
import { Badge, Button, Card, CardBody, CardFooter, CardHeader, Container, Feature, Footer, Grid, Heading, Link, Navbar, Row, Section, Stack, Text, Toaster, useToast } from "@/components/normy";
import { Icon } from "@/components/normy/icon";
import { PREVIEW_PAGES } from "@/components/preview/pages";
import { SystemThumb } from "@/components/studio/system-thumb";
import { COMPONENTS } from "@/engine/components";
import { registryStats } from "@/engine/registry";
import { applySystem, currentSystem, onApply } from "@/engine/runtime/apply";
import { STARTERS } from "@/engine/systems";

function Logo() {
  return (
    <>
      <svg viewBox="0 0 20 20" width="22" height="22" aria-hidden fill="none">
        <rect x="1" y="1" width="18" height="18" rx="5" fill="currentColor" />
        <circle cx="10" cy="10" r="3.4" fill="var(--n-color-accent)" />
      </svg>
      normy
    </>
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
          <CardBody>
            <SystemThumb system={s} />
          </CardBody>
          <CardHeader title={s.meta.name} description={s.meta.description} action={active === s.meta.id ? <Badge variant="accent">In use</Badge> : null} />
          <CardFooter>
            <Button
              size="sm"
              variant={active === s.meta.id ? "soft" : "outline"}
              onClick={() => {
                applySystem(s, { persist: true });
                toast({ title: `${s.meta.name} applied`, description: "This site and every preview page now use it.", variant: "success" });
              }}
            >
              {active === s.meta.id ? "Applied" : "Try it here"}
            </Button>
            <Button size="sm" variant="ghost" href="/studio" iconEnd="arrow-right">
              Customise
            </Button>
          </CardFooter>
        </Card>
      ))}
    </Grid>
  );
}

const STEPS = [
  { icon: "palette", title: "Pick a style", text: "Brand colour, fonts, corners, spacing, depth and motion — big visual choices, one click each." },
  { icon: "cursor", title: "Click to fine-tune", text: "Select any element on a real page. Change every button, one style, or just that one — in plain words." },
  { icon: "upload", title: "Save & ship", text: "Keep versions, compare them, and export CSS, Tailwind, TypeScript or W3C design tokens." },
] as const;

export function Hub() {
  const st = registryStats();
  return (
    <Toaster>
      <Navbar
        nid="hub-nav"
        variant="blurred"
        brand={<Logo />}
        links={[
          { label: "How it works", href: "#how" },
          { label: "Starters", href: "#systems" },
          { label: "Pages", href: "#previews" },
          { label: "Components", href: "/preview/atlas" },
        ]}
        actions={
          <Button size="sm" href="/studio" nid="hub-studio">
            Open Studio
          </Button>
        }
      />
      <Section nid="hub-hero" size="lg">
        <Container>
          <Stack gap={10} align="center">
            <Stack gap={6} align="center" style={{ maxWidth: "52rem", textAlign: "center" }}>
              <Badge variant="accent" dot="pulse">
                Visual design-system studio
              </Badge>
              <Heading variant="h1" style={{ textAlign: "center" }}>
                Design your UI visually. See it everywhere.
              </Heading>
              <Text variant="lead" style={{ textAlign: "center" }}>
                Normy is a studio for the look and feel of your product. Choose a style, click anything to refine it, and watch every page update live — then export it as real code.
              </Text>
              <Row gap={3} wrap justify="center">
                <Button size="lg" href="/studio" iconEnd="arrow-right" nid="hub-cta">
                  Open the Studio
                </Button>
                <Button size="lg" variant="outline" href="#systems">
                  Browse starter looks
                </Button>
              </Row>
              <Row gap={5} wrap justify="center">
                {[`${COMPONENTS.length} components`, `${STARTERS.length} starter looks`, "Light & dark", "Runs locally"].map((t) => (
                  <Text key={t} variant="small" as="span">
                    <Icon name="check" variant="accent" /> {t}
                  </Text>
                ))}
              </Row>
            </Stack>
            <a href="/studio" aria-label="Open the Studio" style={{ display: "block", width: "100%", borderRadius: "var(--n-radius-xl)", overflow: "hidden", border: "var(--n-border-thin) solid var(--n-color-border)", boxShadow: "var(--n-shadow-5)", background: "var(--n-color-surface-raised)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element -- static product shot */}
              <img src="/studio-hero.png" alt="The Normy Studio: style controls on the left, a live product page on the right" width={1440} height={900} style={{ display: "block", width: "100%", height: "auto" }} />
            </a>
          </Stack>
        </Container>
      </Section>

      <Section nid="how">
        <Container>
          <Stack gap={10}>
            <Stack gap={3} align="center">
              <Heading variant="eyebrow">How it works</Heading>
              <Heading variant="h2" style={{ textAlign: "center" }}>
                From blank to branded in three moves.
              </Heading>
            </Stack>
            <Grid cols={{ base: 1, md: 3 }} gap={6}>
              {STEPS.map((s, i) => (
                <Feature key={s.title} variant="card" icon={s.icon} title={`${i + 1}. ${s.title}`}>
                  {s.text}
                </Feature>
              ))}
            </Grid>
          </Stack>
        </Container>
      </Section>

      <Section variant="muted" nid="systems">
        <Container>
          <Stack gap={10}>
            <Stack gap={3}>
              <Heading variant="eyebrow">Starter looks</Heading>
              <Heading variant="h2">Same components. Completely different products.</Heading>
              <Text variant="lead">Each look is just data. Try one on this page, or open it in the Studio and make it yours.</Text>
            </Stack>
            <SystemPicker />
          </Stack>
        </Container>
      </Section>

      <Section nid="features">
        <Container>
          <Grid cols={{ base: 1, lg: 2 }} gap={12} align="center">
            <Stack gap={5}>
              <Heading variant="eyebrow">Simple first, deep when you need it</Heading>
              <Heading variant="h2">Every detail is adjustable. None of it is in your way.</Heading>
              <Text variant="lead">
                Start with a handful of big choices. When you want more, every component has its essentials one click away — and {st.total} properties behind “Advanced” for the last pixel.
              </Text>
              <Link href="/studio" variant="strong" icon="arrow-right">
                Try it in the Studio
              </Link>
            </Stack>
            <Grid cols={{ base: 1, md: 2 }} gap={4}>
              <Feature variant="card" icon="sun" title="Light & dark, together">
                Every colour is defined for both modes. Flip the preview to check.
              </Feature>
              <Feature variant="card" icon="zap" title="Motion included">
                Entrances, hovers and page transitions — from none to bouncy.
              </Feature>
              <Feature variant="card" icon="clock" title="Undo anything">
                Full history, saved versions and side-by-side compare.
              </Feature>
              <Feature variant="card" icon="eye" title="Checked for you">
                Contrast in both modes and coverage, measured live.
              </Feature>
            </Grid>
          </Grid>
        </Container>
      </Section>

      <Section variant="muted" nid="previews">
        <Container>
          <Stack gap={10}>
            <Stack gap={3}>
              <Heading variant="eyebrow">Real pages to test on</Heading>
              <Heading variant="h2">See your system on actual product screens.</Heading>
            </Stack>
            <Grid cols={{ base: 1, md: 2, lg: 4 }} gap={4}>
              {PREVIEW_PAGES.filter((p) => p.group !== "Labs").map((p) => (
                <Card key={p.path} variant="interactive" size="sm" as="article">
                  <CardHeader title={<Link href={p.path} variant="subtle">{p.title}</Link>} description={p.description} action={<Icon name={p.icon} variant="accent" />} />
                </Card>
              ))}
            </Grid>
          </Stack>
        </Container>
      </Section>

      <Section variant="inverse">
        <Container variant="narrow">
          <Stack gap={6} align="center">
            <Heading variant="h1" style={{ textAlign: "center" }}>
              Your design system, without the busywork.
            </Heading>
            <Row gap={3} wrap justify="center">
              <Button size="lg" href="/studio" iconEnd="arrow-right">
                Open the Studio
              </Button>
              <Button size="lg" variant="ghost" href="/preview/atlas">
                See all components
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
            <Text variant="small">A visual studio for design systems. Runs locally; nothing leaves your machine.</Text>
          </Stack>
        }
        columns={[
          { title: "Make", links: [{ label: "Studio", href: "/studio" }, { label: "Components", href: "/preview/atlas" }, { label: "Motion Lab", href: "/preview/motion" }] },
          { title: "Check", links: [{ label: "Analyzer", href: "/preview/analyzer" }, { label: "SaaS page", href: "/preview/saas" }, { label: "Dashboard", href: "/preview/app" }] },
        ]}
        bottom="Normy · 2026"
      />
    </Toaster>
  );
}
