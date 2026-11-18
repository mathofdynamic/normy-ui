// Full-page screenshots at 3 widths × 2 schemes.
// Usage: node scripts/screenshots.mjs [baseUrl]   (dev server must be running)
import { mkdirSync } from "node:fs";
import path from "node:path";
import { launch } from "./launch-browser.mjs";

const BASE = process.argv[2] ?? "http://localhost:3100";
const OUT = path.resolve("screenshots");
const WIDTHS = [
  ["mobile", 390],
  ["tablet", 768],
  ["desktop", 1440],
];
const SCHEMES = ["light", "dark"];

mkdirSync(OUT, { recursive: true });

const browser = await launch();
for (const [name, width] of WIDTHS) {
  for (const scheme of SCHEMES) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: scheme, deviceScaleFactor: 1 });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    // Scroll through so whileInView reveals fire, then return to top.
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < height; y += 500) {
      await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
      await page.waitForTimeout(120);
    }
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.waitForTimeout(1200);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    const file = path.join(OUT, `${name}-${scheme}.png`);
    await page.screenshot({ path: file, fullPage: true });
    console.log(`${file}  overflowX=${overflow}px${errors.length ? `  errors=${JSON.stringify(errors.slice(0, 3))}` : ""}`);
    await context.close();
  }
}
await browser.close();
