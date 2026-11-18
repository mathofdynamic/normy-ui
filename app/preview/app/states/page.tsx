import { Alert, Button, Card, CardBody, CardHeader, EmptyState, Grid, PageHeader, Progress, Row, Skeleton, Spinner, Stack, Text } from "@/components/normy";

export default function States() {
  return (
    <Stack gap={6}>
      <PageHeader title="Empty, loading & error" eyebrow="System states" description="Every app spends real time in these states. They're designed with the same rules as everything else." />
      <Grid cols={{ base: 1, md: 2, lg: 3 }} gap={5}>
        <EmptyState nid="empty-projects" icon="kanban" title="No projects yet" description="Projects group dashboards, cohorts and alerts around a goal." actions={<><Button icon="plus">New project</Button><Button variant="ghost">Import</Button></>} />
        <EmptyState variant="card" icon="search" title="No results for “retention q5”" description="Check the spelling or search all workspaces." actions={<Button variant="outline">Search everywhere</Button>} />
        <EmptyState variant="plain" icon="inbox" title="Inbox zero" description="Every conversation is resolved. Enjoy the quiet." />
      </Grid>
      <Grid cols={{ base: 1, lg: 2 }} gap={5}>
        <Card nid="loading-card">
          <CardHeader title="Loading — skeleton" description="Shimmer is an ambient animation from the rules." />
          <CardBody>
            <Stack gap={4}>
              <Row gap={3}>
                <Skeleton variant="circle" />
                <Stack gap={2} style={{ flex: 1 }}>
                  <Skeleton width="40%" />
                  <Skeleton width="70%" />
                </Stack>
              </Row>
              <Skeleton variant="block" />
              <Skeleton width="90%" />
              <Skeleton width="60%" />
            </Stack>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Loading — progress" />
          <CardBody>
            <Stack gap={5}>
              <Row gap={3}>
                <Spinner variant="accent" />
                <Text variant="small" as="span">
                  Recomputing cohorts…
                </Text>
              </Row>
              <Progress label="Importing events" value={64} showValue />
              <Progress label="Waiting for warehouse" />
              <Button loading>Saving</Button>
            </Stack>
          </CardBody>
        </Card>
      </Grid>
      <Grid cols={{ base: 1, lg: 2 }} gap={5}>
        <Stack gap={3} nid="alerts">
          <Alert variant="danger" title="Query failed" action={<Button size="sm" variant="outline">Retry</Button>}>
            The warehouse timed out after 30s. Try a narrower date range.
          </Alert>
          <Alert variant="warning" title="Approaching your event limit">You&apos;ve used 92% of this month&apos;s 25M events.</Alert>
          <Alert variant="success" title="Export ready">cohorts-nov.csv (2.4 MB) is ready to download.</Alert>
          <Alert variant="info" title="Scheduled maintenance">Ingestion pauses Sunday 02:00–02:15 UTC. No data is lost.</Alert>
        </Stack>
        <EmptyState variant="card" icon="alert-triangle" title="Something went wrong" description="We couldn't load this dashboard. Our team has been notified (error ref 7F3A-21)." actions={<><Button icon="refresh">Try again</Button><Button variant="ghost">Contact support</Button></>} nid="error-state" />
      </Grid>
    </Stack>
  );
}
