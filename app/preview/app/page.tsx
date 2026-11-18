import { Avatar, Badge, Box, Button, Card, CardBody, CardFooter, CardHeader, Chart, Grid, Link, PageHeader, Progress, Row, Stack, Stat, Table, TBody, Td, Text, Th, THead, Timeline, Tr } from "@/components/normy";
import { ACTIVITY, CHANNELS, CUSTOMERS, DAYS, MONTHS, REVENUE, REVENUE_PREV, SIGNUPS } from "@/components/preview/data";

const tone = (s: string) => (s === "Active" ? "success" : s === "Trial" ? "info" : s === "Churn risk" ? "danger" : "neutral");

export default function Overview() {
  return (
    <Stack gap={6}>
      <PageHeader
        nid="overview-header"
        eyebrow="Wednesday, 18 November"
        title="Good morning, Inês"
        description="Revenue is up 12.4% on last month. Two accounts need attention."
        actions={
          <>
            <Button variant="outline" size="sm" icon="calendar">
              Last 30 days
            </Button>
            <Button size="sm" icon="download">
              Export
            </Button>
          </>
        }
      />
      <Grid cols={{ base: 1, md: 2, lg: 4 }} gap={4}>
        <Stat nid="kpi-mrr" label="MRR" icon="credit-card" value="$72,410" delta="12.4%" meta="vs Oct" spark={<Chart kind="spark" label="MRR trend" series={[{ name: "MRR", data: REVENUE }]} />} />
        <Stat nid="kpi-active" label="Weekly active" icon="users" value="18,204" delta="4.1%" meta="vs last week" spark={<Chart kind="spark" label="Active users" series={[{ name: "Active", data: [12, 13, 13, 15, 14, 16, 18], color: 3 }]} />} />
        <Stat nid="kpi-conv" label="Trial → paid" icon="target" value="23.8%" delta="1.2 pts" trend="down" meta="vs Oct" spark={<Chart kind="spark" label="Conversion" series={[{ name: "Conv", data: [28, 27, 26, 25, 25, 24, 24], color: 4 }]} />} />
        <Stat nid="kpi-nps" label="NPS" icon="heart" value="61" delta="+6" meta="314 responses" spark={<Chart kind="spark" label="NPS" series={[{ name: "NPS", data: [50, 52, 55, 54, 58, 59, 61], color: 5 }]} />} />
      </Grid>
      <Grid cols={{ base: 1, lg: 3 }} gap={4}>
        <Box span={{ base: 1, lg: 2 }}>
          <Card nid="revenue-card">
            <CardHeader eyebrow="Revenue" title="Monthly recurring revenue" description="Thousands of USD, trailing 12 months" action={<Badge variant="success">+38% YoY</Badge>} />
            <CardBody>
              <Chart kind="area" label="MRR this year vs last year" labels={MONTHS} height={260} series={[{ name: "This year", data: REVENUE, color: 1 }, { name: "Last year", data: REVENUE_PREV, color: 2 }]} />
            </CardBody>
          </Card>
        </Box>
        <Card nid="channels-card">
          <CardHeader eyebrow="Acquisition" title="Signups by channel" />
          <CardBody>
            <Chart kind="donut" label="Signups by channel" series={CHANNELS} centerLabel="100%" />
          </CardBody>
        </Card>
      </Grid>
      <Grid cols={{ base: 1, lg: 3 }} gap={4}>
        <Card>
          <CardHeader eyebrow="This week" title="New signups" />
          <CardBody>
            <Chart kind="bar" label="Signups per day" labels={DAYS} series={[{ name: "Signups", data: SIGNUPS, color: 1 }]} height={200} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader eyebrow="Goals" title="Q4 targets" />
          <CardBody>
            <Stack gap={4}>
              <Progress label="MRR $80k" value={72.4} max={80} showValue />
              <Progress label="Activation 45%" value={38} max={45} showValue />
              <Progress label="Churn below 2%" value={86} showValue />
              <Progress label="Docs coverage" value={64} showValue variant="segmented" />
            </Stack>
          </CardBody>
        </Card>
        <Card>
          <CardHeader eyebrow="Activity" title="What changed" action={<Link href="/preview/app/inbox" variant="subtle">All</Link>} />
          <CardBody>
            <Timeline items={ACTIVITY} />
          </CardBody>
        </Card>
      </Grid>
      <Card nid="accounts-card">
        <CardHeader eyebrow="Accounts" title="Largest accounts" action={<Button size="xs" variant="ghost" href="/preview/app/table" iconEnd="arrow-right">View all</Button>} />
        <Table variant="plain" label="Largest accounts">
          <THead>
            <Tr>
              <Th>Customer</Th>
              <Th>Plan</Th>
              <Th>Status</Th>
              <Th>Seats</Th>
              <Th>MRR</Th>
            </Tr>
          </THead>
          <TBody>
            {[...CUSTOMERS].sort((a, b) => b.mrr - a.mrr).slice(0, 6).map((c) => (
              <Tr key={c.id}>
                <Td>
                  <Row gap={3}>
                    <Avatar name={c.name} size="sm" />
                    <Stack gap={0}>
                      <Text variant="strong" as="span">
                        {c.company}
                      </Text>
                      <Text variant="caption" as="span">
                        {c.name}
                      </Text>
                    </Stack>
                  </Row>
                </Td>
                <Td>{c.plan}</Td>
                <Td>
                  <Badge variant={tone(c.status)} dot>
                    {c.status}
                  </Badge>
                </Td>
                <Td>{c.seats}</Td>
                <Td>${c.mrr.toLocaleString("en-US")}</Td>
              </Tr>
            ))}
          </TBody>
        </Table>
        <CardFooter>
          <Text variant="caption">Updated 2 minutes ago · Data from Lumen warehouse sync</Text>
        </CardFooter>
      </Card>
    </Stack>
  );
}
