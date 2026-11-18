"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Badge, Button, Card, CardBody, Heading, IconButton, Select, Text, useToast } from "@/components/normy";
import { diffSystems, type DiffEntry } from "@/engine/diff";
import { EXPORT_FORMATS, exportSystem, type ExportFormat } from "@/engine/export";
import { cloneSystem, parseSystem } from "@/engine/system";
import { STARTERS } from "@/engine/systems";
import type { DesignSystem } from "@/engine/types";
import { newSystemFrom, useStudio } from "./store";

/* ---------------- API helpers ---------------- */

interface Summary {
  id: string;
  name: string;
  description?: string;
  updatedAt: string;
  versions: number;
  rules: number;
  tokens: number;
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, { ...init, headers: { "content-type": "application/json", ...(init?.headers ?? {}) } });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error ?? r.statusText);
  return j as T;
}

export async function saveCurrent(note?: string): Promise<string> {
  const { system, markSaved } = useStudio.getState();
  const exists = await fetch(`/api/systems/${system.meta.id}`).then((r) => r.ok);
  if (exists) await api(`/api/systems/${system.meta.id}`, { method: "PUT", body: JSON.stringify({ system, note }) });
  else await api(`/api/systems`, { method: "POST", body: JSON.stringify({ system, note: note ?? "first save" }) });
  markSaved(system, system.meta.id);
  return system.meta.id;
}

function download(name: string, text: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/* ---------------- Diff view ---------------- */

export function DiffList({ entries }: { entries: DiffEntry[] }) {
  if (!entries.length) return <p className="st-empty">No differences.</p>;
  return (
    <div>
      {entries.slice(0, 400).map((d) => (
        <div key={d.path} className="st-diff-row">
          <span>
            <Badge size="sm" variant={d.kind === "added" ? "success" : d.kind === "removed" ? "danger" : "info"}>
              {d.kind}
            </Badge>{" "}
            {d.path}
          </span>
          {d.before !== undefined ? <del>− {d.before.slice(0, 160)}</del> : null}
          {d.after !== undefined ? <ins>+ {d.after.slice(0, 160)}</ins> : null}
        </div>
      ))}
    </div>
  );
}

/* ---------------- Systems panel ---------------- */

export function SystemsPanel() {
  const system = useStudio((s) => s.system);
  const baseline = useStudio((s) => s.baseline);
  const savedId = useStudio((s) => s.savedId);
  const load = useStudio((s) => s.load);
  const toast = useToast();
  const [list, setList] = useState<Summary[]>([]);
  const [versions, setVersions] = useState<Array<{ version: string; note: string }>>([]);
  const [diffA, setDiffA] = useState("baseline");
  const [diff, setDiff] = useState<DiffEntry[] | null>(null);
  const [note, setNote] = useState("");
  const file = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    try {
      const j = await api<{ systems: Summary[] }>("/api/systems");
      setList(j.systems);
      const v = await api<{ versions: Array<{ version: string; note: string }> }>(`/api/systems/${system.meta.id}/versions`).catch(() => ({ versions: [] }));
      setVersions(v.versions);
    } catch (e) {
      toast({ title: "Could not reach the systems API", description: (e as Error).message, variant: "danger" });
    }
  }, [system.meta.id, toast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount
    void refresh();
  }, [refresh]);

  const dirty = JSON.stringify(system) !== JSON.stringify(baseline);

  const doSave = async () => {
    try {
      await saveCurrent(note || undefined);
      setNote("");
      toast({ title: `Saved “${system.meta.name}”`, description: "Snapshot written to design-systems/.", variant: "success" });
      void refresh();
    } catch (e) {
      toast({ title: "Save failed", description: (e as Error).message, variant: "danger" });
    }
  };
  const doSaveAs = async () => {
    const name = window.prompt("Name for the new system", `${system.meta.name} copy`);
    if (!name) return;
    const next = newSystemFrom(system, name);
    load(next, null);
    setTimeout(async () => {
      await saveCurrent("created via Save as");
      void refresh();
      toast({ title: `Created “${name}”`, variant: "success" });
    }, 0);
  };
  const open = async (id: string) => {
    const j = await api<{ system: DesignSystem }>(`/api/systems/${id}`);
    load(j.system, id);
    toast({ title: `Loaded “${j.system.meta.name}”`, variant: "info" });
  };
  const duplicate = async (id: string) => {
    const j = await api<{ system: DesignSystem }>(`/api/systems/${id}`);
    const copy = cloneSystem(j.system, { id: `${id}-copy-${Date.now().toString(36).slice(-4)}`, name: `${j.system.meta.name} (copy)` });
    await api("/api/systems", { method: "POST", body: JSON.stringify({ system: copy, note: `duplicated from ${id}` }) });
    void refresh();
  };
  const remove = async (id: string) => {
    if (!window.confirm(`Delete “${id}” and all its versions from disk?`)) return;
    await api(`/api/systems/${id}`, { method: "DELETE" });
    void refresh();
  };
  const runDiff = async () => {
    let a: DesignSystem = baseline;
    if (diffA.startsWith("v:")) a = (await api<{ system: DesignSystem }>(`/api/systems/${system.meta.id}/versions/${diffA.slice(2)}`)).system;
    else if (diffA.startsWith("s:")) a = STARTERS.find((s) => s.meta.id === diffA.slice(2)) ?? baseline;
    setDiff(diffSystems(a, system));
  };
  const restore = async (version: string) => {
    const j = await api<{ system: DesignSystem }>(`/api/systems/${system.meta.id}/versions/${version}`);
    useStudio.getState().commit(j.system, `restore ${version}`);
  };
  const onImport = async (f: File) => {
    try {
      const s = parseSystem(JSON.parse(await f.text()));
      load(s, null);
      toast({ title: `Imported “${s.meta.name}”`, description: "Save it to write it to disk.", variant: "success" });
    } catch (e) {
      toast({ title: "Import failed", description: (e as Error).message, variant: "danger" });
    }
  };

  return (
    <div className="st-scroll" style={{ display: "flex", flexDirection: "column", gap: "var(--n-space-5)" }}>
      <section>
        <Heading variant="h5" as="h3">
          This system
        </Heading>
        <Text variant="caption">
          id <code>{system.meta.id}</code> · {savedId ? "on disk" : "not saved yet"} {dirty ? "· unsaved changes" : ""}
        </Text>
        <div className="st-stack" style={{ marginTop: "var(--n-space-2)" }}>
          <input className="st-in" placeholder="Snapshot note (optional)" aria-label="Snapshot note" value={note} onChange={(e) => setNote(e.target.value)} />
          <div className="st-row-ctl">
            <Button size="sm" icon="download" onClick={doSave}>
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={doSaveAs}>
              Save as…
            </Button>
            <Button size="sm" variant="ghost" icon="upload" onClick={() => file.current?.click()}>
              Import
            </Button>
            <input ref={file} type="file" accept="application/json,.json" hidden onChange={(e) => e.target.files?.[0] && onImport(e.target.files[0])} />
          </div>
        </div>
      </section>

      <section>
        <Heading variant="h5" as="h3">
          Starter systems
        </Heading>
        <div className="st-stack" style={{ marginTop: "var(--n-space-2)" }}>
          {STARTERS.map((s) => (
            <button key={s.meta.id} type="button" className="st-item" data-active={system.meta.basedOn === s.meta.id || system.meta.id === s.meta.id ? "" : undefined} onClick={() => load(cloneSystem(s, { id: s.meta.id, name: s.meta.name }), null)}>
              <span style={{ flex: 1 }}>
                <b>{s.meta.name}</b>
                <br />
                <small style={{ color: "var(--n-color-text-subtle)" }}>{s.meta.description}</small>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="st-row-ctl" style={{ justifyContent: "space-between" }}>
          <Heading variant="h5" as="h3">
            Saved on disk
          </Heading>
          <IconButton icon="refresh" label="Refresh list" size="sm" onClick={refresh} />
        </div>
        {list.length === 0 ? <p className="st-empty">Nothing saved yet. Save writes to design-systems/&lt;id&gt;/.</p> : null}
        <div className="st-stack" style={{ marginTop: "var(--n-space-2)" }}>
          {list.map((s) => (
            <Card key={s.id} variant="outline" size="sm">
              <CardBody>
                <div className="st-row-ctl" style={{ justifyContent: "space-between" }}>
                  <b style={{ color: "var(--n-color-text)" }}>{s.name}</b>
                  <Badge size="sm">{s.versions} versions</Badge>
                </div>
                <small>
                  {s.rules} rules · {s.tokens} tokens · {new Date(s.updatedAt).toLocaleString()}
                </small>
                <div className="st-row-ctl" style={{ marginTop: "var(--n-space-2)" }}>
                  <Button size="xs" onClick={() => open(s.id)}>
                    Load
                  </Button>
                  <Button size="xs" variant="outline" onClick={() => duplicate(s.id)}>
                    Duplicate
                  </Button>
                  <Button size="xs" variant="ghost" onClick={() => remove(s.id)}>
                    Delete
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <Heading variant="h5" as="h3">
          Versions &amp; diff
        </Heading>
        <div className="st-stack" style={{ marginTop: "var(--n-space-2)" }}>
          {versions.slice(0, 12).map((v) => (
            <div key={v.version} className="st-row-ctl">
              <span className="st-mono" style={{ fontSize: "0.6875rem", flex: 1 }}>
                {v.version.slice(0, 19)} {v.note ? `· ${v.note}` : ""}
              </span>
              <button type="button" className="st-mini" onClick={() => restore(v.version)}>
                restore
              </button>
            </div>
          ))}
          <div className="st-row-ctl">
            <select className="st-in" aria-label="Compare against" value={diffA} onChange={(e) => setDiffA(e.target.value)}>
              <option value="baseline">Last saved / loaded</option>
              {versions.map((v) => (
                <option key={v.version} value={`v:${v.version}`}>
                  Version {v.version.slice(0, 19)}
                </option>
              ))}
              {STARTERS.map((s) => (
                <option key={s.meta.id} value={`s:${s.meta.id}`}>
                  Starter: {s.meta.name}
                </option>
              ))}
            </select>
            <Button size="xs" variant="outline" onClick={runDiff}>
              Diff
            </Button>
          </div>
          {diff ? <DiffList entries={diff} /> : null}
        </div>
      </section>
    </div>
  );
}

/* ---------------- Export panel ---------------- */

export function ExportPanel() {
  const system = useStudio((s) => s.system);
  const [format, setFormat] = useState<ExportFormat>("css");
  const text = exportSystem(system, format);
  const meta = EXPORT_FORMATS.find((f) => f.id === format)!;
  return (
    <div className="st-scroll" style={{ display: "flex", flexDirection: "column", gap: "var(--n-space-3)" }}>
      <Select label="Format" required options={EXPORT_FORMATS.map((f) => ({ value: f.id, label: f.label }))} value={format} onValueChange={(v) => setFormat(v as ExportFormat)} size="sm" />
      <div className="st-row-ctl">
        <Button size="sm" icon="download" onClick={() => download(meta.file(system.meta.id), text)}>
          Download {meta.file(system.meta.id)}
        </Button>
        <Button size="sm" variant="outline" icon="copy" onClick={() => navigator.clipboard?.writeText(text)}>
          Copy
        </Button>
      </div>
      <Text variant="caption">
        {(text.length / 1024).toFixed(1)} KB · {text.split("\n").length} lines
      </Text>
      <pre className="st-code">{text.slice(0, 20000)}{text.length > 20000 ? "\n… (truncated preview — download for the full file)" : ""}</pre>
    </div>
  );
}

/* ---------------- History panel ---------------- */

export function HistoryPanel() {
  const past = useStudio((s) => s.past);
  const future = useStudio((s) => s.future);
  const jump = useStudio((s) => s.jump);
  const undo = useStudio((s) => s.undo);
  const redo = useStudio((s) => s.redo);
  return (
    <div className="st-scroll">
      <div className="st-row-ctl" style={{ marginBottom: "var(--n-space-3)" }}>
        <Button size="xs" variant="outline" icon="arrow-left" onClick={undo} disabled={!past.length}>
          Undo
        </Button>
        <Button size="xs" variant="outline" iconEnd="arrow-right" onClick={redo} disabled={!future.length}>
          Redo
        </Button>
        <Text variant="caption">
          {past.length} steps · {future.length} ahead
        </Text>
      </div>
      {past.length === 0 ? <p className="st-empty">No edits yet.</p> : null}
      {[...past].reverse().map((h, ri) => {
        const i = past.length - 1 - ri;
        return (
          <button key={h.at + ":" + i} type="button" className="st-item" onClick={() => jump(i)} title="Jump back to before this edit">
            <span className="st-mono" style={{ fontSize: "0.625rem", color: "var(--n-color-text-subtle)" }}>
              {new Date(h.at).toLocaleTimeString()}
            </span>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.label || "edit"}</span>
          </button>
        );
      })}
    </div>
  );
}
