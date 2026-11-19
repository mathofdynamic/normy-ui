"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Icon } from "@/components/normy/icon";
import { GROUPS, TOKENS } from "@/engine/registry";
import { cloneSystem } from "@/engine/system";
import { STARTERS } from "@/engine/systems";
import type { GroupId } from "@/engine/types";
import { matchSearch, TokenRow } from "./inspector";
import { useStudio } from "./store";
import { SystemThumb, tokenOf } from "./system-thumb";
import {
  activeChoice,
  applyPatch,
  BORDER_CHOICES,
  BRAND_CHOICES,
  BRAND_PRESETS,
  brandPatch,
  brandSwatch,
  CORNER_CHOICES,
  DENSITY_CHOICES,
  DEPTH_CHOICES,
  HEADING_CHOICES,
  hexToOklch,
  MOTION_CHOICES,
  NEUTRAL_CHOICES,
  TEXT_SIZE_CHOICES,
  TYPE_CHOICES,
  type Choice,
} from "./theme-model";

/* ------------------------------------------------------------------ *
 * Style panel — the 90% path. Big visual choices that each expand into
 * ordinary tokens. "Fine-tune" reveals the exact tokens of that group.
 * ------------------------------------------------------------------ */

function useApply() {
  const commit = useStudio((s) => s.commit);
  return (c: Choice, label: string) => commit(applyPatch(useStudio.getState().system, c.patch), `style · ${label}: ${c.label}`);
}

function Section({ title, hint, group, children }: { title: string; hint?: string; group?: GroupId | GroupId[]; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const system = useStudio((s) => s.system);
  const key = group ? (Array.isArray(group) ? group.join(",") : group) : "";
  const groups = key ? key.split(",") : [];
  const defs = useMemo(() => (key ? TOKENS.filter((t) => key.split(",").includes(t.group)) : []), [key]);
  return (
    <section className="st-sec">
      <header className="st-sec-head">
        <div>
          <h3>{title}</h3>
          {hint ? <p>{hint}</p> : null}
        </div>
        {groups.length ? (
          <button type="button" className="st-link" aria-expanded={open} onClick={() => setOpen(!open)}>
            {open ? "Done" : "Fine-tune"}
          </button>
        ) : null}
      </header>
      {children}
      {open ? (
        <div className="st-fine">
          {defs.map((d) => (
            <TokenRow key={d.id} def={d} system={system} />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function Tiles<T extends Choice>({ choices, label, render, cols = 3 }: { choices: T[]; label: string; render?: (c: T) => ReactNode; cols?: number }) {
  const system = useStudio((s) => s.system);
  const apply = useApply();
  const active = activeChoice(system, choices);
  return (
    <div className="st-tiles" role="radiogroup" aria-label={label} style={{ ["--cols" as string]: cols }}>
      {choices.map((c) => (
        <button key={c.id} type="button" role="radio" aria-checked={active === c.id} className="st-tile" data-active={active === c.id ? "" : undefined} onClick={() => apply(c, label)}>
          {render ? render(c) : null}
          <span className="st-tile-label">{c.label}</span>
          {c.hint ? <span className="st-tile-hint">{c.hint}</span> : null}
        </button>
      ))}
      {active === "custom" ? <span className="st-custom-note">Custom values in use</span> : null}
    </div>
  );
}

function Segmented({ choices, label }: { choices: Choice[]; label: string }) {
  const system = useStudio((s) => s.system);
  const apply = useApply();
  const active = activeChoice(system, choices);
  return (
    <div className="st-seg" role="radiogroup" aria-label={label}>
      {choices.map((c) => (
        <button key={c.id} type="button" role="radio" aria-checked={active === c.id} data-active={active === c.id ? "" : undefined} onClick={() => apply(c, label)}>
          {c.label}
        </button>
      ))}
    </div>
  );
}

function BrandColor() {
  const system = useStudio((s) => s.system);
  const commit = useStudio((s) => s.commit);
  const apply = useApply();
  const active = activeChoice(system, BRAND_CHOICES);
  const current = tokenOf(system, "color.accent");
  const [hex, setHex] = useState("");
  const setCustom = (h: string) => {
    setHex(h);
    const lch = hexToOklch(h);
    if (lch) commit(applyPatch(useStudio.getState().system, brandPatch(lch)), "style · brand colour", true);
  };
  return (
    <div className="st-stack-lg">
      <div className="st-swatches" role="radiogroup" aria-label="Brand colour">
        {BRAND_PRESETS.map((b) => {
          const c = BRAND_CHOICES.find((x) => x.id === b.id)!;
          return (
            <button key={b.id} type="button" role="radio" aria-checked={active === b.id} aria-label={b.label} title={b.label} className="st-swatch-btn" data-active={active === b.id ? "" : undefined} style={{ background: brandSwatch(b) }} onClick={() => apply(c, "brand")}>
              {active === b.id ? <Icon name="check" /> : null}
            </button>
          );
        })}
      </div>
      <label className="st-custom-color">
        <span className="st-swatch-btn st-swatch-custom" data-active={active === "custom" ? "" : undefined} style={{ background: current }}>
          <input type="color" aria-label="Custom brand colour" onChange={(e) => setCustom(e.target.value)} />
        </span>
        <span className="st-stack-sm">
          <b>{active === "custom" ? "Custom colour" : "Pick any colour"}</b>
          <input className="st-in st-mono" placeholder="#2563eb" aria-label="Brand colour hex" value={hex} onChange={(e) => setCustom(e.target.value)} />
        </span>
      </label>
      <p className="st-note">Every accent role (buttons, links, focus rings, selection, charts) is derived for both light and dark mode.</p>
    </div>
  );
}

function Starters() {
  const system = useStudio((s) => s.system);
  const commit = useStudio((s) => s.commit);
  const set = useStudio((s) => s.set);
  return (
    <div className="st-starters">
      {STARTERS.map((s) => {
        const on = system.meta.id === s.meta.id || system.meta.basedOn === s.meta.id;
        return (
          <button
            key={s.meta.id}
            type="button"
            className="st-starter"
            data-active={on ? "" : undefined}
            onClick={() => {
              commit(cloneSystem(s, { id: s.meta.id, name: s.meta.name }), `start from ${s.meta.name}`);
              set({ savedId: null });
            }}
            title={s.meta.description}
          >
            <SystemThumb system={s} />
            <span className="st-tile-label">{s.meta.name}</span>
          </button>
        );
      })}
    </div>
  );
}

export function StylePanel() {
  const [q, setQ] = useState("");
  const system = useStudio((s) => s.system);
  const hits = useMemo(() => (q.trim() ? TOKENS.filter((t) => matchSearch(t, q)).slice(0, 40) : []), [q]);
  return (
    <div className="st-panel-body">
      <div className="st-panel-intro">
        <h2>Style</h2>
        <p>The big decisions. Each choice updates every page at once — fine-tune any of them later.</p>
        <label className="st-search">
          <Icon name="search" />
          <input placeholder="Search all tokens…" aria-label="Search tokens" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
      </div>
      {q.trim() ? (
        <section className="st-sec">
          {hits.length ? hits.map((d) => <TokenRow key={d.id} def={d} system={system} />) : <p className="st-empty">No tokens match “{q}”.</p>}
        </section>
      ) : (
        <>
          <Section title="Start from" hint="A complete look to build on. Your edits stay undoable.">
            <Starters />
          </Section>
          <Section title="Brand colour" hint="Your primary colour." group="color">
            <BrandColor />
          </Section>
          <Section title="Neutrals" hint="The tint of backgrounds, text and borders.">
            <Tiles
              label="Neutrals"
              cols={5}
              choices={NEUTRAL_CHOICES}
              render={(c) => (
                <span className="st-neutral">
                  {c.swatch.map((s, i) => (
                    <span key={i} style={{ background: s }} />
                  ))}
                </span>
              )}
            />
          </Section>
          <Section title="Corners" group="shape">
            <Tiles label="Corners" cols={5} choices={CORNER_CHOICES} render={(c) => <span className="st-corner" style={{ borderTopLeftRadius: c.r === "999px" ? "18px" : c.r }} />} />
          </Section>
          <Section title="Spacing" hint="How much room everything gets." group="space">
            <Segmented label="Spacing" choices={DENSITY_CHOICES} />
          </Section>
          <Section title="Typography" group="typography">
            <Tiles
              label="Font pairing"
              cols={4}
              choices={TYPE_CHOICES}
              render={(c) => (
                <span className="st-type" style={{ fontFamily: c.display }}>
                  Aa
                </span>
              )}
            />
            <div className="st-field">
              <span>Text size</span>
              <Segmented label="Text size" choices={TEXT_SIZE_CHOICES} />
            </div>
            <div className="st-field">
              <span>Headings</span>
              <Segmented label="Headings" choices={HEADING_CHOICES} />
            </div>
          </Section>
          <Section title="Depth" hint="Shadows on cards, menus and dialogs." group="elevation">
            <Tiles label="Depth" cols={4} choices={DEPTH_CHOICES} render={(c) => <span className="st-depth" style={{ boxShadow: c.preview }} />} />
            <div className="st-field">
              <span>Lines</span>
              <Segmented label="Lines" choices={BORDER_CHOICES} />
            </div>
          </Section>
          <Section title="Motion" hint="How the interface moves." group="motion-tokens">
            <Tiles label="Motion" cols={3} choices={MOTION_CHOICES} render={(c) => <span className="st-motion" data-kind={c.id} />} />
          </Section>
          <Section title="Everything else" hint="Breakpoints and accessibility tokens." group={["breakpoints", "a11y"]}>
            <p className="st-note">{GROUPS.filter((g) => g.section === "foundations").length} token groups · {TOKENS.length} tokens in total.</p>
          </Section>
        </>
      )}
    </div>
  );
}
