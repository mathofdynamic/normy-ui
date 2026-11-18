// Full-page screenshots for milestone checks.
// Usage: node scripts/shoot.mjs <outDir> <path> [path…] [--widths=390,768,1440] [--modes=light,dark] [--system=file.json] [--viewport]
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { launch } from "./launch-browser.mjs";

const args = process.argv.slice(2);
const flags = Object.fromEntries(args.filter((a) => a.startsWith("--")).map((a) => { const [k, v] = a.slice(2).split("="); return [k, v ?? "1"]; }));
const [outDir, ...paths] = args.filter((a) => !a.startsWith("--"));
const BASE = process.env.URL ?? "http://localhost:3100";
const widths = (flags.widths ?? "390,768,1440").split(",").map(Number);
const modes = (flags.modes ?? "light,dark").split(",");
const system = flags.system ? readFileSync(flags.system, "utf8") : null;
mkdirSync(outDir, { recursive: true });

const browser = await launch();
for (const p of paths) {
  for (const width of widths) {
    for (const mode of modes) {
      const ctx = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: mode });
      if (system) {
        await ctx.addInitScript((s) => {
          try {
            localStorage.setItem("normy:active-system", s);
            localStorage.removeItem("normy:active-css");
          } catch {}
        }, system);
      }
      const page = await ctx.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 200)));
      await page.goto(BASE + p, { waitUntil: "networkidle", timeout: 120000 });
      await page.evaluate(() => document.fonts.ready);
      const h = await page.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y < h; y += 600) {
        await page.evaluate((t) => window.scrollTo({ top: t, behavior: "instant" }), y);
        await page.waitForTimeout(90);
      }
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
      await page.waitForTimeout(900);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      const name = `${p.replace(/^\//, "").replace(/\//g, "_") || "home"}-${width}-${mode}.png`;
      await page.screenshot({ path: path.join(outDir, name), fullPage: !flags.viewport });
      console.log(`${name} overflowX=${overflow}${errors.length ? ` ERR ${JSON.stringify(errors.slice(0, 2))}` : ""}`);
      await ctx.close();
    }
  }
}
await browser.close();
