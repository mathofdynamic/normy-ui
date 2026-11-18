import { Button, Container, Heading, Input, Row, Section, Stack, Text } from "@/components/normy";

export default function NotFoundPreview() {
  return (
    <Section size="lg" nid="not-found">
      <Container variant="narrow">
        <Stack gap={6} align="center">
          <Heading variant="eyebrow">Error 404</Heading>
          <Heading variant="display" as="h1" nid="nf-code">
            404
          </Heading>
          <Heading variant="h3" as="p">
            This page took a wrong turn at the funnel.
          </Heading>
          <Text variant="lead" style={{ textAlign: "center" }}>
            The link may be old, or the page moved when we reorganised the docs. Try searching, or head back to safer ground.
          </Text>
          <div style={{ width: "100%", maxWidth: "24rem" }}>
            <Input label="Search" hideLabel required icon="search" placeholder="Search Lumen…" />
          </div>
          <Row gap={3} justify="center" wrap>
            <Button href="/preview/saas" icon="home" nid="nf-home">
              Back home
            </Button>
            <Button href="/preview/docs" variant="outline">
              Open docs
            </Button>
          </Row>
        </Stack>
      </Container>
    </Section>
  );
}
