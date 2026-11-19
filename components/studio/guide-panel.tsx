"use client";

import { useRef, useState } from "react";
import { Icon } from "@/components/normy/icon";
import { guideOf, mergeLessons, parseLessons, RULE_PACKS, withGuide } from "@/engine/guide";
import type { Guide, GuideRule } from "@/engine/types";
import { useStudio } from "./store";

/* ------------------------------------------------------------------ *
 * Guide panel: how AI agents must design with this system. Everything
 * here is written into the Agent Kit (SKILL.md, AGENTS.md, the checker).
 * ------------------------------------------------------------------ */

function useGuide() {
  const system = useStudio((s) => s.system);
  const commit = useStudio((s) => s.commit);
  const guide = guideOf(system);
  const update = (patch: Partial<Guide>, label: string, merge = false) => commit(withGuide(useStudio.getState().system, patch), `guide · ${label}`, merge);
  return { guide, update };
}

function About() {
  const { guide, update } = useGuide();
  return (
    <div className="st-stack-lg">
      <label className="st-field-block">
        <span className="st-label">What is the product?</span>
        <textarea className="st-area" rows={2} placeholder="e.g. A booking app for independent hair salons. Owners use it on desktop, clients on their phone." value={guide.product} onChange={(e) => update({ product: e.target.value }, "product", true)} />
      </label>
      <label className="st-field-block">
        <span className="st-label">How should it feel?</span>
        <textarea className="st-area" rows={3} placeholder="e.g. Calm and premium, like a quiet studio. Lots of white space, one confident blue, nothing flashy. Motion is gentle and never in the way." value={guide.feel} onChange={(e) => update({ feel: e.target.value }, "feel", true)} />
      </label>
      <label className="st-field-block">
        <span className="st-label">Language and direction</span>
        <input className="st-in" placeholder="e.g. English, left to right · or · Persian, right to left" value={guide.language} onChange={(e) => update({ language: e.target.value }, "language", true)} />
      </label>
    </div>
  );
}

function Packs() {
  const { guide, update } = useGuide();
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="st-packs">
      {RULE_PACKS.map((p) => {
        const on = p.core || guide.packs.includes(p.id);
        const expanded = open === p.id;
        return (
          <div key={p.id} className="st-pack" data-on={on ? "" : undefined}>
            <div className="st-pack-head">
              <div className="st-pack-text">
                <b>{p.title}</b>
                <span>{p.summary}</span>
              </div>
              {p.core ? (
                <span className="st-pack-core" title="Every kit includes this pack">
                  Always on
                </span>
              ) : (
                <button
                  type="button"
                  role="switch"
                  aria-checked={on}
                  aria-label={`${p.title} rules`}
                  className="st-switch"
                  onClick={() => update({ packs: on ? guide.packs.filter((x) => x !== p.id) : [...guide.packs, p.id] }, `${on ? "off" : "on"}: ${p.title}`)}
                >
                  <span />
                </button>
              )}
            </div>
            <button type="button" className="st-link st-pack-more" aria-expanded={expanded} onClick={() => setOpen(expanded ? null : p.id)}>
              {expanded ? "Hide the rules" : `See the ${p.rules.length} rules`}
            </button>
            {expanded ? (
              <ul className="st-pack-rules">
                {p.rules.map((r, i) => (
                  <li key={i}>{r.replace(/\*\*/g, "").replace(/`/g, "")}</li>
                ))}
              </ul>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function OwnRules() {
  const { guide, update } = useGuide();
  const [kind, setKind] = useState<GuideRule["kind"]>("do");
  const [text, setText] = useState("");
  const add = () => {
    const t = text.trim();
    if (!t) return;
    update({ rules: [...guide.rules, { id: `r${Date.now().toString(36)}`, kind, text: t }] }, "add rule");
    setText("");
  };
  return (
    <div className="st-stack-lg">
      <div className="st-seg st-seg-sm" role="radiogroup" aria-label="Rule type">
        {(["do", "dont"] as const).map((k) => (
          <button key={k} type="button" role="radio" aria-checked={kind === k} data-active={kind === k ? "" : undefined} onClick={() => setKind(k)}>
            {k === "do" ? "Always do" : "Never do"}
          </button>
        ))}
      </div>
      <div className="st-row-ctl">
        <input
          className="st-in"
          placeholder={kind === "do" ? "e.g. Put the primary action on the right of every form" : "e.g. Use more than one accent colour on a screen"}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          aria-label="New rule"
        />
        <button type="button" className="st-btn st-btn-primary" onClick={add} disabled={!text.trim()}>
          Add
        </button>
      </div>
      {guide.rules.length ? (
        <ul className="st-rules">
          {guide.rules.map((r) => (
            <li key={r.id}>
              <span className="st-rule-kind" data-kind={r.kind}>
                {r.kind === "do" ? "Do" : "Never"}
              </span>
              <span className="st-rule-text">{r.text}</span>
              <button type="button" className="st-icon" aria-label={`Remove rule: ${r.text}`} onClick={() => update({ rules: guide.rules.filter((x) => x.id !== r.id) }, "remove rule")}>
                <Icon name="x" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="st-note">Rules only you know: where things go, words you never use, what your brand would never do.</p>
      )}
    </div>
  );
}

function Lessons() {
  const { guide, update } = useGuide();
  const file = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState("");
  const count = parseLessons(guide.lessons).length;
  const onFile = async (f: File | undefined) => {
    if (!f) return;
    const text = await f.text();
    const body = text.includes("\n---\n") ? text.slice(text.indexOf("\n---\n") + 5) : text;
    const merged = mergeLessons(guide.lessons, body);
    update({ lessons: merged.text }, "import lessons");
    setMsg(merged.added ? `Added ${merged.added} new lesson${merged.added === 1 ? "" : "s"}.` : "No new lessons in that file.");
  };
  return (
    <div className="st-stack-lg">
      <p className="st-note">
        When you correct an agent, it writes the lesson into <code>normy/review-log.md</code> in your project. Import that file here and every future kit, in every project,
        carries the lesson.
      </p>
      <div className="st-row-ctl st-wrap">
        <button type="button" className="st-btn st-btn-ghost" onClick={() => file.current?.click()}>
          <Icon name="upload" /> Import review log
        </button>
        <span className="st-count-pill">{count} lesson{count === 1 ? "" : "s"}</span>
        <input ref={file} type="file" accept=".md,.txt,text/markdown" hidden onChange={(e) => void onFile(e.target.files?.[0])} />
      </div>
      {msg ? <p className="st-note">{msg}</p> : null}
      <textarea
        className="st-area st-mono"
        rows={8}
        aria-label="Lessons (markdown)"
        placeholder={"## Active nav item had two underlines (home, 2026-11-20)\n- Shipped: an underline plus a border.\n- Why it was rejected: looked broken.\n- Rule: the active item is a pill, never an underline.\n- Check: one indicator in the header on every page."}
        value={guide.lessons}
        onChange={(e) => update({ lessons: e.target.value }, "lessons", true)}
      />
    </div>
  );
}

export function GuidePanel() {
  const set = useStudio((s) => s.set);
  return (
    <div className="st-panel-body">
      <div className="st-panel-intro">
        <h2>Guide</h2>
        <p>Tell your AI agents how to design with this system. All of it goes into the Agent Kit, so every page they build follows the same rules.</p>
      </div>
      <section className="st-sec">
        <header className="st-sec-head">
          <div>
            <h3>About the product</h3>
            <p>Agents design better when they know what it is and how it should feel.</p>
          </div>
        </header>
        <About />
      </section>
      <section className="st-sec">
        <header className="st-sec-head">
          <div>
            <h3>Rule packs</h3>
            <p>Proven design rules, each one learned from a real mistake. Switch off what does not fit.</p>
          </div>
        </header>
        <Packs />
      </section>
      <section className="st-sec">
        <header className="st-sec-head">
          <div>
            <h3>Your rules</h3>
            <p>These outrank everything else in the kit.</p>
          </div>
        </header>
        <OwnRules />
      </section>
      <section className="st-sec">
        <header className="st-sec-head">
          <div>
            <h3>Lessons</h3>
            <p>Your review log. It grows every time you correct an agent.</p>
          </div>
        </header>
        <Lessons />
      </section>
      <section className="st-sec">
        <button type="button" className="st-btn st-btn-primary st-wide-btn" onClick={() => set({ panel: "export" })}>
          Export the Agent Kit <Icon name="arrow-right" />
        </button>
      </section>
    </div>
  );
}
