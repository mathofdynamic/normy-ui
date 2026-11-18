"use client";

import { useState } from "react";
import { AvatarGroup, Badge, Box, Button, Card, CardBody, CardFooter, Dropdown, Grid, Heading, IconButton, PageHeader, Progress, Row, Stack, Text, useToast } from "@/components/normy";
import { Icon } from "@/components/normy/icon";
import { KANBAN, type Task } from "@/components/preview/data";

export default function Kanban() {
  const toast = useToast();
  const [cols, setCols] = useState(KANBAN);
  const move = (task: Task, to: string) => {
    setCols((cs) => cs.map((c) => ({ ...c, tasks: c.id === to ? [...c.tasks.filter((t) => t.id !== task.id), task] : c.tasks.filter((t) => t.id !== task.id) })));
    toast({ title: `Moved to ${cols.find((c) => c.id === to)?.title}`, description: task.title, variant: "info" });
  };
  return (
    <Stack gap={5}>
      <PageHeader title="Q4 roadmap" eyebrow="Projects" description="8 tasks across 4 stages · sprint ends Nov 28" actions={<><AvatarGroup names={["Inês Duarte", "Kofi Mensah", "Mei Chen", "Tara Rao", "Sven Holm", "Rosa Diaz"]} /><Button size="sm" icon="plus">Add task</Button></>} />
      <Grid cols={{ base: 1, md: 2, lg: 4 }} gap={4} align="start" nid="kanban-board">
        {cols.map((col) => (
          <Box key={col.id} variant="sunken" size="sm" nid={`col-${col.id}`}>
            <Stack gap={3}>
              <Row justify="space-between">
                <Row gap={2}>
                  <Heading variant="h5" as="h2">
                    {col.title}
                  </Heading>
                  <Badge size="sm">{col.tasks.length}</Badge>
                </Row>
                <IconButton icon="plus" label={`Add task to ${col.title}`} size="sm" />
              </Row>
              {col.tasks.map((t) => (
                <Card key={t.id} variant="interactive" size="sm" as="article">
                  <CardBody>
                    <Stack gap={3}>
                      <Row justify="space-between" align="flex-start">
                        <Badge variant={t.tagTone} size="sm">
                          {t.tag}
                        </Badge>
                        <Dropdown
                          trigger={<IconButton icon="more-horizontal" label={`Move ${t.title}`} size="sm" />}
                          items={[{ type: "label", label: "Move to" }, ...cols.filter((c) => c.id !== col.id).map((c) => ({ label: c.title, icon: "arrow-right" as const, onSelect: () => move(t, c.id) }))]}
                        />
                      </Row>
                      <Text variant="strong">{t.title}</Text>
                      {t.progress !== undefined ? <Progress value={t.progress} size="sm" label="Progress" showValue /> : null}
                    </Stack>
                  </CardBody>
                  <CardFooter>
                    <AvatarGroup names={t.assignees} size="xs" />
                    <Row gap={3} style={{ marginLeft: "auto" }}>
                      {t.comments ? (
                        <Row gap={1}>
                          <Icon name="message" variant="muted" />
                          <Text variant="caption" as="span">
                            {t.comments}
                          </Text>
                        </Row>
                      ) : null}
                      {t.due ? (
                        <Row gap={1}>
                          <Icon name="clock" variant="muted" />
                          <Text variant="caption" as="span">
                            {t.due}
                          </Text>
                        </Row>
                      ) : null}
                    </Row>
                  </CardFooter>
                </Card>
              ))}
            </Stack>
          </Box>
        ))}
      </Grid>
    </Stack>
  );
}
