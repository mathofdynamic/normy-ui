"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { Alert, Box, Button, Checkbox, Divider, Grid, Heading, Input, Link, Quote, RadioGroup, Row, Section, Stack, Stepper, Text, useToast } from "@/components/normy";
import { Brand } from "./shells";

function Frame({ children, aside }: { children: ReactNode; aside: ReactNode }) {
  return (
    <Grid cols={{ base: 1, lg: 2 }} gap={0} style={{ minHeight: "100dvh" }}>
      <Section size="sm" nid="auth-form">
        <Box style={{ maxWidth: "26rem", marginInline: "auto", paddingInline: "var(--n-size-gutter)" }}>
          <Stack gap={8}>
            <Link href="/preview/saas" variant="subtle">
              <Row gap={2}>
                <Brand />
              </Row>
            </Link>
            {children}
          </Stack>
        </Box>
      </Section>
      <Section variant="inverse" nid="auth-aside">
        <Box style={{ maxWidth: "30rem", marginInline: "auto", paddingInline: "var(--n-size-gutter)", height: "100%", display: "flex", alignItems: "center" }}>{aside}</Box>
      </Section>
    </Grid>
  );
}

export function LoginForm() {
  const toast = useToast();
  const [email, setEmail] = useState("ines@lumen.dev");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (pw.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setError(null);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast({ title: "Welcome back, Inês", variant: "success" });
    }, 1200);
  };
  return (
    <Frame
      aside={
        <Quote variant="large" cite="Priya Raman, VP Product at Halcyon">
          We replaced three dashboards and a weekly meeting with one Lumen board.
        </Quote>
      }
    >
      <Stack gap={2}>
        <Heading variant="h2">Log in</Heading>
        <Text variant="muted">
          New here? <Link href="/preview/signup">Create a workspace</Link>
        </Text>
      </Stack>
      <Stack gap={3}>
        <Button variant="outline" icon="globe" nid="sso-google">
          Continue with Google
        </Button>
        <Button variant="outline" icon="lock">
          Continue with SAML SSO
        </Button>
      </Stack>
      <Divider label="or with email" />
      <form onSubmit={submit} noValidate>
        <Stack gap={4}>
          {error ? <Alert variant="danger" title="Couldn't log in">{error}</Alert> : null}
          <Input label="Work email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} icon="mail" nid="login-email" />
          <Input label="Password" type="password" required autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} error={error ? "At least 8 characters" : undefined} hint="Forgot it? We'll email a link." nid="login-password" />
          <Checkbox label="Keep me signed in for 30 days" defaultChecked />
          <Button type="submit" size="lg" loading={loading} nid="login-submit">
            Log in
          </Button>
        </Stack>
      </form>
    </Frame>
  );
}

export function SignupForm() {
  const toast = useToast();
  const [step, setStep] = useState(0);
  return (
    <Frame
      aside={
        <Stack gap={6}>
          <Heading variant="h2" as="p">
            Free up to a million events a month.
          </Heading>
          <Stack gap={3}>
            {["No credit card required", "SSO and data residency on every plan", "Import from Mixpanel or Amplitude in one click"].map((t) => (
              <Text key={t}>✓ {t}</Text>
            ))}
          </Stack>
        </Stack>
      }
    >
      <Stack gap={3}>
        <Heading variant="h2">Create your workspace</Heading>
        <Stepper steps={[{ label: "Account" }, { label: "Workspace" }, { label: "Plan" }]} current={step} nid="signup-stepper" />
      </Stack>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (step < 2) setStep(step + 1);
          else toast({ title: "Workspace created", description: "Check your inbox to confirm your email.", variant: "success" });
        }}
      >
        <Stack gap={4}>
          {step === 0 ? (
            <>
              <Input label="Full name" required autoComplete="name" defaultValue="Inês Duarte" />
              <Input label="Work email" type="email" required autoComplete="email" icon="mail" />
              <Input label="Password" type="password" required hint="12+ characters, or a passphrase." />
            </>
          ) : step === 1 ? (
            <>
              <Input label="Workspace name" required defaultValue="Lumen Growth" />
              <Input label="Workspace URL" required prefix="lumen.app/" defaultValue="growth" />
              <Input label="Team size" type="number" placeholder="12" />
            </>
          ) : (
            <RadioGroup legend="Choose a plan" variant="cards" defaultValue="team" options={[{ value: "starter", label: "Starter", description: "Free · 1M events" }, { value: "team", label: "Team", description: "$49 / seat · 14-day trial" }, { value: "scale", label: "Scale", description: "Talk to sales" }]} />
          )}
          <Row gap={3} justify="space-between">
            <Button variant="ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
              Back
            </Button>
            <Button type="submit" iconEnd="arrow-right" nid="signup-next">
              {step < 2 ? "Continue" : "Create workspace"}
            </Button>
          </Row>
        </Stack>
      </form>
      <Text variant="caption">
        By continuing you agree to the <Link href="/preview/docs">Terms</Link> and <Link href="/preview/docs">Privacy policy</Link>.
      </Text>
    </Frame>
  );
}
