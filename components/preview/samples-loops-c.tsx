import { Avatar, Badge, Button, Card, CardBody, Icon, Stack, Text, type IconName } from "@/components/normy";
import { BorderBeam, Orbit, PulseRings, ShineText } from "@/components/normy/loops-c";
import type { Sample } from "./sample-type";

/* Atlas samples for loop batch C. Key = component type. */

const ic = (name: IconName) => <Icon name={name} />;

const orbitSample: Sample = (v, s) => (
  <Orbit
    variant={v}
    size={s}
    center={ic("sparkle")}
    rings={[
      [ic("zap"), ic("heart"), ic("bell")],
      [ic("users"), ic("chart-line"), ic("settings"), ic("star")],
      [<Avatar key="a" name="Ada Lovelace" size="sm" />, ic("globe"), <Avatar key="b" name="Grace Hopper" size="sm" />, ic("cloud"), ic("lock")],
    ]}
  />
);

const pulseSample: Sample = (v, s) => (
  <PulseRings variant={v} size={s} label="Live">
    <Icon name={v === "radar" ? "target" : "zap"} />
  </PulseRings>
);

const beamSample: Sample = (v) => (
  <BorderBeam variant={v} style={{ width: "min(100%, 22rem)" }}>
    <Card variant="outline">
      <CardBody>
        <Stack gap={3} align="flex-start">
          <Badge variant="info">Live</Badge>
          <Stack gap={1}>
            <Text variant="strong">Deploys are flowing</Text>
            <Text variant="small">A beam of light circles the card border, forever.</Text>
          </Stack>
          <Button size="sm">Open dashboard</Button>
        </Stack>
      </CardBody>
    </Card>
  </BorderBeam>
);

const shineSample: Sample = (v, s) => (
  <ShineText as={s === "inherit" ? "span" : "h2"} variant={v} size={s ?? "lg"}>
    Designed to feel alive
  </ShineText>
);

export const LOOP_SAMPLES_C: Record<string, Sample> = {
  orbit: orbitSample,
  pulseRings: pulseSample,
  borderBeam: beamSample,
  shineText: shineSample,
};
/** Types whose sample needs the wide stage. */
export const LOOP_WIDE_C: string[] = ["shineText"];
