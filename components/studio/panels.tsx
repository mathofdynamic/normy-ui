"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Badge, Button, Text, useToast } from "@/components/normy";
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
    <div className="st-lib">
      <section className="st-card">
        <div className="st-card-head">
          <div>
            <b>{system.meta.name}</b>
            <small>
              {savedId ? "Saved on disk" : "Not saved yet"}
              {dirty ? " · unsaved changes" : ""} · id <code>{system.meta.id}</code>
            </small>
          </div>
        </div>
        <input className="st-in" placeholder="What changed? (optional note for this version)" aria-label="Snapshot note" value={note} onChange={(e) => setNote(e.target.value)} />
        <div className="st-row-ctl st-wrap">
          <button type="button" className="st-btn st-btn-primary" onClick={doSave}>
            Save
          </button>
          <button type="button" className="st-btn st-btn-ghost" onClick={doSaveAs}>
            Save as…
          </button>
          <button type="button" className="st-btn st-btn-ghost" onClick={() => file.current?.click()}>
            Import JSON
          </button>
          <input ref={file} type="file" accept="application/json,.json" hidden onChange={(e) => e.target.files?.[0] && onImport(e.target.files[0])} />
        </div>
        <p className="st-note">Saving writes design-systems/{system.meta.id}/ and keeps a version you can return to.</p>
      </section>

      <section className="st-sec st-sec-list">
        <div className="st-sec-head">
          <h3>Saved systems</h3>
          <button type="button" className="st-link" onClick={refresh}>
            Refresh
          </button>
        </div>
        {list.length === 0 ? <p className="st-empty">Nothing saved yet.</p> : null}
        {list.map((s) => (
          <div key={s.id} className="st-saved" data-active={s.id === system.meta.id ? "" : undefined}>
            <div className="st-item-main">
              <b>{s.name}</b>
              <small>
                {s.versions} versions · {s.rules} rules · {new Date(s.updatedAt).toLocaleString()}
              </small>
            </div>
            <div className="st-row-ctl">
              <button type="button" className="st-mini" onClick={() => open(s.id)}>
                Open
              </button>
              <button type="button" className="st-mini" onClick={() => duplicate(s.id)}>
                Duplicate
              </button>
              <button type="button" className="st-mini" onClick={() => remove(s.id)} aria-label={`Delete ${s.name}`}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </section>

      <section className="st-sec st-sec-list">
        <div className="st-sec-head">
          <h3>Versions of this system</h3>
        </div>
        {versions.length === 0 ? <p className="st-empty">Versions appear here after you save.</p> : null}
        {versions.slice(0, 12).map((v) => (
          <div key={v.version} className="st-saved">
            <div className="st-item-main">
              <b>{v.note || "Snapshot"}</b>
              <small>{v.version.slice(0, 19).replace("T", " ")}</small>
            </div>
            <button type="button" className="st-mini" onClick={() => restore(v.version)}>
              Restore
            </button>
          </div>
        ))}
      </section>

      <section className="st-sec">
        <div className="st-sec-head">
          <div>
            <h3>What changed?</h3>
            <p>Compare the current draft with a version or starter.</p>
          </div>
        </div>
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
          <button type="button" className="st-btn st-btn-ghost" onClick={runDiff}>
            Compare
          </button>
        </div>
        {diff ? <DiffList entries={diff} /> : null}
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
      <div className="st-formats" role="radiogroup" aria-label="Export format">
        {EXPORT_FORMATS.map((f) => (
          <button key={f.id} type="button" role="radio" aria-checked={format === f.id} className="st-tile" data-active={format === f.id ? "" : undefined} onClick={() => setFormat(f.id)}>
            <span className="st-tile-label">{f.label}</span>
            <span className="st-tile-hint">{f.file(system.meta.id)}</span>
          </button>
        ))}
      </div>
      <div className="st-row-ctl st-wrap">
        <button type="button" className="st-btn st-btn-primary" onClick={() => download(meta.file(system.meta.id), text)}>
          Download
        </button>
        <button type="button" className="st-btn st-btn-ghost" onClick={() => navigator.clipboard?.writeText(text)}>
          Copy to clipboard
        </button>
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
