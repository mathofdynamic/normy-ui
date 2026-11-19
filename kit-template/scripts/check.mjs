#!/usr/bin/env node
/* Normy check: static scan of app code against the design system.
 * No dependencies. Usage:
 *   node normy/scripts/check.mjs [paths…] [--json] [--strict]
 * --strict turns warnings into failures. Exit code 1 on errors.
 * Silence one line with a trailing comment containing `normy-ignore` (say why). */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, extname, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const kitDir = resolve(here, "..");
const root = resolve(kitDir, "..");
const config = JSON.parse(readFileSync(join(kitDir, "normy.config.json"), "utf8"));
const args = process.argv.slice(2);
const asJson = args.includes("--json");
const strict = args.includes("--strict");
const targets = args.filter((a) => !a.startsWith("--"));

const EXT = new Set([".tsx", ".jsx", ".ts", ".js", ".mjs", ".css", ".scss", ".sass", ".less", ".html", ".vue", ".svelte", ".astro"]);
const STYLE_EXT = new Set([".css", ".scss", ".sass", ".less"]);
const MARKUP_EXT = new Set([".tsx", ".jsx", ".vue", ".svelte", ".astro", ".html"]);
const exclude = new Set(config.exclude ?? []);

function walk(dir, out) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    if (exclude.has(e.name) || e.name.startsWith(".")) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (EXT.has(extname(e.name))) out.push(p);
  }
}

const files = [];
const starts = targets.length ? targets.map((t) => resolve(t)) : (config.include ?? ["src"]).map((d) => join(root, d)).filter((p) => existsSync(p));
for (const p of starts) {
  if (!existsSync(p)) continue;
  if (statSync(p).isDirectory()) walk(p, files);
  else files.push(p);
}
// Root-level files like app.tsx / main.tsx in small projects.
if (!targets.length) for (const f of readdirSync(root)) if (/\.(tsx|jsx|vue|svelte|html)$/.test(f)) files.push(join(root, f));

const level = (id) => config.rules?.[id] ?? "off";
const findings = [];
const add = (rule, file, line, col, text, message, fix) => {
  const sev = level(rule);
  if (sev === "off") return;
  findings.push({ rule, severity: sev, file: relative(root, file).replace(/\\/g, "/"), line, col, text: text.trim().slice(0, 160), message, fix });
};

/* ---------------- patterns ---------------- */

const COLOR_FN = /\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb|color)\(\s*[\d.]/;
const HEX = /(^|[^\w&-])#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/;
const NAMED = /\b(?:color|background(?:-color)?|border(?:-[a-z]+)?-color|fill|stroke|outline-color)\s*:\s*(?:red|blue|green|black|white|gray|grey|orange|purple|yellow|pink|navy|teal|silver)\b/i;
const TW_PALETTE = /(?:^|[\s"'`:])(?:[a-z]+:)*(?:bg|text|border|ring|fill|stroke|from|via|to|shadow|outline|decoration|accent|caret|divide|placeholder)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}(?:\/\d+)?\b/;
const TW_ARBITRARY_COLOR = /(?:bg|text|border|ring|fill|stroke|from|via|to|shadow|outline)-\[(?:#|rgb|hsl|oklch)/;
const TW_ARBITRARY_SIZE = /(?:^|[\s"'`:])(?:[a-z]+:)*(?:p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|gap|text|w|h|rounded|leading|tracking|top|left|right|bottom|inset)-\[\d+(?:\.\d+)?(?:px|rem|em)\]/;
const FONT_DECL = /font-family\s*:\s*([^;}{]+)/i;
const FONT_PROP = /fontFamily\s*:\s*["'`]([^"'`]+)["'`]/;
const TRANSITION_ALL = /transition(?:-property)?\s*:\s*all\b|transitionProperty\s*:\s*["']all["']|transition\s*:\s*["']all\b|(?:^|[\s"'`])transition-all(?:[\s"'`]|$)/;
const LAYOUT_ANIM = /transition(?:-property)?\s*:[^;]*\b(?:top|left|right|bottom|margin(?:-\w+)?|padding(?:-\w+)?|width|height)\b(?!-)/;
const TRUNCATE = /line-clamp|text-overflow\s*:\s*ellipsis|textOverflow\s*:\s*["']ellipsis|WebkitLineClamp|(?:^|[\s"'`])(?:truncate|line-clamp-\d)(?:[\s"'`]|$)/;
const IMPORTANT = /!important/;
const ACCENT_BAR = /border-(?:left|right|top|inline-start|inline-end)\s*:\s*(?:[3-9]|\d{2,})px\s+solid|borderLeft\s*:\s*["'](?:[3-9]|\d{2,})px\s+solid/;
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
const RAW_SIZE_CSS = /\b(?:margin|padding|gap|row-gap|column-gap|font-size|border-radius|inset|top|left|right|bottom|width|height|max-width|min-height|letter-spacing|line-height)(?:-[a-z]+)?\s*:\s*[^;{}]*\b(?:[2-9]|\d{2,})(?:\.\d+)?px\b/;
const RAW_SIZE_JS = /\b(?:margin|padding|gap|fontSize|borderRadius|top|left|right|bottom|width|height|maxWidth|minHeight|letterSpacing|lineHeight|padding[A-Z]\w*|margin[A-Z]\w*)\s*:\s*(?:["'`][^"'`]*\b(?:[2-9]|\d{2,})(?:\.\d+)?(?:px|rem)\b|\d{2,}\b)/;
const STYLE_ATTR = /\bstyle=\{\{/;
const STYLE_COLORISH = /\b(?:color|background|backgroundColor|borderColor|boxShadow|fontFamily|fill|stroke)\s*:\s*["'`](?!var\()/;

const tags = config.tags ?? {};
const tagRe = Object.keys(tags).length ? new RegExp(`<(${Object.keys(tags).join("|")})(?=[\\s/>])`, "g") : null;

for (const file of files) {
  let src;
  try {
    src = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  const ext = extname(file);
  const isStyle = STYLE_EXT.has(ext);
  const isMarkup = MARKUP_EXT.has(ext);
  const lines = src.split(/\r?\n/);
  let inBlockComment = false;
  lines.forEach((raw, i) => {
    const n = i + 1;
    if (/normy-ignore/.test(raw)) return;
    let line = raw;
    // strip comments (good enough for a lint)
    if (inBlockComment) {
      const end = line.indexOf("*/");
      if (end === -1) return;
      line = line.slice(end + 2);
      inBlockComment = false;
    }
    line = line.replace(/\/\*.*?\*\//g, "");
    const bc = line.indexOf("/*");
    if (bc !== -1) {
      inBlockComment = true;
      line = line.slice(0, bc);
    }
    if (!isStyle) line = line.replace(/(^|[^:"'`])\/\/.*$/, "$1");
    if (!line.trim()) return;
    if (/^\s*import\s/.test(line) || /^\s*export\s+\*/.test(line)) return;

    const styleContext = isStyle || STYLE_ATTR.test(line) || /className|class=|css`|styled\.|style\s*[:=]|sx=|tw`/.test(line) || /^\s*[a-zA-Z-]+\s*:\s*[^;]+;?\s*$/.test(line);

    // colours
    if (isStyle || styleContext || /["'`]#[0-9a-fA-F]{3,8}["'`]/.test(line)) {
      const m = line.match(HEX);
      if (m && !/url\(#|href=["']#|#[0-9a-fA-F]{3,8}["']?\s*\)?\s*;?\s*\/\/\s*id/.test(line)) add("raw-color", file, n, (m.index ?? 0) + 1, raw, "Raw colour value (hex, rgb, hsl, oklch or a colour name).", "Use a colour token, e.g. var(--n-color-text) or var(--n-color-accent).");
      else if (COLOR_FN.test(line) && !/var\(--n-/.test(line.match(COLOR_FN)?.input ?? "")) add("raw-color", file, n, 1, raw, "Raw colour value (hex, rgb, hsl, oklch or a colour name).", "Use a colour token: var(--n-color-…).");
      else if (NAMED.test(line)) add("raw-color", file, n, 1, raw, "Raw colour value (hex, rgb, hsl, oklch or a colour name).", "Use a colour token: var(--n-color-…).");
    }
    if (TW_PALETTE.test(line) || TW_ARBITRARY_COLOR.test(line)) add("palette-class", file, n, 1, raw, "Tailwind palette / arbitrary colour class.", "Use kit components, or classes mapped to Normy tokens (see normy/references/tokens.md).");

    // fonts
    const fd = line.match(FONT_DECL) ?? line.match(FONT_PROP);
    if (fd && !/var\(--n-font|inherit|initial|unset/.test(fd[1])) add("foreign-font", file, n, 1, raw, "Font family that is not a system token.", "Use var(--n-font-body), var(--n-font-display) or var(--n-font-mono), or the Text / Heading components.");

    // motion
    if (TRANSITION_ALL.test(line)) add("transition-all", file, n, 1, raw, "`transition: all` animates layout and paint properties by accident.", "Name the properties: transition: opacity var(--n-duration-fast) var(--n-easing-standard), transform …");
    if (LAYOUT_ANIM.test(line)) add("layout-animation", file, n, 1, raw, "Transition on a layout property (top/left/margin/padding/width/height).", "Animate transform and opacity instead.");

    // text
    if (TRUNCATE.test(line)) add("truncate", file, n, 1, raw, "Text is cut off (ellipsis / line-clamp).", "Let the text wrap; give it more lines and let the row grow. Only single-line data cells (ids, file names) may truncate — mark them with normy-ignore and a reason.");

    // sizes
    if ((isStyle && RAW_SIZE_CSS.test(line) && !/var\(--n-/.test(line)) || (!isStyle && styleContext && RAW_SIZE_JS.test(line)) || TW_ARBITRARY_SIZE.test(line))
      add("raw-size", file, n, 1, raw, "Raw pixel size for space, type or radius.", "Use space tokens (var(--n-space-4)), type tokens (var(--n-text-lg)), radius tokens, or layout component props.");

    // inline styles with literal visual values
    if (isMarkup && STYLE_ATTR.test(line) && STYLE_COLORISH.test(line)) add("inline-style", file, n, 1, raw, "Inline style with a literal visual value.", "Use a component variant or a token: style={{ color: 'var(--n-color-text-muted)' }} at most.");
    if (IMPORTANT.test(line) && (isStyle || styleContext)) add("important", file, n, 1, raw, "!important fights the system's cascade.", "Use the right component variant, or change the system in Normy Studio.");
    if (ACCENT_BAR.test(line)) add("accent-bar", file, n, 1, raw, "Decorative accent bar on an edge.", "Show state with surface, border and text colour instead.");

    // hand-rolled components
    if (isMarkup && tagRe) {
      tagRe.lastIndex = 0;
      let m;
      while ((m = tagRe.exec(line))) {
        if (m[1] === "input" && /type=["'](?:hidden|file)["']/.test(line)) continue;
        add("kit-component", file, n, m.index + 1, raw, `Raw <${m[1]}> instead of the kit component.`, `Use <${tags[m[1]]}> from the kit.`);
      }
    }
    if (isMarkup && EMOJI.test(line.replace(/["'`][^"'`]*["'`]/g, (s) => (/aria-label|alt=|title=/.test(line) ? "" : s)))) {
      if (/>[^<]*[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(line)) add("emoji-icon", file, n, 1, raw, "Emoji used in the UI.", "Use the kit's <Icon name=…> set.");
    }
  });
}

/* ---------------- report ---------------- */

const errors = findings.filter((f) => f.severity === "error");
const warns = findings.filter((f) => f.severity === "warn");
const failed = errors.length > 0 || (strict && warns.length > 0);

if (asJson) {
  console.log(JSON.stringify({ files: files.length, errors: errors.length, warnings: warns.length, findings }, null, 2));
} else {
  const byRule = new Map();
  for (const f of findings) {
    if (!byRule.has(f.rule)) byRule.set(f.rule, []);
    byRule.get(f.rule).push(f);
  }
  for (const [rule, list] of byRule) {
    const sev = list[0].severity.toUpperCase();
    console.log(`\n${sev}  ${rule}  (${list.length})  ${list[0].message}`);
    console.log(`      fix: ${list[0].fix}`);
    for (const f of list.slice(0, 40)) console.log(`      ${f.file}:${f.line}  ${f.text}`);
    if (list.length > 40) console.log(`      … ${list.length - 40} more`);
  }
  console.log(`\nnormy check: ${files.length} files, ${errors.length} errors, ${warns.length} warnings — ${failed ? "FAIL" : "PASS"}`);
  if (!files.length) console.log("No files scanned. Pass paths, or set \"include\" in normy/normy.config.json.");
}
process.exitCode = failed ? 1 : 0;
