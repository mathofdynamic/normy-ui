// Dev helper: viewport-sized section captures for close inspection.
// Usage: node scripts/crops.mjs <width> <light|dark> <outDir> [selector...]
import { mkdirSync } from "node:fs";
import path from "node:path";
import { launch } from "./launch-browser.mjs";

const [width = "1440", scheme = "light", out = "screenshots/crops", ...selectors] = process.argv.slice(2);
const targets = selectors.length ? selectors : ["#top", "#components", "#c-input", "#c-badge", "#c-dialog", "#playground", "#principles", "footer"];
mkdirSync(out, { recursive: true });

const browser = await launch();
const context = await browser.newContext({ viewport: { width: Number(width), height: 900 }, colorScheme: scheme });
const page = await context.newPage();
await page.goto(process.env.URL ?? "http://localhost:3100", { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
const h = await page.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y < h; y += 500) {
  await page.evaluate((t) => window.scrollTo({ top: t, behavior: "instant" }), y);
  await page.waitForTimeout(80);
}
for (const sel of targets) {
  await page.evaluate((s) => {
    const el = document.querySelector(s);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 70, behavior: "instant" });
  }, sel);
  await page.waitForTimeout(700);
  const name = sel.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "");
  await page.screenshot({ path: path.join(out, `${width}-${scheme}-${name}.png`) });
}
await browser.close();
console.log("ok");
