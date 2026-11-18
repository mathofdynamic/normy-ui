import { Alert, Avatar, Badge, Box, Breadcrumb, Button, Chart, Code, Container, Divider, Heading, Media, Quote, Row, Section, Stack, Text } from "@/components/normy";

export default function Article() {
  return (
    <Section nid="article">
      <Container variant="narrow">
        <Stack gap={8} as="article">
          <Breadcrumb items={[{ label: "Blog", href: "/preview/blog" }, { label: "Analysis", href: "/preview/blog" }, { label: "The retention curve is lying to you" }]} />
          <Stack gap={5}>
            <Row gap={2}>
              <Badge variant="accent">Analysis</Badge>
              <Text variant="caption" as="span">
                Nov 12, 2026 · 8 min read
              </Text>
            </Row>
            <Heading variant="h1">The retention curve is lying to you</Heading>
            <Text variant="lead">Averaged cohorts hide your best users. Here is the three-line query that brings them back into view — and what we found when we ran it on 2,000 products.</Text>
            <Row gap={3}>
              <Avatar name="Mara Lindqvist" />
              <Stack gap={0}>
                <Text variant="strong" as="span">
                  Mara Lindqvist
                </Text>
                <Text variant="caption" as="span">
                  Principal analyst
                </Text>
              </Stack>
            </Row>
          </Stack>
          <Media seed={3} alt="Retention curves for six cohorts" ratio="21 / 9" variant="rounded" caption="Fig. 1 — six cohorts, one average" />
          <Stack gap={5} nid="article-body">
            <Text>Every product team has seen it: a retention curve that drops steeply for two weeks, then flattens into a comfortable plateau. It looks like a product that found its audience. Usually, it is three very different products averaged into one line.</Text>
            <Heading variant="h3">One average, three populations</Heading>
            <Text>When we split the curve by the first action a user took, the plateau dissolved. People who invited a teammate on day one retained at 61% after twelve weeks. People who only imported data retained at 9%. The average — 24% — described nobody.</Text>
            <Quote variant="large" cite="Mara Lindqvist">
              An average retention curve is a portrait of a user who does not exist.
            </Quote>
            <Text>The fix is not a fancier chart. It is to define cohorts by behaviour, not by calendar.</Text>
            <Code variant="block">{`cohort "activated" = users
  where first_event in ("invite_sent", "dashboard_shared")
  within 1 day of signup`}</Code>
            <Box variant="surface" size="md">
              <Chart kind="line" label="Twelve-week retention by first action" labels={["W1", "W2", "W3", "W4", "W6", "W8", "W10", "W12"]} series={[{ name: "Invited a teammate", data: [92, 81, 74, 70, 66, 64, 62, 61], color: 1 }, { name: "Average", data: [70, 48, 38, 32, 28, 26, 25, 24], color: 2 }, { name: "Imported only", data: [55, 28, 19, 15, 12, 11, 10, 9], color: 3 }]} />
            </Box>
            <Alert variant="info" title="Try it on your data">
              The query above runs as-is in any Lumen workspace on the Team plan or higher.
            </Alert>
            <Heading variant="h3">What to do on Monday</Heading>
            <Text>Pick the two or three first actions that matter for your product, build a cohort for each, and put them on the same chart as the average. If the lines diverge, your roadmap just got clearer.</Text>
          </Stack>
          <Divider />
          <Row justify="space-between" wrap gap={4}>
            <Text variant="small">Filed under Analysis, Retention, Cohorts</Text>
            <Row gap={2}>
              <Button variant="outline" size="sm" icon="share">
                Share
              </Button>
              <Button variant="ghost" size="sm" icon="bookmark">
                Save
              </Button>
            </Row>
          </Row>
        </Stack>
      </Container>
    </Section>
  );
}
