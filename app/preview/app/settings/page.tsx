"use client";

import { Alert, Avatar, Badge, Button, Card, CardBody, CardFooter, CardHeader, Checkbox, Combobox, DataList, Dialog, DialogClose, DialogContent, DialogTrigger, Grid, Input, PageHeader, Progress, RadioGroup, Row, Select, Slider, Stack, Switch, Tabs, Text, Textarea, useToast } from "@/components/normy";

export default function Settings() {
  const toast = useToast();
  const saved = () => toast({ title: "Settings saved", variant: "success" });
  return (
    <Stack gap={5}>
      <PageHeader title="Settings" eyebrow="Account" description="Manage your profile, notifications, workspace and billing." />
      <Tabs
        label="Settings sections"
        nid="settings-tabs"
        items={[
          {
            value: "profile",
            label: "Profile",
            icon: "user",
            content: (
              <Grid cols={{ base: 1, lg: 3 }} gap={6}>
                <Card nid="profile-card">
                  <CardBody>
                    <Stack gap={4} align="center">
                      <Avatar name="Inês Duarte" size="xl" status />
                      <Stack gap={0} align="center">
                        <Text variant="strong">Inês Duarte</Text>
                        <Text variant="caption">Growth lead · Admin</Text>
                      </Stack>
                      <Button size="sm" variant="outline" icon="upload">
                        Upload photo
                      </Button>
                    </Stack>
                  </CardBody>
                </Card>
                <Card nid="profile-form" style={{ gridColumn: "span 2" }}>
                  <CardHeader title="Personal details" description="Shown to teammates in comments and reports." />
                  <CardBody>
                    <Stack gap={4}>
                      <Grid cols={{ base: 1, md: 2 }} gap={4}>
                        <Input label="First name" required defaultValue="Inês" />
                        <Input label="Last name" required defaultValue="Duarte" />
                      </Grid>
                      <Input label="Email" type="email" required defaultValue="ines@lumen.dev" icon="mail" hint="Changing it will send a confirmation link." />
                      <Combobox label="Timezone" options={["Europe/Lisbon", "Europe/London", "Europe/Berlin", "America/Montreal", "America/New_York", "Asia/Tokyo"]} value="Europe/Lisbon" />
                      <Textarea label="Bio" rows={3} maxLength={240} showCount defaultValue="I look after activation and onboarding at Lumen." />
                    </Stack>
                  </CardBody>
                  <CardFooter>
                    <Button onClick={saved} nid="profile-save">
                      Save changes
                    </Button>
                    <Button variant="ghost">Cancel</Button>
                  </CardFooter>
                </Card>
              </Grid>
            ),
          },
          {
            value: "notifications",
            label: "Notifications",
            icon: "bell",
            content: (
              <Card>
                <CardHeader title="Email & Slack" description="Choose what reaches you, and where." />
                <CardBody>
                  <Stack gap={5}>
                    <Switch label="Anomaly alerts" description="When a tracked metric moves outside its usual range." defaultChecked />
                    <Switch label="Weekly digest" description="Monday 08:00, your timezone." defaultChecked />
                    <Switch label="Comment mentions" description="When someone @mentions you on a board." />
                    <Switch label="Product updates" description="At most twice a month." disabled />
                    <RadioGroup legend="Delivery" options={[{ value: "email", label: "Email" }, { value: "slack", label: "Slack", description: "#growth-alerts" }, { value: "both", label: "Both" }]} defaultValue="both" />
                    <Slider label="Alert sensitivity" defaultValue={3} min={1} max={5} ticks={5} format={(v) => ["", "Very low", "Low", "Balanced", "High", "Very high"][v]} />
                  </Stack>
                </CardBody>
                <CardFooter>
                  <Button onClick={saved}>Save preferences</Button>
                </CardFooter>
              </Card>
            ),
          },
          {
            value: "workspace",
            label: "Workspace",
            icon: "layers",
            content: (
              <Stack gap={5}>
                <Card>
                  <CardHeader title="Workspace" />
                  <CardBody>
                    <Grid cols={{ base: 1, md: 2 }} gap={4}>
                      <Input label="Workspace name" required defaultValue="Lumen Growth" />
                      <Select label="Data region" required defaultValue="eu" options={[{ value: "eu", label: "EU · Frankfurt" }, { value: "us", label: "US · Virginia" }]} hint="Changing region requires a migration." />
                      <Input label="API write key" required readOnly defaultValue="wk_live_8f2c4a91e0d3" suffix="Copy" />
                      <Select label="Default dashboard" required defaultValue="overview" options={[{ value: "overview", label: "Overview" }, { value: "activation", label: "Activation v2" }]} />
                    </Grid>
                  </CardBody>
                </Card>
                <Card variant="outline">
                  <CardHeader title="Danger zone" description="These actions are permanent." />
                  <CardBody>
                    <Row justify="space-between" wrap gap={3}>
                      <Text variant="small">Delete the workspace and all 4.2 billion events.</Text>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="danger" icon="trash" nid="delete-workspace">
                            Delete workspace
                          </Button>
                        </DialogTrigger>
                        <DialogContent variant="alert" eyebrow="Irreversible" title="Delete “Lumen Growth”?" description="All dashboards, cohorts and 4.2B events will be removed after 7 days." footer={<><DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose><DialogClose asChild><Button variant="danger">Delete forever</Button></DialogClose></>}>
                          <Stack gap={3}>
                            <Alert variant="warning" title="Export first?">You can download a full warehouse export from Settings → Data.</Alert>
                            <Input label="Type the workspace name to confirm" required placeholder="Lumen Growth" />
                          </Stack>
                        </DialogContent>
                      </Dialog>
                    </Row>
                  </CardBody>
                </Card>
              </Stack>
            ),
          },
          {
            value: "billing",
            label: "Billing",
            icon: "credit-card",
            content: (
              <Grid cols={{ base: 1, lg: 2 }} gap={5}>
                <Card>
                  <CardHeader title="Team plan" eyebrow="Current plan" action={<Badge variant="accent">Renews Dec 1</Badge>} />
                  <CardBody>
                    <Stack gap={4}>
                      <Progress label="Events this month" value={18.2} max={25} showValue />
                      <Progress label="Seats" value={14} max={20} showValue />
                      <DataList items={[["Seats", "14 × $49"], ["Add-ons", "Warehouse sync $120"], ["Next invoice", "$806.00"]]} />
                    </Stack>
                  </CardBody>
                  <CardFooter>
                    <Button variant="outline">Change plan</Button>
                    <Button variant="ghost">Download invoices</Button>
                  </CardFooter>
                </Card>
                <Card>
                  <CardHeader title="Payment method" />
                  <CardBody>
                    <Stack gap={4}>
                      <Checkbox variant="card" label="Visa ending 4242" description="Expires 08 / 28 · Default" defaultChecked />
                      <Checkbox variant="card" label="SEPA Direct Debit" description="PT50 •••• 9921" />
                      <Button variant="ghost" icon="plus" size="sm">
                        Add payment method
                      </Button>
                    </Stack>
                  </CardBody>
                </Card>
              </Grid>
            ),
          },
        ]}
      />
    </Stack>
  );
}
