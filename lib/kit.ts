import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { compile } from "@/engine/compile";
import { COMPONENTS } from "@/engine/components";
import { agentsBlock, checkConfig, componentsMd, kitInfo, kitReadme, KIT_DIR, motionMd, reviewLogMd, setupMd, skillMd, skillStub, tokensMd, type KitCatalog } from "@/engine/kit/docs";
import { getDef } from "@/engine/registry";
import type { DesignSystem } from "@/engine/types";

/* ------------------------------------------------------------------ *
 * Builds the Agent Kit for one design system: the docs from
 * engine/kit/docs.ts plus the real component sources, the compiled
 * CSS, the motion runtime and the check/audit scripts.
 * Paths are relative to the target project root.
 * ------------------------------------------------------------------ */

const ROOT = process.cwd();
const COMPONENT_DIR = path.join(ROOT, "components", "normy");
const TEMPLATE_DIR = path.join(ROOT, "kit-template");

/** next/font variable → Google Fonts family (css2 query) and CSS family name. */
const GOOGLE_FONTS: Record<string, [string, string]> = {
  geist: ["Geist:wght@100..900", "Geist"],
  "geist-mono": ["Geist+Mono:wght@100..900", "Geist Mono"],
  archivo: ["Archivo:wdth,wght@62..125,100..900", "Archivo"],
  "plex-sans": ["IBM+Plex+Sans:wght@100..700", "IBM Plex Sans"],
  "plex-mono": ["IBM+Plex+Mono:wght@400;500", "IBM Plex Mono"],
  "space-grotesk": ["Space+Grotesk:wght@300..700", "Space Grotesk"],
  "space-mono": ["Space+Mono:wght@400;700", "Space Mono"],
  manrope: ["Manrope:wght@200..800", "Manrope"],
  fraunces: ["Fraunces:wght@100..900", "Fraunces"],
  newsreader: ["Newsreader:wght@200..800", "Newsreader"],
  cormorant: ["Cormorant+Garamond:wght@400;500;600;700", "Cormorant Garamond"],
  jost: ["Jost:wght@100..900", "Jost"],
  fredoka: ["Fredoka:wght@300..700", "Fredoka"],
  nunito: ["Nunito:wght@200..1000", "Nunito"],
  roboto: ["Roboto:wght@100..900", "Roboto"],
  jetbrains: ["JetBrains+Mono:wght@100..800", "JetBrains Mono"],
  "dm-sans": ["DM+Sans:wght@100..1000", "DM Sans"],
};

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Rewrites app-internal imports so the components work from <project>/normy/components. */
function rewrite(src: string) {
  return src.replace(/from\s+["']@\/engine\/react["']/g, 'from "../react"').replace(/from\s+["']next\/link["']/g, 'from "../link"');
}

function propsOf(src: string, name: string): string[] {
  const m = src.match(new RegExp(`export (?:interface|type) ${name}Props\\b[^{]*\\{([\\s\\S]*?)\\n\\}`));
  if (!m) return [];
  const out: string[] = [];
  let doc = "";
  for (const raw of m[1].split("\n")) {
    const line = raw.trim();
    const d = line.match(/^\/\*\*\s*(.*?)\s*\*\/$/);
    if (d) {
      doc = d[1];
      continue;
    }
    if (!line || line.startsWith("//") || line.startsWith("/*") || line.startsWith("*")) continue;
    const p = line.match(/^(\w+\??)\s*:\s*(.+?);?$/);
    if (p) {
      out.push(`${p[1]}: ${p[2].replace(/;$/, "")}${doc ? ` — ${doc}` : ""}`);
      doc = "";
    }
  }
  return out;
}

export async function readComponents() {
  const files = (await readdir(COMPONENT_DIR)).filter((f) => /\.(tsx?|css)$/.test(f));
  const sources: Record<string, string> = {};
  for (const f of files) sources[f] = await readFile(path.join(COMPONENT_DIR, f), "utf8");
  const exportsByNorm = new Map<string, { name: string; file: string }>();
  for (const [file, src] of Object.entries(sources)) for (const m of src.matchAll(/export (?:const|function) ([A-Z]\w*)/g)) exportsByNorm.set(norm(m[1]), { name: m[1], file });
  const catalog: KitCatalog = {};
  const all = Array.from(exportsByNorm.values());
  for (const def of COMPONENTS) {
    const hit = exportsByNorm.get(norm(def.type)) ?? exportsByNorm.get(norm(def.label));
    if (!hit) continue;
    // Companion pieces that compose with it (CardHeader, DialogContent, THead…).
    const extra = hit.name === "Table" ? ["THead", "TBody", "Tr", "Th", "Td"] : [];
    const companions = all
      .filter((e) => e.file === hit.file && e.name !== hit.name && (e.name.startsWith(hit.name) || extra.includes(e.name)))
      .map((e) => ({ name: e.name, props: propsOf(sources[e.file], e.name) }));
    catalog[def.type] = { exportName: hit.name, file: hit.file, props: propsOf(sources[hit.file], hit.name), companions };
  }
  return { sources, catalog };
}

function fontsCss(css: string) {
  const used = Array.from(new Set(Array.from(css.matchAll(/var\(--font-([a-z0-9-]+)\)/g)).map((m) => m[1]))).filter((k) => GOOGLE_FONTS[k]);
  if (!used.length) return "/* The system uses system fonts only. */\n";
  const q = used.map((k) => `family=${GOOGLE_FONTS[k][0]}`).join("&");
  return `/* Font families used by the system. Self-host them later if you prefer (keep the variable names). */
@import url("https://fonts.googleapis.com/css2?${q}&display=swap");

:root {
${used.map((k) => `  --font-${k}: "${GOOGLE_FONTS[k][1]}";`).join("\n")}
}
`;
}

/** next/font version of fonts.css for Next.js apps: self-hosted, preloaded, no layout shift on swap. */
const NEXT_FONTS: Record<string, [string, string]> = {
  geist: ["Geist", ""],
  "geist-mono": ["Geist_Mono", ""],
  archivo: ["Archivo", ', axes: ["wdth"]'],
  "plex-sans": ["IBM_Plex_Sans", ""],
  "plex-mono": ["IBM_Plex_Mono", ', weight: ["400", "500"]'],
  "space-grotesk": ["Space_Grotesk", ""],
  "space-mono": ["Space_Mono", ', weight: ["400", "700"]'],
  manrope: ["Manrope", ""],
  fraunces: ["Fraunces", ""],
  newsreader: ["Newsreader", ""],
  cormorant: ["Cormorant_Garamond", ', weight: ["400", "500", "600", "700"]'],
  jost: ["Jost", ""],
  fredoka: ["Fredoka", ""],
  nunito: ["Nunito", ""],
  roboto: ["Roboto", ""],
  jetbrains: ["JetBrains_Mono", ""],
  "dm-sans": ["DM_Sans", ""],
};

function fontsTs(css: string) {
  const used = Array.from(new Set(Array.from(css.matchAll(/var\(--font-([a-z0-9-]+)\)/g)).map((m) => m[1]))).filter((k) => NEXT_FONTS[k]);
  const id = (k: string) => k.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
  return `/* Next.js only: the system's fonts through next/font (self-hosted, no layout shift).
 * Use it INSTEAD of styles/fonts.css:  <html className={normyFonts}>  */
${used.length ? `import { ${used.map((k) => NEXT_FONTS[k][0]).join(", ")} } from "next/font/google";

${used.map((k) => `const ${id(k)} = ${NEXT_FONTS[k][0]}({ variable: "--font-${k}", subsets: ["latin"], display: "swap"${NEXT_FONTS[k][1]} });`).join("\n")}

export const normyFonts = [${used.map(id).join(", ")}].map((f) => f.variable).join(" ");` : `export const normyFonts = "";`}
`;
}

function motionPolicy(system: DesignSystem) {
  const enabled = system.tokens["motion.enabled"] ?? getDef("motion.enabled")?.default;
  const reduce = (system.tokens["motion.reduce"] ?? getDef("motion.reduce")?.default) as string;
  return enabled === false ? "off" : reduce === "always" ? "reduce" : reduce === "never" ? "full" : "system";
}

export async function buildKit(system: DesignSystem): Promise<Record<string, string>> {
  const { sources, catalog } = await readComponents();
  const info = kitInfo(system);
  const compiled = compile(system, COMPONENTS);
  const files: Record<string, string> = {};
  const k = (p: string) => `${KIT_DIR}/${p}`;

  // docs
  files[k("SKILL.md")] = skillMd(system, catalog);
  files[k("review-log.md")] = reviewLogMd(system);
  files[k("README.md")] = kitReadme(system);
  files[k("references/components.md")] = componentsMd(system, catalog);
  files[k("references/tokens.md")] = tokensMd(system);
  files[k("references/setup.md")] = setupMd(system);
  files[k("references/motion.md")] = motionMd(system);
  files[k("AGENTS.snippet.md")] = agentsBlock(system) + "\n";
  files[k("normy.config.json")] = JSON.stringify(checkConfig(system, catalog), null, 2) + "\n";
  files[k("system.json")] = JSON.stringify(system, null, 2) + "\n";
  files[`${KIT_DIR}/skills/${info.skillName}/SKILL.md`] = skillStub(system);

  // styles
  files[k("styles/normy.css")] = `/* ${system.meta.name} — generated by Normy. Do not edit: change the system in Normy Studio. Dark mode: .dark on <html>. */\n${compiled.css}`;
  files[k("styles/fonts.css")] = fontsCss(compiled.css);
  files[k("fonts.ts")] = fontsTs(compiled.css);

  // code
  for (const [f, src] of Object.entries(sources)) files[k(`components/${f}`)] = rewrite(src);
  files[k("react.ts")] = await readFile(path.join(ROOT, "engine", "react.ts"), "utf8");
  files[k("runtime/motion.ts")] = await readFile(path.join(ROOT, "engine", "runtime", "motion.ts"), "utf8");
  files[k("runtime/manifest.ts")] = `/* Generated by Normy: what the motion runtime watches, and the motion policy. */
export const MANIFEST = ${JSON.stringify(compiled.manifest, null, 2)};
export const MOTION_POLICY: "system" | "off" | "reduce" | "full" = ${JSON.stringify(motionPolicy(system))};
`;
  files[k("index.ts")] = `/* ${system.meta.name} — every kit component. import { Button } from "@/${KIT_DIR}"; */\nexport * from "./components";\nexport { NormyProvider } from "./provider";\nexport { NORMY_BOOT, setMode, getMode } from "./boot";\n`;
  for (const f of ["provider.tsx", "boot.ts", "link.tsx", "runtime/apply.ts", "styles/base.css", "scripts/check.mjs", "scripts/audit.mjs"]) files[k(f)] = await readFile(path.join(TEMPLATE_DIR, f), "utf8");
  return files;
}
