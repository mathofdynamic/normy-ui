import { Accordion, AvatarGroup, Badge, Box, Button, Card, CardBody, CardHeader, Carousel, Chart, Container, Feature, Grid, Heading, Hero, Marquee, Media, Quote, Row, Section, Stack, Stat, Tabs, Text } from "@/components/normy";
import { Icon } from "@/components/normy/icon";
import { SectionIntro } from "@/components/preview/bits";
import { FAQS, FEATURES, LOGOS, MONTHS, REVENUE, REVENUE_PREV, STATS, TESTIMONIALS } from "@/components/preview/data";

export default function SaasHome() {
  return (
    <>
      <Hero
        nid="saas-hero"
        eyebrow={
          <Badge variant="accent" dot="pulse">
            New · Lumen 4.0 reads plain English
          </Badge>
        }
        title={
          <>
            Know <em>why</em> your product grows.
          </>
        }
        lead="Lumen turns raw events into answers your whole team can read. Ask in plain language, get the funnel, the cohort and the reason — in seconds."
        actions={
          <>
            <Button size="lg" iconEnd="arrow-right" nid="hero-cta" href="/preview/signup">
              Start free
            </Button>
            <Button size="lg" variant="outline" icon="play" nid="hero-demo">
              Watch the 2-min tour
            </Button>
          </>
        }
        meta={
          <Row gap={3}>
            <AvatarGroup names={["Priya Raman", "Tomás Ibarra", "Hannah Okafor", "Kofi Mensah", "Mei Chen", "Omar Aziz", "Pia Lund"]} />
            <Text variant="small" as="span">
              Trusted by 2,300 product teams
            </Text>
          </Row>
        }
        media={
          <Card nid="hero-preview" variant="raised">
            <CardHeader eyebrow="Revenue · last 12 months" title="$72.4k MRR" description="+38% year over year" action={<Badge variant="success">On track</Badge>} />
            <CardBody>
              <Chart
                kind="area"
                label="Monthly recurring revenue, this year vs last year"
                labels={MONTHS}
                series={[
                  { name: "This year", data: REVENUE, color: 1 },
                  { name: "Last year", data: REVENUE_PREV, color: 2 },
                ]}
              />
            </CardBody>
          </Card>
        }
      />

      <Section size="sm" nid="logos">
        <Container>
          <Stack gap={6} align="center">
            <Text variant="label">Teams that ship with Lumen</Text>
            <Marquee label="Customer logos" nid="logo-marquee">
              {LOGOS.map((l) => (
                <Row key={l} gap={2}>
                  <Icon name="sparkle" />
                  <Heading variant="h5" as="span">
                    {l}
                  </Heading>
                </Row>
              ))}
            </Marquee>
          </Stack>
        </Container>
      </Section>

      <Section variant="muted" size="sm" nid="stats">
        <Container>
          <Grid cols={{ base: 2, lg: 4 }} gap={6}>
            {STATS.map((s) => (
              <Stat key={s.label} variant="plain" size="lg" label={s.label} value={s.value} />
            ))}
          </Grid>
        </Container>
      </Section>

      <Section nid="features">
        <Container>
          <Stack gap={12}>
            <SectionIntro eyebrow="Why Lumen" title="Analytics that answers the next question, too." lead="Most tools stop at the chart. Lumen keeps going: it explains movement, suggests the cohort to watch and tells you when it changes." />
            <Grid cols={{ base: 1, md: 2, lg: 3 }} gap={6}>
              {FEATURES.map((f) => (
                <Feature key={f.title} variant="card" icon={f.icon} title={f.title}>
                  {f.text}
                </Feature>
              ))}
            </Grid>
          </Stack>
        </Container>
      </Section>

      <Section variant="bordered" nid="tour">
        <Container>
          <Grid cols={{ base: 1, lg: 2 }} gap={12} align="center">
            <SectionIntro eyebrow="Product tour" title="From question to decision in one screen." lead="Three views cover 90% of product questions. Each one is a click away from the raw events behind it." />
            <Tabs
              label="Product tour"
              nid="tour-tabs"
              variant="pill"
              items={[
                { value: "funnels", label: "Funnels", icon: "filter", content: <Media seed={3} alt="Funnel view" caption="Funnel · signup → activation" ratio="16 / 10" /> },
                { value: "cohorts", label: "Cohorts", icon: "users", content: <Media seed={8} alt="Cohort view" caption="Retention by signup week" ratio="16 / 10" /> },
                { value: "alerts", label: "Alerts", icon: "bell", content: <Media seed={13} alt="Alerts view" caption="Anomaly · checkout −18%" ratio="16 / 10" /> },
              ]}
            />
          </Grid>
        </Container>
      </Section>

      <Section variant="muted" nid="testimonials">
        <Container>
          <Grid cols={{ base: 1, lg: 3 }} gap={10} align="center">
            <Box span={{ base: 1, lg: 1 }}>
              <SectionIntro eyebrow="Customers" title="Loved by the people who read the charts." />
            </Box>
            <Box span={{ base: 1, lg: 2 }}>
              <Carousel label="Customer testimonials" nid="testimonial-carousel">
                {TESTIMONIALS.map((t) => (
                  <Quote key={t.name} variant="card" cite={<span>{t.name} · {t.role}</span>}>
                    {t.quote}
                  </Quote>
                ))}
              </Carousel>
            </Box>
          </Grid>
        </Container>
      </Section>

      <Section nid="faq">
        <Container variant="narrow">
          <Stack gap={8}>
            <SectionIntro eyebrow="FAQ" title="Questions, answered." />
            <Accordion items={FAQS.map((f, i) => ({ value: `q${i}`, title: f.q, content: f.a }))} defaultValue="q0" nid="faq-accordion" />
          </Stack>
        </Container>
      </Section>

      <Section variant="inverse" nid="cta-band">
        <Container>
          <Stack gap={6} align="center">
            <Heading variant="h1" style={{ textAlign: "center" }}>
              Your next insight is 11 minutes away.
            </Heading>
            <Text variant="lead" style={{ textAlign: "center" }}>
              Free up to a million events a month. No credit card, no sales call.
            </Text>
            <Row gap={3} justify="center" wrap>
              <Button size="lg" nid="cta-primary" href="/preview/signup" iconEnd="arrow-right">
                Create your workspace
              </Button>
              <Button size="lg" variant="ghost" href="/preview/pricing">
                See pricing
              </Button>
            </Row>
          </Stack>
        </Container>
      </Section>
    </>
  );
}
