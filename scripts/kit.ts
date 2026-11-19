/* Install (or update) a Normy Agent Kit into a project.
 *   pnpm kit <system-id | starter-id | path/to/system.json> <project-dir>
 * Writes <project>/normy/, merges the instruction block into AGENTS.md and CLAUDE.md,
 * and installs the skill into .claude/skills and .agents/skills.
 * An existing normy/review-log.md is kept: new lessons from the system are appended to it. */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { AGENTS_END, AGENTS_START, agentsBlock, KIT_DIR, kitInfo, REVIEW_LOG_HEADER } from "../engine/kit/docs";
import { guideOf, mergeLessons } from "../engine/guide";
import { parseSystem } from "../engine/system";
import { STARTERS } from "../engine/systems";
import type { DesignSystem } from "../engine/types";
import { buildKit } from "../lib/kit";
import { getSystem } from "../lib/storage";

const [which, target] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
if (!which || !target) {
  console.log("Usage: pnpm kit <system-id | starter-id | system.json> <project-dir>");
  process.exit(2);
}

async function resolveSystem(w: string): Promise<DesignSystem> {
  if (existsSync(w) && w.endsWith(".json")) return parseSystem(JSON.parse(readFileSync(w, "utf8")));
  try {
    return await getSystem(w);
  } catch {}
  const s = STARTERS.find((x) => x.meta.id === w);
  if (s) return s;
  throw new Error(`No saved system, starter or file called "${w}".`);
}

async function main() {
const system = await resolveSystem(which);
const project = path.resolve(target);
if (!existsSync(project)) throw new Error(`Project folder not found: ${project}`);
const kitRoot = path.join(project, KIT_DIR);
const logPath = path.join(kitRoot, "review-log.md");

// Keep the project's review log: it is the record of the owner's corrections.
const oldLog = existsSync(logPath) ? readFileSync(logPath, "utf8") : null;
if (existsSync(path.join(kitRoot, "system.json"))) rmSync(kitRoot, { recursive: true, force: true });
else if (existsSync(kitRoot)) throw new Error(`${kitRoot} exists and is not a Normy kit (no system.json). Move it away first.`);

const files = await buildKit(system);
for (const [rel, content] of Object.entries(files)) {
  const abs = path.join(project, rel);
  mkdirSync(path.dirname(abs), { recursive: true });
  writeFileSync(abs, content);
}
let added = 0;
if (oldLog) {
  const body = oldLog.includes("---\n") ? oldLog.slice(oldLog.indexOf("---\n") + 4) : oldLog;
  const merged = mergeLessons(body.replace(/_No lessons yet\._/, ""), guideOf(system).lessons);
  added = merged.added;
  writeFileSync(logPath, REVIEW_LOG_HEADER + "\n" + (merged.text.trim() ? merged.text.trim() + "\n" : "_No lessons yet._\n"));
}

// Skill folders, so agents find the skill by themselves.
const { skillName } = kitInfo(system);
const stub = files[`${KIT_DIR}/skills/${skillName}/SKILL.md`];
for (const dir of [".claude/skills", ".agents/skills"]) {
  const p = path.join(project, dir, skillName, "SKILL.md");
  mkdirSync(path.dirname(p), { recursive: true });
  writeFileSync(p, stub);
}

// AGENTS.md / CLAUDE.md: replace our block, or append it.
const block = agentsBlock(system);
for (const f of ["AGENTS.md", "CLAUDE.md"]) {
  const p = path.join(project, f);
  const cur = existsSync(p) ? readFileSync(p, "utf8") : "";
  const re = new RegExp(`${AGENTS_START}[\\s\\S]*?${AGENTS_END}`);
  const next = re.test(cur) ? cur.replace(re, block) : (cur.trim() ? cur.replace(/\s*$/, "\n\n") : "") + block + "\n";
  writeFileSync(p, next);
}

// Dependencies the kit needs.
const pkgPath = path.join(project, "package.json");
const need = ["react", "@radix-ui/react-accordion", "@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu", "@radix-ui/react-popover", "@radix-ui/react-select", "@radix-ui/react-tabs", "@radix-ui/react-tooltip"];
let missing: string[] = [];
let hasPlaywright = false;
if (existsSync(pkgPath)) {
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  missing = need.filter((d) => !deps[d]);
  hasPlaywright = !!deps.playwright;
}

console.log(`Installed the ${system.meta.name} kit into ${project}`);
console.log(`  ${Object.keys(files).length} files in ${KIT_DIR}/, skill "${skillName}" in .claude/skills and .agents/skills, block in AGENTS.md + CLAUDE.md`);
if (oldLog) console.log(`  kept the project's review log${added ? ` (+${added} lessons from the system)` : ""}`);
if (missing.length) console.log(`\nInstall the kit's dependencies:\n  pnpm add ${missing.join(" ")}`);
if (!hasPlaywright) console.log(`\nFor the rendered audit:\n  pnpm add -D playwright && npx playwright install chromium`);
console.log(`\nThen wire it in once (see ${KIT_DIR}/references/setup.md), or ask your agent: "Set up the Normy kit as described in ${KIT_DIR}/references/setup.md".`);
}

main().catch((e) => {
  console.error(String(e?.message ?? e));
  process.exit(1);
});
