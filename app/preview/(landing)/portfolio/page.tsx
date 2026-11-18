import { Badge, Button, Container, Grid, Heading, Hero, Link, Marquee, Media, Quote, Row, Section, Stack, Text } from "@/components/normy";
import { PROJECTS } from "@/components/preview/data";

export default function Portfolio() {
  return (
    <>
      <Hero
        nid="portfolio-hero"
        variant="editorial"
        eyebrow={<Badge variant="outline">Kestrel &amp; Co · Design studio · Est. 2014</Badge>}
        title="We design products people keep."
        lead="A twelve-person studio in Lisbon working with health, finance and climate teams on products, systems and the stories around them."
        actions={
          <>
            <Button size="lg" nid="portfolio-cta">
              Start a project
            </Button>
            <Button size="lg" variant="link">
              Read our process
            </Button>
          </>
        }
      />
      <Section size="sm">
        <Marquee label="Capabilities" nid="capabilities">
          {["Product design", "Design systems", "Brand identity", "Motion", "Data visualisation", "Research", "Front-end engineering"].map((c) => (
            <Heading key={c} variant="h3" as="span">
              {c} ·
            </Heading>
          ))}
        </Marquee>
      </Section>
      <Section nid="work">
        <Container>
          <Stack gap={10}>
            <Row justify="space-between" align="flex-end" wrap gap={4}>
              <Heading variant="h2">Selected work</Heading>
              <Text variant="small">2023 — 2026</Text>
            </Row>
            <Grid cols={{ base: 1, md: 2 }} gap={10}>
              {PROJECTS.map((p, i) => (
                <Stack key={p.title} gap={4} nid={i === 0 ? "case-featured" : undefined}>
                  <Media seed={p.seed} alt={p.title} ratio={i % 3 === 0 ? "4 / 5" : "4 / 3"} variant="rounded" caption={p.kind} />
                  <Stack gap={1}>
                    <Heading variant="h4">
                      <Link href="/preview/portfolio" variant="subtle" icon="arrow-up-right">
                        {p.title}
                      </Link>
                    </Heading>
                    <Text variant="muted">{p.text}</Text>
                  </Stack>
                </Stack>
              ))}
            </Grid>
          </Stack>
        </Container>
      </Section>
      <Section variant="inverse">
        <Container variant="narrow">
          <Quote variant="large" cite="Elif Yilmaz, Chief Product Officer, Meridian Bank">
            Kestrel didn&apos;t hand us a design system. They taught nine teams to speak the same visual language — and it stuck.
          </Quote>
        </Container>
      </Section>
    </>
  );
}
