import { Avatar, Badge, Card, CardBody, CardFooter, CardHeader, CardMedia, Chip, Container, Grid, Heading, Link, Media, Row, Section, Stack, Text } from "@/components/normy";
import { POSTS } from "@/components/preview/data";

export default function Blog() {
  const [lead, ...rest] = POSTS;
  return (
    <Section nid="blog">
      <Container>
        <Stack gap={12}>
          <Stack gap={4}>
            <Heading variant="eyebrow">Field notes</Heading>
            <Heading variant="h1">The Lumen blog</Heading>
            <Text variant="lead">Analysis, engineering and product notes from the people building Lumen.</Text>
            <Row gap={2} wrap>
              {["All", "Analysis", "Engineering", "Product", "Guides"].map((t, i) => (
                <Chip key={t} selected={i === 0} size="sm">
                  {t}
                </Chip>
              ))}
            </Row>
          </Stack>

          <Grid cols={{ base: 1, lg: 2 }} gap={10} align="center" nid="featured-post">
            <Media seed={lead.seed} alt={lead.title} ratio="16 / 10" variant="rounded" />
            <Stack gap={4}>
              <Row gap={2}>
                <Badge variant="accent">{lead.tag}</Badge>
                <Text variant="caption" as="span">
                  {lead.date} · {lead.read} read
                </Text>
              </Row>
              <Heading variant="h2">
                <Link href="/preview/blog/article" variant="subtle">
                  {lead.title}
                </Link>
              </Heading>
              <Text variant="lead">{lead.excerpt}</Text>
              <Row gap={3}>
                <Avatar name={lead.author} size="sm" />
                <Text variant="small" as="span">
                  {lead.author}
                </Text>
              </Row>
            </Stack>
          </Grid>

          <Grid cols={{ base: 1, md: 2, lg: 3 }} gap={6}>
            {rest.map((p) => (
              <Card key={p.title} variant="interactive" as="article">
                <CardMedia>
                  <Media seed={p.seed} alt="" ratio="16 / 9" variant="bleed" />
                </CardMedia>
                <CardHeader eyebrow={`${p.tag} · ${p.read}`} title={<Link href="/preview/blog/article" variant="subtle">{p.title}</Link>} />
                <CardBody>{p.excerpt}</CardBody>
                <CardFooter>
                  <Avatar name={p.author} size="xs" />
                  <Text variant="caption" as="span">
                    {p.author} · {p.date}
                  </Text>
                </CardFooter>
              </Card>
            ))}
          </Grid>
        </Stack>
      </Container>
    </Section>
  );
}
