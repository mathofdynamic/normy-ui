"use client";

import { useMemo, useState } from "react";
import { Box, VisuallyHidden, Avatar, Badge, Button, Card, Checkbox, Chip, Drawer, Dropdown, EmptyState, IconButton, Input, PageHeader, Pagination, Row, Select, Stack, Table, TBody, Td, Text, Th, THead, Tr, DataList, useToast } from "@/components/normy";
import { CUSTOMERS, type Customer } from "@/components/preview/data";

type Key = "name" | "plan" | "status" | "mrr" | "seats";
const tone = (s: string) => (s === "Active" ? "success" : s === "Trial" ? "info" : s === "Churn risk" ? "danger" : "neutral");
const PER = 10;

export default function DataTable() {
  const toast = useToast();
  const [q, setQ] = useState("");
  const [plan, setPlan] = useState("all");
  const [statuses, setStatuses] = useState<string[]>([]);
  const [sort, setSort] = useState<{ key: Key; dir: "asc" | "desc" }>({ key: "mrr", dir: "desc" });
  const [page, setPage] = useState(1);
  const [sel, setSel] = useState<string[]>([]);
  const [open, setOpen] = useState<Customer | null>(null);

  const rows = useMemo(() => {
    const xs = CUSTOMERS.filter((c) => (!q || `${c.name} ${c.company} ${c.email}`.toLowerCase().includes(q.toLowerCase())) && (plan === "all" || c.plan === plan) && (!statuses.length || statuses.includes(c.status)));
    xs.sort((a, b) => {
      const va = a[sort.key];
      const vb = b[sort.key];
      const r = typeof va === "number" ? (va as number) - (vb as number) : String(va).localeCompare(String(vb));
      return sort.dir === "asc" ? r : -r;
    });
    return xs;
  }, [q, plan, statuses, sort]);

  const pages = Math.max(1, Math.ceil(rows.length / PER));
  const view = rows.slice((page - 1) * PER, page * PER);
  const th = (key: Key, label: string) => (
    <Th sorted={sort.key === key ? sort.dir : undefined} onSort={() => setSort({ key, dir: sort.key === key && sort.dir === "desc" ? "asc" : "desc" })}>
      {label}
    </Th>
  );
  const allOnPage = view.length > 0 && view.every((r) => sel.includes(r.id));

  return (
    <Stack gap={5}>
      <PageHeader title="Customers" eyebrow="Workspace" description={`${CUSTOMERS.length} accounts · $${CUSTOMERS.reduce((a, c) => a + c.mrr, 0).toLocaleString("en-US")} MRR`} actions={<><Button size="sm" variant="outline" icon="upload">Import</Button><Button size="sm" icon="plus">Add customer</Button></>} />
      <Card nid="table-card">
        <Box size="md">
        <Stack gap={4}>
          <Row gap={3} wrap>
            <div style={{ flex: "1 1 16rem" }}>
              <Input label="Search customers" hideLabel required icon="search" placeholder="Search name, company, email…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} size="sm" nid="table-search" />
            </div>
            <div style={{ width: "10rem" }}>
              <Select label="Plan" hideLabel required size="sm" value={plan} onValueChange={(v) => { setPlan(v); setPage(1); }} options={[{ value: "all", label: "All plans" }, { value: "Starter", label: "Starter" }, { value: "Team", label: "Team" }, { value: "Scale", label: "Scale" }]} />
            </div>
            <Row gap={2} wrap>
              {["Active", "Trial", "Churn risk", "Paused"].map((s) => (
                <Chip key={s} size="sm" selected={statuses.includes(s)} onClick={() => { setStatuses(statuses.includes(s) ? statuses.filter((x) => x !== s) : [...statuses, s]); setPage(1); }}>
                  {s}
                </Chip>
              ))}
            </Row>
          </Row>
          {sel.length ? (
            <Row gap={3}>
              <Badge variant="accent">{sel.length} selected</Badge>
              <Button size="xs" variant="outline" icon="send" onClick={() => toast({ title: `Emailed ${sel.length} customers`, variant: "success" })}>
                Email
              </Button>
              <Button size="xs" variant="ghost" icon="x" onClick={() => setSel([])}>
                Clear
              </Button>
            </Row>
          ) : null}
        </Stack>
        </Box>
        {view.length === 0 ? (
          <EmptyState icon="search" title="No customers match" description="Try a different search or clear the status filters." variant="plain" />
        ) : (
          <Table variant="plain" label="Customers" nid="customers-table">
            <THead>
              <Tr>
                <Th>
                  <Checkbox label={<VisuallyHidden>Select all on page</VisuallyHidden>} checked={allOnPage} onChange={() => setSel(allOnPage ? sel.filter((id) => !view.some((v) => v.id === id)) : [...new Set([...sel, ...view.map((v) => v.id)])])} size="sm" />
                </Th>
                {th("name", "Customer")}
                {th("plan", "Plan")}
                {th("status", "Status")}
                {th("seats", "Seats")}
                {th("mrr", "MRR")}
                <Th>Last seen</Th>
                <Th>
                  <VisuallyHidden>Actions</VisuallyHidden>
                </Th>
              </Tr>
            </THead>
            <TBody>
              {view.map((c) => (
                <Tr key={c.id} selected={sel.includes(c.id)}>
                  <Td>
                    <Checkbox label={<VisuallyHidden>Select {c.name}</VisuallyHidden>} checked={sel.includes(c.id)} onChange={() => setSel(sel.includes(c.id) ? sel.filter((x) => x !== c.id) : [...sel, c.id])} size="sm" />
                  </Td>
                  <Td>
                    <Row gap={3}>
                      <Avatar name={c.name} size="sm" />
                      <Stack gap={0}>
                        <Text variant="strong" as="span">
                          {c.name}
                        </Text>
                        <Text variant="caption" as="span">
                          {c.company} · {c.id}
                        </Text>
                      </Stack>
                    </Row>
                  </Td>
                  <Td>{c.plan}</Td>
                  <Td>
                    <Badge variant={tone(c.status)} dot>
                      {c.status}
                    </Badge>
                  </Td>
                  <Td>{c.seats}</Td>
                  <Td>${c.mrr.toLocaleString("en-US")}</Td>
                  <Td>
                    <Text variant="caption" as="span">
                      {c.lastSeen}
                    </Text>
                  </Td>
                  <Td>
                    <Dropdown
                      trigger={<IconButton icon="more-horizontal" label={`Actions for ${c.name}`} size="sm" />}
                      items={[
                        { label: "View details", icon: "eye", onSelect: () => setOpen(c) },
                        { label: "Send email", icon: "mail", shortcut: "E" },
                        { label: "Change plan", icon: "credit-card" },
                        { type: "separator" },
                        { label: "Pause account", icon: "pause", onSelect: () => toast({ title: `${c.company} paused`, variant: "warning" }) },
                      ]}
                    />
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        )}
        <Box size="sm">
          <Pagination page={page} total={pages} onPageChange={setPage} summary={`${rows.length ? (page - 1) * PER + 1 : 0}–${Math.min(page * PER, rows.length)} of ${rows.length}`} nid="table-pagination" />
        </Box>
      </Card>
      <Drawer open={!!open} onOpenChange={(o) => !o && setOpen(null)} title={open?.company ?? ""} description={open?.name} footer={<><Button variant="ghost" onClick={() => setOpen(null)}>Close</Button><Button>Open account</Button></>}>
        {open ? (
          <DataList items={[["Customer ID", open.id], ["Email", open.email], ["Plan", open.plan], ["Status", open.status], ["Seats", open.seats], ["MRR", `$${open.mrr}`], ["Last seen", open.lastSeen]]} />
        ) : null}
      </Drawer>
    </Stack>
  );
}
