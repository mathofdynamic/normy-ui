#!/usr/bin/env node
/* Normy audit: checks rendered pages against the design system and writes
 * screenshots for you (and your reviewer) to look at.
 * Needs playwright in the project:  pnpm add -D playwright && npx playwright install chromium
 * Usage:
 *   node normy/scripts/audit.mjs http://localhost:3000/ http://localhost:3000/pricing
 *   options: --widths=375,1440  --out=normy-audit  --no-dark  --strict
 * Exit code 1 when any check fails. */
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const args = process.argv.slice(2);
const opt = (k, d) => (args.find((a) => a.startsWith(`--${k}=`))?.split("=")[1] ?? d);
const urls = args.filter((a) => !a.startsWith("--"));
const widths = opt("widths", "375,1440").split(",").map(Number);
const out = resolve(opt("out", "normy-audit"));
const modes = args.includes("--no-dark") ? ["light"] : ["light", "dark"];
const strict = args.includes("--strict");

if (!urls.length) {
  console.log("Usage: node normy/scripts/audit.mjs <url> [url…]  (start the app first)");
  process.exit(2);
}

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.error("normy audit needs playwright:  pnpm add -D playwright && npx playwright install chromium");
  process.exit(2);
}

mkdirSync(join(out, "sections"), { recursive: true });
async function launch() {
  // Playwright's own Chromium, then the installed Chrome or Edge.
  for (const o of [{}, { channel: "chrome" }, { channel: "msedge" }]) {
    try {
      return await chromium.launch(o);
    } catch {}
  }
  console.error("No browser found. Run:  npx playwright install chromium");
  process.exit(2);
}
const browser = await launch();
const results = [];

const slug = (u) => {
  const p = new URL(u).pathname.replace(/\/+$/, "") || "/home";
  return p.replace(/^\//, "").replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "home";
};

/* Runs in the page. Returns findings. */
function inspect() {
  const findings = [];
  const add = (check, severity, message, where) => findings.push({ check, severity, message, where });
  const vw = innerWidth;
  const sel = (el) => {
    if (el.id) return `#${el.id}`;
    const n = el.getAttribute("data-n-part") || el.getAttribute("data-n");
    const base = el.tagName.toLowerCase() + (n ? `[data-n="${n}"]` : "") + (el.classList.length ? "." + [...el.classList].slice(0, 2).join(".") : "");
    const txt = (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40);
    return txt ? `${base} "${txt}"` : base;
  };
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    const cs = getComputedStyle(el);
    return cs.visibility !== "hidden" && cs.display !== "none" && parseFloat(cs.opacity) > 0.05;
  };
  const all = [...document.body.querySelectorAll("*")].filter((el) => !el.closest("[aria-hidden='true'],script,style,noscript,template,svg *"));

  // 1. horizontal overflow
  const sw = document.documentElement.scrollWidth;
  if (sw > vw + 1) {
    const wide = all.filter((el) => el.getBoundingClientRect().right > vw + 1 && visible(el)).slice(0, 5).map(sel);
    add("H_OVERFLOW", "error", `Page is ${sw}px wide in a ${vw}px viewport (horizontal scroll).`, wide.join(" | "));
  }

  // palette from the system tokens
  const probe = document.createElement("i");
  document.body.appendChild(probe);
  const palette = new Set(["rgba(0, 0, 0, 0)", "transparent"]);
  const rootCs = getComputedStyle(document.documentElement);
  const names = [];
  const walk = (rules) => {
    for (const r of rules) {
      if (r.style) for (let i = 0; i < r.style.length; i++) if (r.style[i].startsWith("--n-color-")) names.push(r.style[i]);
      if (r.cssRules) walk(r.cssRules);
    }
  };
  for (const sheet of document.styleSheets) {
    try {
      walk(sheet.cssRules);
    } catch {}
  }
  for (let i = 0; i < rootCs.length; i++) if (rootCs[i].startsWith("--n-color-")) names.push(rootCs[i]);
  for (const nme of new Set(names)) {
    if (!rootCs.getPropertyValue(nme)) continue;
    probe.style.color = `var(${nme})`;
    palette.add(getComputedStyle(probe).color);
  }
  probe.remove();
  // Any CSS colour (rgb, lab, oklch, color-mix…) → sRGB via a 1×1 canvas.
  const cv = document.createElement("canvas");
  cv.width = cv.height = 1;
  const cx = cv.getContext("2d", { willReadFrequently: true });
  const cache = new Map();
  const parse = (c) => {
    if (!c || c === "transparent") return { r: 0, g: 0, b: 0, a: 0 };
    if (cache.has(c)) return cache.get(c);
    cx.clearRect(0, 0, 1, 1);
    cx.fillStyle = "#000";
    cx.fillStyle = c;
    cx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = cx.getImageData(0, 0, 1, 1).data;
    const out = { r, g, b, a: a / 255 };
    cache.set(c, out);
    return out;
  };
  const pal = [...palette].map(parse).filter(Boolean);
  const near = (c) => {
    const p = parse(c);
    if (!p || p.a === 0) return true;
    return pal.some((q) => Math.abs(q.r - p.r) <= 3 && Math.abs(q.g - p.g) <= 3 && Math.abs(q.b - p.b) <= 3 && Math.abs(q.a - p.a) <= 0.05);
  };
  const hasPalette = pal.length > 4;

  const lum = ({ r, g, b }) => {
    const f = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const bgOf = (el) => {
    let stack = [];
    for (let n = el; n; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.backgroundImage !== "none" || (cs.backdropFilter && cs.backdropFilter !== "none")) return null; // gradients, images, glass: unknown
      const c = parse(cs.backgroundColor);
      if (c && c.a > 0) {
        stack.push(c);
        if (c.a >= 0.99) break;
      }
    }
    if (!stack.length) stack.push({ r: 255, g: 255, b: 255, a: 1 });
    // composite from the bottom up
    let acc = { ...stack[stack.length - 1], a: 1 };
    for (let i = stack.length - 2; i >= 0; i--) {
      const c = stack[i];
      acc = { r: c.r * c.a + acc.r * (1 - c.a), g: c.g * c.a + acc.g * (1 - c.a), b: c.b * c.a + acc.b * (1 - c.a), a: 1 };
    }
    return acc;
  };

  const offPalette = new Map();
  const lowContrast = [];
  const clipped = [];
  const small = [];
  const rawControls = [];
  let textEls = 0;

  for (const el of all) {
    if (!visible(el)) continue;
    const cs = getComputedStyle(el);
    const ownText = [...el.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim());
    const kit = el.closest("[data-n],[data-n-part]");

    if (hasPalette && !el.hasAttribute("data-n") && !el.hasAttribute("data-n-part")) {
      const props = [ownText ? "color" : null, "backgroundColor", parseFloat(cs.borderTopWidth) > 0 ? "borderTopColor" : null].filter(Boolean);
      for (const p of props) if (!near(cs[p])) offPalette.set(`${p} ${cs[p]}`, [...(offPalette.get(`${p} ${cs[p]}`) ?? []), sel(el)]);
    }

    if (ownText) {
      textEls++;
      const size = parseFloat(cs.fontSize);
      if (size < 12) small.push(`${sel(el)} (${size}px)`);
      const ov = cs.overflow + cs.overflowX + cs.overflowY;
      const cutsOff = /hidden|clip/.test(ov) || cs.textOverflow === "ellipsis" || (cs.webkitLineClamp && cs.webkitLineClamp !== "none");
      if (cutsOff && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 2) && !el.closest("[data-normy-allow-truncate]")) clipped.push(sel(el));
      const fg = parse(cs.color);
      const bg = bgOf(el);
      if (fg && bg && fg.a > 0.5) {
        const a = lum(fg) + 0.05;
        const b = lum(bg) + 0.05;
        const ratio = Math.max(a, b) / Math.min(a, b);
        const large = size >= 24 || (size >= 18.66 && parseInt(cs.fontWeight) >= 700);
        const need = large ? 3 : 4.5;
        const disabled = el.closest("[data-disabled],:disabled,[aria-disabled='true']");
        if (ratio < need && !disabled) lowContrast.push(`${sel(el)} ${ratio.toFixed(2)}:1 (needs ${need})`);
      }
    }
    if (/^(BUTTON|INPUT|SELECT|TEXTAREA)$/.test(el.tagName) && !kit && el.type !== "hidden") rawControls.push(sel(el));
  }

  if (clipped.length) add("TEXT_CLIPPED", "error", `${clipped.length} text element(s) are cut off.`, clipped.slice(0, 8).join(" | "));
  if (lowContrast.length) add("LOW_CONTRAST", "error", `${lowContrast.length} text element(s) below WCAG AA contrast.`, lowContrast.slice(0, 8).join(" | "));
  if (offPalette.size) {
    const list = [...offPalette.entries()].slice(0, 8).map(([k, v]) => `${k} on ${v.length} el, e.g. ${v[0]}`);
    add("OFF_SYSTEM_COLOR", "error", `${offPalette.size} colour(s) not from the system's tokens.`, list.join(" | "));
  }
  if (!hasPalette) add("NO_SYSTEM", "error", "No Normy colour tokens found on the page. Is normy/styles/normy.css imported?", "");
  if (small.length) add("SMALL_TEXT", "warn", `${small.length} text element(s) under 12px.`, small.slice(0, 6).join(" | "));
  if (rawControls.length) add("RAW_CONTROL", "warn", `${rawControls.length} form control(s) not built with kit components.`, rawControls.slice(0, 6).join(" | "));
  const shift = window.__normyShift ?? 0;
  if (shift > 0.1) add("LAYOUT_SHIFT", "error", `Layout shift ${shift.toFixed(3)} without user input (budget 0.01).`, "");
  else if (shift > 0.01) add("LAYOUT_SHIFT", "warn", `Layout shift ${shift.toFixed(3)} without user input (budget 0.01).`, "");
  return { findings, textEls };
}

for (const url of urls) {
  for (const width of widths) {
    for (const mode of modes) {
      const ctx = await browser.newContext({ viewport: { width, height: width < 600 ? 812 : 900 }, deviceScaleFactor: 1, colorScheme: mode });
      await ctx.addInitScript((m) => {
        try {
          localStorage.setItem("normy:mode", m);
        } catch {}
        window.__normyShift = 0;
        try {
          new PerformanceObserver((l) => {
            for (const e of l.getEntries()) if (!e.hadRecentInput) window.__normyShift += e.value;
          }).observe({ type: "layout-shift", buffered: true });
        } catch {}
      }, mode);
      const page = await ctx.newPage();
      const consoleErrors = [];
      page.on("console", (m) => m.type() === "error" && !/favicon/.test(m.location()?.url ?? "") && consoleErrors.push(m.text().slice(0, 200)));
      page.on("pageerror", (e) => consoleErrors.push(String(e).slice(0, 200)));
      const name = `${slug(url)}-${width}-${mode}`;
      let res;
      try {
        res = await page.goto(url, { waitUntil: "load", timeout: 60000 });
      } catch (e) {
        results.push({ url, width, mode, findings: [{ check: "LOAD", severity: "error", message: String(e.message).slice(0, 200), where: "" }] });
        await ctx.close();
        continue;
      }
      await page.evaluate((m) => document.documentElement.classList.toggle("dark", m === "dark"), mode);
      await page.waitForTimeout(1500);
      await page.screenshot({ path: join(out, `${name}-first-screen.png`) });
      // walk the page so scroll entrances play, then settle
      const h = await page.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y < h; y += 500) {
        await page.evaluate((yy) => scrollTo(0, yy), y);
        await page.waitForTimeout(120);
      }
      await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
      await page.waitForTimeout(1200);
      await page.evaluate(() => scrollTo(0, 0));
      await page.waitForTimeout(400);
      const { findings } = await page.evaluate(inspect);
      if (res && res.status() >= 400) findings.unshift({ check: "HTTP", severity: "error", message: `HTTP ${res.status()}`, where: "" });
      if (consoleErrors.length) findings.push({ check: "CONSOLE_ERROR", severity: "warn", message: `${consoleErrors.length} console error(s).`, where: consoleErrors.slice(0, 3).join(" | ") });
      await page.screenshot({ path: join(out, `${name}-full.png`), fullPage: true });
      // every top-level section alone, at native size (widest width, light only)
      if (width === Math.max(...widths) && mode === "light") {
        const sections = await page.$$("main > section, main > [data-n='section'], [data-n='section'], body > section, main > div > section");
        let i = 0;
        for (const s of sections.slice(0, 30)) {
          const box = await s.boundingBox();
          if (!box || box.height < 40) continue;
          i++;
          await s.screenshot({ path: join(out, "sections", `${slug(url)}-${String(i).padStart(2, "0")}.png`) }).catch(() => {});
        }
      }
      results.push({ url, width, mode, findings });
      await ctx.close();
    }
  }
}
await browser.close();

/* ---------------- report ---------------- */
const errs = results.flatMap((r) => r.findings.filter((f) => f.severity === "error"));
const warns = results.flatMap((r) => r.findings.filter((f) => f.severity === "warn"));
const failed = errs.length > 0 || (strict && warns.length > 0);
const lines = [`# Normy audit — ${new Date().toISOString().slice(0, 16).replace("T", " ")}`, "", `Result: **${failed ? "FAIL" : "PASS"}** — ${errs.length} errors, ${warns.length} warnings.`, ""];
for (const r of results) {
  lines.push(`## ${r.url} — ${r.width}px ${r.mode}`);
  if (!r.findings.length) lines.push("- ok");
  for (const f of r.findings) lines.push(`- **${f.severity.toUpperCase()} ${f.check}** ${f.message}${f.where ? `\n  - ${f.where}` : ""}`);
  lines.push("");
}
lines.push(
  "## Now look",
  "",
  "The checks measure behaviour, not composition. Open every screenshot in this folder at full size (`*-first-screen.png`, `*-full.png`, `sections/`).",
  "For each section answer: on the grid? holes or dead space? text readable and not cut off? same patterns as the other pages? Verdict: ship or fix.",
);
writeFileSync(join(out, "report.md"), lines.join("\n"));
for (const r of results) {
  const bad = r.findings.filter((f) => f.severity === "error").length;
  console.log(`${bad ? "FAIL" : "ok  "}  ${r.url}  ${r.width}px ${r.mode}  ${r.findings.map((f) => `${f.severity === "error" ? "✗" : "!"} ${f.check}`).join("  ")}`);
}
console.log(`\nnormy audit: ${errs.length} errors, ${warns.length} warnings — ${failed ? "FAIL" : "PASS"}. Report and screenshots: ${out}`);
process.exitCode = failed ? 1 : 0;
