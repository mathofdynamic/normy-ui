"use client";

import { useState } from "react";
import { Alert, Button, Card, CardBody, CardFooter, CardHeader, Checkbox, DataList, Divider, EmptyState, Grid, Input, PageHeader, Price, RadioGroup, Row, Select, Stack, Stepper, Text } from "@/components/normy";

const STEPS = [{ label: "Plan", description: "Seats & add-ons" }, { label: "Details", description: "Billing address" }, { label: "Payment", description: "Card or SEPA" }, { label: "Done" }];

export default function Checkout() {
  const [step, setStep] = useState(0);
  const [seats, setSeats] = useState("15");
  const [paying, setPaying] = useState(false);
  const total = Number(seats) * 49 + 120;
  return (
    <Stack gap={5}>
      <PageHeader title="Upgrade to Team" eyebrow="Billing" description="You're on Starter. Team unlocks alerts, warehouse sync and unlimited dashboards." />
      <Stepper steps={STEPS} current={step} nid="checkout-stepper" />
      <Grid cols={{ base: 1, lg: "minmax(0, 1fr) 22rem" }} gap={6} align="start">
        <Card nid="checkout-form">
          {step === 0 ? (
            <>
              <CardHeader title="Choose seats and add-ons" />
              <CardBody>
                <Stack gap={5}>
                  <Select label="Seats" required value={seats} onValueChange={setSeats} options={["5", "10", "15", "20", "30"].map((v) => ({ value: v, label: `${v} seats` }))} />
                  <Checkbox variant="card" label="Warehouse sync" description="Snowflake, BigQuery or Redshift · $120 / month" defaultChecked />
                  <Checkbox variant="card" label="Priority support" description="1-hour response · $240 / month" />
                  <RadioGroup legend="Billing cycle" defaultValue="yearly" options={[{ value: "monthly", label: "Monthly" }, { value: "yearly", label: "Yearly", description: "2 months free" }]} />
                </Stack>
              </CardBody>
            </>
          ) : step === 1 ? (
            <>
              <CardHeader title="Billing details" />
              <CardBody>
                <Grid cols={{ base: 1, md: 2 }} gap={4}>
                  <Input label="Company" required defaultValue="Lumen Labs, Lda." />
                  <Input label="VAT number" defaultValue="PT 516 204 113" />
                  <Input label="Address" required defaultValue="Rua do Alecrim 12" />
                  <Input label="City" required defaultValue="Lisboa" />
                  <Input label="Postal code" required defaultValue="1200-018" />
                  <Select label="Country" required defaultValue="pt" options={[{ value: "pt", label: "Portugal" }, { value: "ca", label: "Canada" }, { value: "de", label: "Germany" }]} />
                </Grid>
              </CardBody>
            </>
          ) : step === 2 ? (
            <>
              <CardHeader title="Payment" />
              <CardBody>
                <Stack gap={4}>
                  <Input label="Card number" required icon="credit-card" defaultValue="4242 4242 4242 4242" />
                  <Grid cols={2} gap={4}>
                    <Input label="Expiry" required placeholder="MM / YY" defaultValue="08 / 28" />
                    <Input label="CVC" required placeholder="123" />
                  </Grid>
                  <Alert variant="info" title="Secure payment">Card details are tokenised by our payment provider. Lumen never sees the number.</Alert>
                </Stack>
              </CardBody>
            </>
          ) : (
            <CardBody>
              <EmptyState variant="plain" icon="check-circle" title="You're on Team" description={`Receipt #INV-2292 for $${total} is on its way to ines@lumen.dev.`} actions={<Button href="/preview/app">Back to dashboard</Button>} />
            </CardBody>
          )}
          {step < 3 ? (
            <CardFooter>
              <Button variant="ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
                Back
              </Button>
              <Button
                style={{ marginLeft: "auto" }}
                loading={paying}
                nid="checkout-next"
                iconEnd={step < 2 ? "arrow-right" : undefined}
                onClick={() => {
                  if (step === 2) {
                    setPaying(true);
                    setTimeout(() => {
                      setPaying(false);
                      setStep(3);
                    }, 1400);
                  } else setStep(step + 1);
                }}
              >
                {step === 2 ? `Pay $${total}` : "Continue"}
              </Button>
            </CardFooter>
          ) : null}
        </Card>
        <Card variant="sunk" nid="order-summary">
          <CardHeader title="Summary" eyebrow="Team plan" />
          <CardBody>
            <Stack gap={4}>
              <DataList items={[[`${seats} seats × $49`, `$${Number(seats) * 49}`], ["Warehouse sync", "$120"], ["VAT (reverse charge)", "$0"]]} />
              <Divider />
              <Row justify="space-between">
                <Text variant="strong">Total / month</Text>
                <Price amount={total} />
              </Row>
              <Text variant="caption">Cancel anytime. Prorated to the day.</Text>
            </Stack>
          </CardBody>
        </Card>
      </Grid>
    </Stack>
  );
}
