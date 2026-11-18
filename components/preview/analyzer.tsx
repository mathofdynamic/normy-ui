"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Badge, Box, Button, Card, CardBody, CardHeader, Chart, Container, DataList, Grid, Heading, PageHeader, Progress, Row, Section, Stack, Stat, Table, TBody, Td, Text, Th, THead, Tr } from "@/components/normy";
import { scopeKey, scopeLabel } from "@/engine/cascade";
import { DERIVED_TOKEN_IDS } from "@/engine/compile";
import { COMPONENTS, getComponent } from "@/engine/components";
import { measureContrast, type ContrastResult } from "@/engine/contrast";
import { ALL_DEFS, GROUPS, PROPERTIES, registryStats, TOKENS } from "@/engine/registry";
import { currentResult, currentSystem, onApply } from "@/engine/runtime/apply";
import { DEFAULT_SYSTEM } from "@/engine/systems";
import type { DesignSystem } from "@/engine/types";
import { refIds } from "@/engine/values";
import { PREVIEW_PAGES } from "./pages";

/* ------------------------------------------------------------------ *
 * Analyzer — coverage, contrast, token usage and unused rules for the
 * ACTIVE design system. "Scan pages" loads every preview page in a
 * hidden iframe and records which components/variants/instances exist.
 * ------------------------------------------------------------------ */

interface ScanResult {
  instances: Set<string>;
  variants: Map<string, Set<string>>;
  components: Map<string, number>;
  pages: number;
}

const SCAN_KEY = "normy:analyzer-scan";

/** Active system + its compiled CSS. Read after mount only (server has neither), so hydration stays clean. */
function useActiveSystem() {
  const [state, setState] = useState<{ sys: DesignSystem; css: string }>({ sys: DEFAULT_SYSTEM, css: "" });
  useEffect(() => {
    const c = currentSystem();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (c) setState({ sys: c, css: currentResult()?.css ?? "" });
    return onApply((r, s) => setState({ sys: s, css: r.css }));
  }, []);
  return state;
}

export function Analyzer() {
  const { sys: system, css: compiledCss } = useActiveSystem();
  const [contrast, setContrast] = useState<ContrastResult[]>([]);
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState<string | null>(null);
  const frame = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setContrast(measureContrast()), 250);
    return () => clearTimeout(t);
  }, [system]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SCAN_KEY);
      if (!raw) return;
      const j = JSON.parse(raw);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setScan({ instances: new Set(j.instances), variants: new Map(Object.entries(j.variants as Record<string, string[]>).map(([k, v]) => [k, new Set(v)])), components: new Map(Object.entries(j.components as Record<string, number>)), pages: j.pages });
    } catch {
      /* ignore */
    }
  }, []);

  const runScan = async () => {
    const result: ScanResult = { instances: new Set(), variants: new Map(), components: new Map(), pages: 0 };
    const pages = PREVIEW_PAGES.filter((p) => p.group !== "Labs");
    for (const p of pages) {
      setScanning(p.title);
      await new Promise<void>((resolve) => {
        const f = frame.current!;
        const done = () => {
          setTimeout(() => {
            try {
              const doc = f.contentDocument!;
              doc.querySelectorAll("[data-n-id]").forEach((el) => result.instances.add(el.getAttribute("data-n-id")!));
              doc.querySelectorAll("[data-n]").forEach((el) => {
                const c = el.getAttribute("data-n")!;
                result.components.set(c, (result.components.get(c) ?? 0) + 1);
                const v = el.getAttribute("data-n-variant");
                if (v) result.variants.set(c, (result.variants.get(c) ?? new Set()).add(v));
              });
            } catch {
              /* cross-origin never happens here */
            }
            f.removeEventListener("load", done);
            resolve();
          }, 900);
        };
        f.addEventListener("load", done);
        f.src = `${p.path}?studio=1`;
      });
      result.pages++;
    }
    setScanning(null);
    setScan(result);
    localStorage.setItem(
      SCAN_KEY,
      JSON.stringify({ instances: [...result.instances], variants: Object.fromEntries([...result.variants].map(([k, v]) => [k, [...v]])), components: Object.fromEntries(result.components), pages: result.pages }),
    );
  };

  /* ---------- derived analytics ---------- */
  const stats = registryStats();
  const coverage = useMemo(
    () =>
      COMPONENTS.map((c) => {
        const rules = system.rules.filter((r) => r.scope.component === c.type);
        const props = new Set(rules.flatMap((r) => Object.keys(r.props)));
        const groups = new Set([...props].map((p) => ALL_DEFS.find((d) => d.id === p)?.group).filter(Boolean));
        return { c, rules: rules.length, props: props.size, groups: groups.size, recipe: c.recipe.length, custom: (system.components[c.type]?.variants?.length ?? 0) + (system.components[c.type]?.sizes?.length ?? 0) };
      }).sort((a, b) => b.props - a.props),
    [system],
  );
  const customized = coverage.filter((x) => x.rules > 0).length;

  const propUsage = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of system.rules) for (const k of Object.keys(r.props)) m.set(k, (m.get(k) ?? 0) + 1);
    return m;
  }, [system]);
  const groupUsage = GROUPS.filter((g) => g.section !== "foundations").map((g) => {
    const defs = PROPERTIES.filter((d) => d.group === g.id);
    return { g, used: defs.filter((d) => propUsage.has(d.id)).length, total: defs.length };
  });

  const tokenUsage = useMemo(() => {
    const m = new Map<string, number>();
    const add = (v: unknown) => refIds(v as never).forEach((id) => m.set(id, (m.get(id) ?? 0) + 1));
    for (const c of COMPONENTS) for (const r of c.recipe) Object.values(r.props).forEach(add);
    for (const r of system.rules) Object.values(r.props).forEach(add);
    Object.values(system.tokens).forEach(add);
    // Also count var() references anywhere in the compiled stylesheet (engine base, token chains, emitters).
    const css = compiledCss;
    for (const t of [...TOKENS.filter((d) => d.cssVar).map((d) => d.id), ...DERIVED_TOKEN_IDS]) {
      const v = `var(--n-${t.replace(/\./g, "-")}`;
      if (!m.has(t) && css.includes(v)) m.set(t, 1);
    }
    return m;
  }, [system, compiledCss]);
  const allTokenIds = [...TOKENS.filter((t) => t.cssVar).map((t) => t.id), ...DERIVED_TOKEN_IDS];
  const unusedTokens = allTokenIds.filter((id) => !tokenUsage.has(id) && !id.startsWith("bp.") && !id.startsWith("motion.") && !id.startsWith("space.unit") && !id.startsWith("space.density") && !id.startsWith("radius.base"));
  const topTokens = [...tokenUsage].sort((a, b) => b[1] - a[1]).slice(0, 8);

  const ruleIssues = useMemo(() => {
    const issues: Array<{ rule: string; reason: string }> = [];
    for (const r of system.rules) {
      const s = r.scope;
      if (!s.component) continue;
      const def = getComponent(s.component);
      if (!def) {
        issues.push({ rule: scopeLabel(s), reason: `Unknown component “${s.component}”` });
        continue;
      }
      const extra = system.components[s.component];
      if (s.variant && !def.variants.includes(s.variant) && !extra?.variants?.includes(s.variant) && !(scan?.variants.get(s.component)?.has(s.variant))) issues.push({ rule: scopeLabel(s), reason: `Variant “${s.variant}” is not defined` });
      if (s.size && !def.sizes.includes(s.size) && !extra?.sizes?.includes(s.size)) issues.push({ rule: scopeLabel(s), reason: `Size “${s.size}” is not defined` });
      if (s.part && !def.parts[s.part]) issues.push({ rule: scopeLabel(s), reason: `Part “${s.part}” does not exist` });
      if (s.instance && scan && !scan.instances.has(s.instance) && !s.instance.startsWith("lab-")) issues.push({ rule: scopeLabel(s), reason: `Instance #${s.instance} not found on any scanned page` });
      for (const k of Object.keys(r.props)) if (!k.startsWith("-") && !k.includes("-") && !ALL_DEFS.some((d) => d.id === k)) issues.push({ rule: scopeLabel(s), reason: `Unknown property “${k}”` });
    }
    return issues;
  }, [system, scan]);

  const failures = contrast.filter((c) => !c.pass);

  return (
    <Section size="sm">
      <Container variant="wide">
        <Stack gap={8}>
          <PageHeader
            variant="large"
            eyebrow="Labs · Analyzer"
            title={system.meta.name}
            description="Coverage, contrast, token usage and rule hygiene for the active design system."
            actions={
              <Button icon="search" loading={!!scanning} onClick={runScan} nid="scan-pages">
                {scanning ? `Scanning ${scanning}…` : scan ? `Rescan ${scan.pages} pages` : "Scan pages"}
              </Button>
            }
          />
          <Grid cols={{ base: 2, lg: 5 }} gap={4}>
            <Stat label="Registry properties" value={String(stats.total)} meta={`${stats.tokens} tokens · ${stats.properties} style/motion`} icon="sliders" />
            <Stat label="Components" value={String(COMPONENTS.length)} meta={`${customized} customised by this system`} icon="grid" />
            <Stat label="System rules" value={String(system.rules.length)} meta={`${Object.keys(system.tokens).length + Object.keys(system.dark).length} token overrides`} icon="layers" />
            <Stat label="Contrast checks" value={`${contrast.length - failures.length}/${contrast.length}`} delta={failures.length ? `${failures.length} failing` : "all pass"} trend={failures.length ? "down" : "up"} icon="eye" />
            <Stat label="Rule issues" value={String(ruleIssues.length)} meta={scan ? `${scan.instances.size} instances on ${scan.pages} pages` : "scan pages for instance checks"} icon="alert-triangle" />
          </Grid>

          <Grid cols={{ base: 1, lg: 2 }} gap={5}>
            <Card nid="contrast-card">
              <CardHeader eyebrow="Accessibility" title="Contrast report" description="WCAG 2 ratio and APCA Lc for every semantic text/surface pair, light and dark." />
              <Table variant="plain" size="compact" label="Contrast pairs">
                <THead>
                  <Tr>
                    <Th>Pair</Th>
                    <Th>Mode</Th>
                    <Th>Ratio</Th>
                    <Th>APCA</Th>
                    <Th>Result</Th>
                  </Tr>
                </THead>
                <TBody>
                  {contrast.map((c) => (
                    <Tr key={c.label + c.mode}>
                      <Td>
                        <Stack gap={0}>
                          <Text variant="small" as="span">
                            {c.label}
                          </Text>
                          <Text variant="caption" as="span">
                            {c.fg} on {c.bg}
                          </Text>
                        </Stack>
                      </Td>
                      <Td>{c.mode}</Td>
                      <Td>{c.ratio.toFixed(2)}:1</Td>
                      <Td>Lc {c.lc.toFixed(0)}</Td>
                      <Td>
                        <Badge variant={c.pass ? "success" : "danger"} size="sm">
                          {c.pass ? `AA ≥${c.min}` : `fails ${c.min}`}
                        </Badge>
                      </Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            </Card>
            <Stack gap={5}>
              <Card nid="group-coverage">
                <CardHeader eyebrow="Coverage" title="Property groups used by this system" />
                <CardBody>
                  <Stack gap={3}>
                    {groupUsage.map((x) => (
                      <Progress key={x.g.id} label={`${x.g.label} · ${x.used}/${x.total}`} value={x.used} max={x.total} size="sm" />
                    ))}
                  </Stack>
                </CardBody>
              </Card>
              <Card>
                <CardHeader eyebrow="Tokens" title="Most referenced tokens" description={`${tokenUsage.size} tokens referenced · ${unusedTokens.length} never referenced`} />
                <CardBody>
                  <Chart kind="bar" label="Token references" labels={topTokens.map(([id]) => id.split(".").pop()!)} series={[{ name: "References", data: topTokens.map(([, n]) => n) }]} height={200} />
                </CardBody>
              </Card>
            </Stack>
          </Grid>

          <Grid cols={{ base: 1, lg: 2 }} gap={5}>
            <Card nid="component-coverage">
              <CardHeader eyebrow="Coverage" title="Components customised" description="Rules, properties and groups this system sets per component (recipes are the defaults)." />
              <Table variant="plain" size="compact" label="Component coverage">
                <THead>
                  <Tr>
                    <Th>Component</Th>
                    <Th>Rules</Th>
                    <Th>Props</Th>
                    <Th>Groups</Th>
                    <Th>Recipe</Th>
                  </Tr>
                </THead>
                <TBody>
                  {coverage.slice(0, 24).map((x) => (
                    <Tr key={x.c.type}>
                      <Td>{x.c.label}</Td>
                      <Td>{x.rules}</Td>
                      <Td>{x.props}</Td>
                      <Td>{x.groups}</Td>
                      <Td>{x.recipe}</Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            </Card>
            <Stack gap={5}>
              <Card nid="rule-issues">
                <CardHeader eyebrow="Hygiene" title="Unused & invalid rules" />
                <CardBody>
                  {ruleIssues.length === 0 ? (
                    <Alert variant="success" title="No issues">Every rule targets a known component, part, variant and property{scan ? ", and every instance exists on a scanned page" : ""}.</Alert>
                  ) : (
                    <Stack gap={2}>
                      {ruleIssues.slice(0, 20).map((i) => (
                        <Alert key={i.rule + i.reason} variant="warning" size="sm" title={i.rule}>
                          {i.reason}
                        </Alert>
                      ))}
                    </Stack>
                  )}
                </CardBody>
              </Card>
              <Card>
                <CardHeader eyebrow="Tokens" title="Never referenced" description="Defined but unused by any recipe or rule." />
                <CardBody>
                  <Row gap={2} wrap>
                    {unusedTokens.slice(0, 40).map((t) => (
                      <Badge key={t} variant="outline" size="sm">
                        {t}
                      </Badge>
                    ))}
                  </Row>
                </CardBody>
              </Card>
              {scan ? (
                <Card>
                  <CardHeader eyebrow="Scan" title="Components in the wild" />
                  <CardBody>
                    <DataList variant="grid" items={[...scan.components].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([c, n]) => [c, `${n}×`])} />
                  </CardBody>
                </Card>
              ) : null}
            </Stack>
          </Grid>
          <Box>
            <Heading variant="h5" as="h2">
              Rules in this system
            </Heading>
            <Text variant="caption">{system.rules.map((r) => scopeKey(r.scope)).slice(0, 60).join(" · ") || "No rules — this system is tokens only."}</Text>
          </Box>
          <iframe ref={frame} title="Page scanner" aria-hidden tabIndex={-1} style={{ position: "absolute", width: 1280, height: 800, left: -99999, top: 0, visibility: "hidden" }} />
        </Stack>
      </Container>
    </Section>
  );
}
