import { Button, Heading, Text } from "@/components/normy";
import { Aurora, GridGlow, Meteors, Starfield } from "@/components/normy/loops-b";
import type { Sample } from "./sample-type";

/** Heading + text + button on top of a loop background. */
const hero = (title: string, text: string, cta: string) => (
  <>
    <Heading variant="h2">{title}</Heading>
    <Text variant="muted">{text}</Text>
    <Button>{cta}</Button>
  </>
);

/* Atlas samples for loop batch B. Key = component type. */
export const LOOP_SAMPLES_B: Record<string, Sample> = {
  aurora: (v, s) => (
    <Aurora variant={v} size={s}>
      {hero("Calm, even when busy", "Soft colour fields drift behind your message and never compete with it.", "Get started")}
    </Aurora>
  ),
  gridGlow: (v, s) => (
    <GridGlow variant={v} size={s}>
      {hero("Built on a grid you can feel", "Light travels along the lines and keeps the page quietly alive.", "See the system")}
    </GridGlow>
  ),
  starfield: (v, s) => (
    <Starfield variant={v} size={s}>
      {hero("Room to think", "A slow field of particles gives depth without asking for attention.", "Start exploring")}
    </Starfield>
  ),
  meteors: (v, s) => (
    <Meteors variant={v} size={s}>
      {hero("Moments worth noticing", "Thin streaks cross the sky now and then, then disappear.", "Make a wish")}
    </Meteors>
  ),
};
/** Types whose sample needs the wide stage. */
export const LOOP_WIDE_B: string[] = ["aurora", "gridGlow", "starfield", "meteors"];
