"use client";

import { useState } from "react";
import { Accordion, Badge, Button, Card, CardBody, CardFooter, CardHeader, Container, Grid, Icon, Price, Row, Section, SegmentedControl, Stack, Table, TBody, Td, Text, Th, THead, Tr } from "@/components/normy";
import { SectionIntro } from "@/components/preview/bits";
import { FAQS, PLAN_MATRIX, PLANS } from "@/components/preview/data";

export default function Pricing() {
  const [cycle, setCycle] = useState<"monthly" | "yearly">("yearly");
  return (
    <>
      <Section nid="pricing-hero">
        <Container>
          <Stack gap={10} align="center">
            <SectionIntro align="center" eyebrow="Pricing" title="Pay for insight, not for seats you never use." lead="Every plan includes SSO, data residency and the full query engine. Upgrade when the events do." />
            <SegmentedControl
              label="Billing cycle"
              nid="billing-toggle"
              variant="pill"
              value={cycle}
              onValueChange={setCycle}
              options={[
                { value: "monthly", label: "Monthly" },
                { value: "yearly", label: "Yearly · save 20%" },
              ]}
            />
            <Grid cols={{ base: 1, lg: 3 }} gap={6} style={{ width: "100%" }}>
              {PLANS.map((p) => (
                <Card key={p.id} variant={p.featured ? "raised" : "outline"} selected={p.featured} nid={`plan-${p.id}`} size="lg">
                  <CardHeader eyebrow={p.name} title={<Price amount={cycle === "yearly" ? Math.round(p.price * 0.8) : p.price} period={p.period} variant="large" />} description={p.blurb} action={p.featured ? <Badge variant="accent">Most popular</Badge> : null} />
                  <CardBody>
                    <Stack gap={3} as="ul" style={{ listStyle: "none", padding: 0, margin: 0 }}>
                      {p.features.map((f) => (
                        <Row as="li" key={f} gap={2}>
                          <Icon name="check" variant="accent" />
                          <Text variant="small" as="span">
                            {f}
                          </Text>
                        </Row>
                      ))}
                    </Stack>
                  </CardBody>
                  <CardFooter>
                    <Button variant={p.featured ? "solid" : "outline"} style={{ width: "100%" }} nid={`plan-cta-${p.id}`}>
                      {p.cta}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </Grid>
          </Stack>
        </Container>
      </Section>
      <Section variant="muted" nid="compare">
        <Container>
          <Stack gap={8}>
            <SectionIntro eyebrow="Compare" title="Everything, side by side." />
            <Table label="Plan comparison" nid="plan-matrix">
              <THead>
                <Tr>
                  <Th>Feature</Th>
                  {PLANS.map((p) => (
                    <Th key={p.id}>{p.name}</Th>
                  ))}
                </Tr>
              </THead>
              <TBody>
                {PLAN_MATRIX.map((row) => (
                  <Tr key={row[0]}>
                    {row.map((c, i) => (
                      <Td key={i}>{c}</Td>
                    ))}
                  </Tr>
                ))}
              </TBody>
            </Table>
          </Stack>
        </Container>
      </Section>
      <Section>
        <Container variant="narrow">
          <Stack gap={8}>
            <SectionIntro eyebrow="FAQ" title="Billing questions." />
            <Accordion variant="separated" items={FAQS.map((f, i) => ({ value: `q${i}`, title: f.q, content: f.a }))} />
          </Stack>
        </Container>
      </Section>
    </>
  );
}
