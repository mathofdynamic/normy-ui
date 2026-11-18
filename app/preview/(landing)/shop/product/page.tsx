"use client";

import { useState } from "react";
import { Accordion, Avatar, Badge, Box, Breadcrumb, Button, Carousel, Container, DataList, Divider, Grid, Heading, Icon, IconButton, Media, Price, Progress, Quote, RadioGroup, Row, Section, SegmentedControl, Stack, Text, Tooltip, useToast } from "@/components/normy";

const REVIEWS = [
  { name: "Jonas Berg", text: "The paper takes fountain pen ink without bleeding. Exactly what I wanted.", stars: 5 },
  { name: "Mei Chen", text: "Lies flat, sturdy cover, the dot grid is subtle enough to ignore when sketching.", stars: 5 },
  { name: "Omar Aziz", text: "Great notebook. I wish the elastic were a bit tighter.", stars: 4 },
];

export default function Product() {
  const toast = useToast();
  const [qty, setQty] = useState(1);
  const [ruling, setRuling] = useState("dot");
  return (
    <Section size="sm" nid="product">
      <Container>
        <Stack gap={8}>
          <Breadcrumb items={[{ label: "Shop", href: "/preview/shop" }, { label: "Notebooks", href: "/preview/shop" }, { label: "Field Notebook, A5" }]} />
          <Grid cols={{ base: 1, lg: 2 }} gap={12}>
            <Carousel label="Product photos" nid="product-gallery">
              {[4, 9, 14, 2].map((s) => (
                <Media key={s} seed={s} alt="Field Notebook photo" ratio="1" variant="bleed" />
              ))}
            </Carousel>
            <Stack gap={6}>
              <Stack gap={3}>
                <Row gap={2}>
                  <Badge variant="accent">Bestseller</Badge>
                  <Row gap={1}>
                    <Icon name="star" variant="accent" />
                    <Text variant="small" as="span">
                      4.8 · 214 reviews
                    </Text>
                  </Row>
                </Row>
                <Heading variant="h1">Field Notebook, A5</Heading>
                <Price amount={24} strike="$29" variant="large" />
                <Text variant="lead">120 pages of 100gsm Tomoe River–style paper, lay-flat binding and a linen cover that ages well. Numbered pages, two ribbons, one elastic.</Text>
              </Stack>
              <RadioGroup legend="Ruling" variant="cards" value={ruling} onValueChange={setRuling} options={[{ value: "dot", label: "Dot grid", description: "5mm, light grey" }, { value: "lined", label: "Lined", description: "7mm rule" }, { value: "blank", label: "Blank", description: "For sketching" }]} />
              <Stack gap={2}>
                <Text variant="label">Cover</Text>
                <SegmentedControl label="Cover colour" options={[{ value: "moss", label: "Moss" }, { value: "ink", label: "Ink" }, { value: "sand", label: "Sand" }, { value: "vermilion", label: "Vermilion" }]} />
              </Stack>
              <Row gap={3} wrap>
                <Row gap={1}>
                  <IconButton icon="minus" label="Decrease quantity" variant="outline" onClick={() => setQty(Math.max(1, qty - 1))} />
                  <Text variant="strong" as="span" aria-live="polite" style={{ minWidth: "2ch", textAlign: "center" }}>
                    {qty}
                  </Text>
                  <IconButton icon="plus" label="Increase quantity" variant="outline" onClick={() => setQty(qty + 1)} />
                </Row>
                <Button size="lg" icon="bag" nid="add-to-bag" onClick={() => toast({ title: `Added ${qty} × Field Notebook`, variant: "success" })}>
                  Add to bag · ${24 * qty}
                </Button>
                <Tooltip content="Save for later">
                  <IconButton icon="heart" label="Save for later" variant="outline" size="lg" />
                </Tooltip>
              </Row>
              <Row gap={4} wrap>
                <Row gap={2}>
                  <Icon name="truck" variant="muted" />
                  <Text variant="small" as="span">
                    Ships in 1–2 days
                  </Text>
                </Row>
                <Row gap={2}>
                  <Icon name="refresh" variant="muted" />
                  <Text variant="small" as="span">
                    30-day returns
                  </Text>
                </Row>
              </Row>
              <Accordion
                items={[
                  { value: "spec", title: "Specifications", content: <DataList items={[["Size", "148 × 210 mm"], ["Pages", "120 (numbered)"], ["Paper", "100gsm, acid-free"], ["Binding", "Lay-flat, thread-sewn"], ["Weight", "260 g"]]} /> },
                  { value: "care", title: "Materials & care", content: "Linen cover over recycled board. Wipe with a dry cloth; avoid prolonged sunlight." },
                  { value: "ship", title: "Shipping", content: "Free over $60. Carbon-neutral delivery in the EU, UK and North America." },
                ]}
              />
            </Stack>
          </Grid>
          <Divider />
          <Grid cols={{ base: 1, lg: 3 }} gap={10} nid="reviews">
            <Stack gap={4}>
              <Heading variant="h3">Reviews</Heading>
              <Row gap={3}>
                <Heading variant="h1" as="p">
                  4.8
                </Heading>
                <Text variant="small">out of 5 · 214 reviews</Text>
              </Row>
              {[5, 4, 3, 2, 1].map((n, i) => (
                <Progress key={n} label={`${n} stars`} value={[78, 15, 4, 2, 1][i]} showValue size="sm" />
              ))}
            </Stack>
            <Box span={{ base: 1, lg: 2 }}>
              <Stack gap={4}>
                {REVIEWS.map((r) => (
                  <Quote key={r.name} variant="card" cite={<Row gap={2}><Avatar name={r.name} size="xs" />{r.name} · {"★".repeat(r.stars)}</Row>}>
                    {r.text}
                  </Quote>
                ))}
              </Stack>
            </Box>
          </Grid>
        </Stack>
      </Container>
    </Section>
  );
}
