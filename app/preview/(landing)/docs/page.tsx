import { Alert, Box, Breadcrumb, Button, Code, Container, Divider, Grid, Heading, Kbd, Link, Row, Section, Stack, Table, TBody, Td, Text, Th, THead, Tr } from "@/components/normy";
import { DOCS_NAV } from "@/components/preview/data";

export default function Docs() {
  return (
    <Section size="sm" nid="docs">
      <Container variant="wide">
        <Grid cols={{ base: 1, lg: "14rem minmax(0, 1fr) 12rem" }} gap={10}>
          <Stack gap={6} as="nav" aria-label="Docs" nid="docs-nav">
            {DOCS_NAV.map((g) => (
              <Stack key={g.label} gap={2}>
                <Text variant="label">{g.label}</Text>
                {g.items.map((it) => (
                  <Link key={it} href="/preview/docs" variant="nav" current={it === "Your first event"}>
                    {it}
                  </Link>
                ))}
              </Stack>
            ))}
          </Stack>
          <Stack gap={6} as="article" nid="docs-article">
            <Breadcrumb variant="mono" items={[{ label: "Docs", href: "/preview/docs" }, { label: "Getting started", href: "/preview/docs" }, { label: "Your first event" }]} />
            <Heading variant="h1">Send your first event</Heading>
            <Text variant="lead">Install the SDK, identify a user and track an action. You&apos;ll see it in Lumen within five seconds.</Text>
            <Alert variant="accent" title="Before you start">
              You need a workspace and a write key from <Link href="/preview/app/settings">Settings → API</Link>.
            </Alert>
            <Heading variant="h3">1. Install</Heading>
            <Code variant="block">pnpm add @lumen/browser</Code>
            <Heading variant="h3">2. Initialise and track</Heading>
            <Code variant="block">{`import { lumen } from "@lumen/browser";

lumen.init("wk_live_8f2c…");
lumen.identify("user_1042", { plan: "team" });
lumen.track("report_created", { template: "funnel" });`}</Code>
            <Text>
              Events are batched every two seconds or ten events, whichever comes first. Use <Code>lumen.flush()</Code> before navigation in single-page apps, or press <Kbd>Ctrl</Kbd> <Kbd>K</Kbd> in the dashboard and search &ldquo;live events&rdquo; to watch them arrive.
            </Text>
            <Heading variant="h3">Options</Heading>
            <Table label="init options" size="compact">
              <THead>
                <Tr>
                  <Th>Option</Th>
                  <Th>Type</Th>
                  <Th>Default</Th>
                  <Th>Description</Th>
                </Tr>
              </THead>
              <TBody>
                {[
                  ["region", '"eu" | "us"', '"eu"', "Where events are stored."],
                  ["batchSize", "number", "10", "Events per network request."],
                  ["redact", "string[]", "[]", "Property names to strip before sending."],
                  ["debug", "boolean", "false", "Log every call to the console."],
                ].map((r) => (
                  <Tr key={r[0]}>
                    <Td>
                      <Code>{r[0]}</Code>
                    </Td>
                    <Td>{r[1]}</Td>
                    <Td>{r[2]}</Td>
                    <Td>{r[3]}</Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
            <Divider />
            <Row justify="space-between" wrap gap={3}>
              <Button variant="ghost" icon="arrow-left">
                Install the SDK
              </Button>
              <Button variant="outline" iconEnd="arrow-right">
                Identify users
              </Button>
            </Row>
          </Stack>
          <Box as="aside">
            <Stack gap={2}>
              <Text variant="label">On this page</Text>
              {["Install", "Initialise and track", "Options"].map((t) => (
                <Link key={t} href="/preview/docs" variant="nav">
                  {t}
                </Link>
              ))}
            </Stack>
          </Box>
        </Grid>
      </Container>
    </Section>
  );
}
