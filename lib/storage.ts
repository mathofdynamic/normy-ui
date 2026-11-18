import { mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseSystem } from "@/engine/system";
import type { DesignSystem } from "@/engine/types";

/* Design systems on local disk: design-systems/<id>/system.json + versions/<stamp>.json */

const ROOT = path.join(process.cwd(), "design-systems");
const safe = (id: string) => {
  if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(id)) throw new Error("Invalid system id");
  return id;
};
const dir = (id: string) => path.join(ROOT, safe(id));

export interface SystemSummary {
  id: string;
  name: string;
  description?: string;
  tags?: string[];
  updatedAt: string;
  versions: number;
  rules: number;
  tokens: number;
}

export async function listSystems(): Promise<SystemSummary[]> {
  await mkdir(ROOT, { recursive: true });
  const ids = (await readdir(ROOT, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name);
  const out: SystemSummary[] = [];
  for (const id of ids) {
    try {
      const s = await getSystem(id);
      const versions = await listVersions(id);
      out.push({ id, name: s.meta.name, description: s.meta.description, tags: s.meta.tags, updatedAt: s.meta.updatedAt, versions: versions.length, rules: s.rules.length, tokens: Object.keys(s.tokens).length + Object.keys(s.dark).length });
    } catch {
      /* skip broken folders */
    }
  }
  return out.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getSystem(id: string): Promise<DesignSystem> {
  return parseSystem(JSON.parse(await readFile(path.join(dir(id), "system.json"), "utf8")));
}

export async function exists(id: string) {
  try {
    await stat(path.join(dir(id), "system.json"));
    return true;
  } catch {
    return false;
  }
}

/** Save the current system and write an immutable snapshot. */
export async function saveSystem(system: DesignSystem, note?: string): Promise<{ version: string }> {
  const s = parseSystem(system);
  const d = dir(s.meta.id);
  await mkdir(path.join(d, "versions"), { recursive: true });
  const json = JSON.stringify(s, null, 2);
  await writeFile(path.join(d, "system.json"), json, "utf8");
  const version = new Date().toISOString().replace(/[:.]/g, "-");
  await writeFile(path.join(d, "versions", `${version}.json`), JSON.stringify({ note: note ?? "", system: s }, null, 2), "utf8");
  return { version };
}

export async function listVersions(id: string): Promise<Array<{ version: string; note: string; size: number }>> {
  const vd = path.join(dir(id), "versions");
  try {
    const files = (await readdir(vd)).filter((f) => f.endsWith(".json")).sort().reverse();
    return Promise.all(
      files.map(async (f) => {
        const raw = await readFile(path.join(vd, f), "utf8");
        let note = "";
        try {
          note = JSON.parse(raw).note ?? "";
        } catch {
          /* ignore */
        }
        return { version: f.replace(/\.json$/, ""), note, size: raw.length };
      }),
    );
  } catch {
    return [];
  }
}

export async function getVersion(id: string, version: string): Promise<DesignSystem> {
  if (!/^[0-9TZ-]+$/.test(version)) throw new Error("Invalid version");
  const raw = JSON.parse(await readFile(path.join(dir(id), "versions", `${version}.json`), "utf8"));
  return parseSystem(raw.system ?? raw);
}

export async function deleteSystem(id: string) {
  await rm(dir(id), { recursive: true, force: true });
}
