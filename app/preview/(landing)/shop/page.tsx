"use client";

import { useMemo, useState } from "react";
import { Badge, Breadcrumb, Button, Card, CardBody, CardFooter, CardMedia, Checkbox, Chip, Container, Divider, EmptyState, Grid, Heading, Icon, Link, Media, Price, Row, Section, Select, Slider, Stack, Text, useToast } from "@/components/normy";
import { PRODUCTS } from "@/components/preview/data";

export default function Shop() {
  const toast = useToast();
  const [sort, setSort] = useState("featured");
  const [max, setMax] = useState(150);
  const [onlyNew, setOnlyNew] = useState(false);
  const [tag, setTag] = useState<string | null>(null);
  const list = useMemo(() => {
    const xs = PRODUCTS.filter((p) => p.price <= max && (!onlyNew || p.tag === "New") && (!tag || p.tag === tag));
    if (sort === "low") xs.sort((a, b) => a.price - b.price);
    if (sort === "high") xs.sort((a, b) => b.price - a.price);
    if (sort === "rating") xs.sort((a, b) => b.rating - a.rating);
    return xs;
  }, [sort, max, onlyNew, tag]);

  return (
    <Section size="sm" nid="shop">
      <Container>
        <Stack gap={8}>
          <Stack gap={3}>
            <Breadcrumb items={[{ label: "Shop", href: "/preview/shop" }, { label: "Desk & stationery" }]} />
            <Heading variant="h1">Desk &amp; stationery</Heading>
            <Text variant="lead">Tools for people who think on paper first. Every purchase plants a tree with Eden Reforestation.</Text>
          </Stack>
          <Grid cols={{ base: 1, lg: "16rem minmax(0, 1fr)" }} gap={10}>
            <Stack gap={6} as="aside" nid="shop-filters">
              <Heading variant="h5" as="h2">
                Filters
              </Heading>
              <Slider label="Max price" min={10} max={150} step={5} value={max} onValueChange={setMax} format={(v) => `$${v}`} />
              <Checkbox label="New arrivals only" checked={onlyNew} onChange={(e) => setOnlyNew(e.target.checked)} />
              <Stack gap={2}>
                <Text variant="label">Collections</Text>
                <Row gap={2} wrap>
                  {["Bestseller", "New", "Limited"].map((t) => (
                    <Chip key={t} size="sm" selected={tag === t} onClick={() => setTag(tag === t ? null : t)}>
                      {t}
                    </Chip>
                  ))}
                </Row>
              </Stack>
              <Divider />
              <Text variant="caption">Free shipping over $60 · 30-day returns</Text>
            </Stack>
            <Stack gap={5}>
              <Row justify="space-between" wrap gap={3}>
                <Text variant="small" as="span">
                  {list.length} products
                </Text>
                <div style={{ width: "13rem" }}>
                  <Select label="Sort by" hideLabel required size="sm" value={sort} onValueChange={setSort} options={[{ value: "featured", label: "Featured" }, { value: "low", label: "Price: low to high" }, { value: "high", label: "Price: high to low" }, { value: "rating", label: "Top rated" }]} />
                </div>
              </Row>
              {list.length === 0 ? (
                <EmptyState icon="search" title="Nothing matches those filters" description="Try raising the price limit or clearing the collection filter." actions={<Button variant="outline" onClick={() => { setMax(150); setTag(null); setOnlyNew(false); }}>Clear filters</Button>} />
              ) : (
                <Grid cols={{ base: 1, md: 2, lg: 3 }} gap={5}>
                  {list.map((p) => (
                    <Card key={p.id} variant="interactive" as="article" nid={`product-${p.id}`}>
                      <CardMedia>
                        <Media seed={p.seed} alt={p.name} ratio="1" variant="bleed">
                          {p.tag ? (
                            <span style={{ position: "absolute", top: "var(--n-space-3)", left: "var(--n-space-3)" }}>
                              <Badge variant="inverse">{p.tag}</Badge>
                            </span>
                          ) : null}
                        </Media>
                      </CardMedia>
                      <CardBody>
                        <Stack gap={1}>
                          <Link href="/preview/shop/product" variant="strong">
                            {p.name}
                          </Link>
                          <Row gap={1}>
                            <Icon name="star" variant="accent" />
                            <Text variant="caption" as="span">
                              {p.rating} · {p.reviews} reviews · {p.color}
                            </Text>
                          </Row>
                        </Stack>
                      </CardBody>
                      <CardFooter>
                        <Price amount={p.price} />
                        <Button size="sm" variant="soft" icon="bag" style={{ marginLeft: "auto" }} onClick={() => toast({ title: `${p.name} added to bag`, variant: "success", action: { label: "View bag", onClick: () => {} } })}>
                          Add
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </Grid>
              )}
            </Stack>
          </Grid>
        </Stack>
      </Container>
    </Section>
  );
}
