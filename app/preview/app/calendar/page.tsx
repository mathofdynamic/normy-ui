"use client";

import { useState } from "react";
import { Badge, Button, Calendar, Card, CardBody, CardHeader, Grid, PageHeader, SegmentedControl, Stack, Timeline } from "@/components/normy";
import { EVENTS } from "@/components/preview/data";

export default function CalendarPage() {
  const [selected, setSelected] = useState("2026-11-18");
  const today = EVENTS.filter((e) => e.date === selected);
  return (
    <Stack gap={5}>
      <PageHeader title="November 2026" eyebrow="Calendar" description="10 events this month · offsite in Lisbon on the 24th" actions={<><SegmentedControl label="View" size="sm" options={[{ value: "month", label: "Month" }, { value: "week", label: "Week" }, { value: "day", label: "Day" }]} /><Button size="sm" icon="plus">New event</Button></>} />
      <Grid cols={{ base: 1, lg: "minmax(0, 1fr) 20rem" }} gap={5}>
        <Calendar variant="large" events={EVENTS} selected={selected} onSelect={setSelected} nid="month-calendar" />
        <Stack gap={4}>
          <Calendar events={EVENTS} selected={selected} onSelect={setSelected} />
          <Card>
            <CardHeader eyebrow={selected} title={today.length ? `${today.length} event${today.length > 1 ? "s" : ""}` : "Nothing scheduled"} action={<Badge variant="accent">Today</Badge>} />
            <CardBody>
              <Timeline items={today.length ? today.map((e, i) => ({ title: e.title, time: ["09:30", "14:00", "16:30"][i] ?? "All day", icon: "calendar" as const })) : [{ title: "A clear day. Block some focus time?", time: "", icon: "sparkle" as const }]} />
            </CardBody>
          </Card>
        </Stack>
      </Grid>
    </Stack>
  );
}
