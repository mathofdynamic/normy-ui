"use client";

import { useState } from "react";
import { Avatar, Badge, Box, Button, Card, Divider, Grid, Heading, IconButton, Input, PageHeader, Row, SegmentedControl, Stack, Text, Textarea, Tooltip } from "@/components/normy";
import { MESSAGES, THREADS } from "@/components/preview/data";

export default function Inbox() {
  const [active, setActive] = useState(THREADS[0].id);
  const [msgs, setMsgs] = useState(MESSAGES);
  const [draft, setDraft] = useState("");
  const thread = THREADS.find((t) => t.id === active)!;
  return (
    <Stack gap={5}>
      <PageHeader title="Inbox" eyebrow="Support" description="12 open conversations · median first reply 14 min" />
      <Card nid="inbox-card">
        <Grid cols={{ base: 1, lg: "20rem minmax(0, 1fr)" }} gap={0}>
          <Box style={{ borderRight: "1px solid var(--n-color-border)" }}>
            <Stack gap={3} style={{ padding: "var(--n-space-4)" }}>
              <Input label="Search conversations" hideLabel required icon="search" placeholder="Search…" size="sm" />
              <SegmentedControl label="Filter" size="sm" block options={[{ value: "open", label: "Open" }, { value: "mine", label: "Mine" }, { value: "closed", label: "Closed" }]} />
            </Stack>
            <Stack gap={0} as="ul" style={{ listStyle: "none", margin: 0, padding: "0 var(--n-space-2) var(--n-space-2)" }} nid="thread-list">
              {THREADS.map((t) => (
                <li key={t.id}>
                  <Button variant="list" onClick={() => setActive(t.id)} aria-current={t.id === active ? "true" : undefined}>
                    <Row gap={3} align="flex-start" style={{ width: "100%", minWidth: 0 }}>
                      <Avatar name={t.name} size="sm" />
                      <Stack gap={0} style={{ minWidth: 0, flex: 1 }}>
                        <Row justify="space-between" gap={2}>
                          <Text variant="strong" as="span">
                            {t.name}
                          </Text>
                          <Text variant="caption" as="span">
                            {t.time}
                          </Text>
                        </Row>
                        <Text variant="caption" as="span" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {t.preview}
                        </Text>
                      </Stack>
                      {t.unread ? <Badge variant="accent" dot size="sm">new</Badge> : null}
                    </Row>
                  </Button>
                </li>
              ))}
            </Stack>
          </Box>
          <Stack gap={0}>
            <Row justify="space-between" style={{ padding: "var(--n-space-4)" }} wrap gap={3}>
              <Row gap={3}>
                <Avatar name={thread.name} status />
                <Stack gap={0}>
                  <Heading variant="h5" as="h2">
                    {thread.name}
                  </Heading>
                  <Text variant="caption">{thread.company} · Scale plan</Text>
                </Stack>
              </Row>
              <Row gap={1}>
                <Tooltip content="Assign">
                  <IconButton icon="user" label="Assign" />
                </Tooltip>
                <Tooltip content="Snooze">
                  <IconButton icon="clock" label="Snooze" />
                </Tooltip>
                <Button size="sm" variant="outline" icon="check">
                  Resolve
                </Button>
              </Row>
            </Row>
            <Divider />
            <Stack gap={4} style={{ padding: "var(--n-space-5)", minHeight: "22rem" }} aria-live="polite" nid="chat-thread">
              {msgs.map((m, i) => (
                <Row key={i} gap={3} align="flex-end" justify={m.me ? "flex-end" : "flex-start"}>
                  {!m.me ? <Avatar name={m.from} size="xs" /> : null}
                  <Box variant={m.me ? "inverse" : "sunken"} size="sm" style={{ maxWidth: "34rem" }}>
                    <Stack gap={1}>
                      <Text variant={m.me ? "body" : "body"} as="span">
                        {m.text}
                      </Text>
                      <Text variant="caption" as="span">
                        {m.time}
                      </Text>
                    </Stack>
                  </Box>
                </Row>
              ))}
            </Stack>
            <Divider />
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!draft.trim()) return;
                setMsgs([...msgs, { from: "Me", me: true, text: draft, time: "now" }]);
                setDraft("");
              }}
            >
              <Stack gap={3} style={{ padding: "var(--n-space-4)" }}>
                <Textarea label="Reply" hideLabel rows={2} placeholder={`Reply to ${thread.name}…`} value={draft} onChange={(e) => setDraft(e.target.value)} />
                <Row justify="space-between">
                  <Row gap={1}>
                    <IconButton icon="paperclip" label="Attach file" />
                    <IconButton icon="image" label="Insert image" />
                  </Row>
                  <Button type="submit" icon="send" nid="chat-send">
                    Send
                  </Button>
                </Row>
              </Stack>
            </form>
          </Stack>
        </Grid>
      </Card>
    </Stack>
  );
}
