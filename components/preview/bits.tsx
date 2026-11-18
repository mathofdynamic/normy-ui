import type { ReactNode } from "react";
import { Heading, Stack, Text } from "@/components/normy";

/** Section opener used across preview pages — composed only of Normy components. */
export function SectionIntro({ eyebrow, title, lead, align = "start", nid }: { eyebrow?: string; title: ReactNode; lead?: ReactNode; align?: "start" | "center"; nid?: string }) {
  return (
    <Stack gap={4} align={align === "center" ? "center" : "flex-start"} nid={nid}>
      {eyebrow ? <Heading variant="eyebrow">{eyebrow}</Heading> : null}
      <Heading variant="h2" style={align === "center" ? { textAlign: "center" } : undefined}>
        {title}
      </Heading>
      {lead ? (
        <Text variant="lead" style={align === "center" ? { textAlign: "center" } : undefined}>
          {lead}
        </Text>
      ) : null}
    </Stack>
  );
}
