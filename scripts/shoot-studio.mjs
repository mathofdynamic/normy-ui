// Screenshots of the Studio in its main working states.
// Usage: bash scripts/with-server.sh node scripts/shoot-studio.mjs <outDir> [--width=1440] [--mode=light]
import { mkdirSync } from "node:fs";
import { launch } from "./launch-browser.mjs";

const args = process.argv.slice(2);
const flags = Object.fromEntries(args.filter((a) => a.startsWith("--")).map((a) => { const [k, v] = a.slice(2).split("="); return [k, v ?? "1"]; }));
const [outDir = "screenshots/studio"] = args.filter((a) => !a.startsWith("--"));
const BASE = process.env.URL ?? "http://localhost:3100";
const width = Number(flags.width ?? 1440);
const mode = flags.mode ?? "light";
mkdirSync(outDir, { recursive: true });

const b = await launch();
const ctx = await b.newContext({ viewport: { width, height: width < 800 ? 900 : 900 }, colorScheme: mode });
const p = await ctx.newPage();
const errors = [];
p.on("pageerror", (e) => errors.push(e.message));
p.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 200)));
const shot = async (name) => {
  await p.waitForTimeout(900);
  await p.screenshot({ path: `${outDir}/${name}-${width}-${mode}.png` });
};

await p.goto(`${BASE}/studio`, { waitUntil: "networkidle", timeout: 120000 });
await p.waitForTimeout(2500);
await shot("01-welcome");
await p.keyboard.press("Escape");
await p.waitForTimeout(400);
await shot("02-style");

// Pick a brand colour + corners
await p.getByRole("radio", { name: "Violet" }).click();
await p.getByRole("radio", { name: "Pill" }).click();
await shot("03-style-changed");

// Edit: select an element in the canvas
await p.getByRole("button", { name: /^Edit/ }).first().click();
await shot("04-edit-browse");
await p.getByRole("button", { name: /Select an element/ }).click();
await p.waitForTimeout(300);
const f = p.frames().find((x) => x.url().includes("/preview/"));
await f?.locator('[data-n-id="hero-cta"]').click().catch(() => {});
await shot("05-edit-element");
await p.getByRole("tab", { name: "Hover" }).click().catch(() => {});
await shot("06-edit-hover");
await p.getByRole("radio", { name: "Advanced" }).click();
await shot("07-advanced");
await p.getByRole("radio", { name: "Simple" }).click();

for (const panel of ["Pages", "Library", "Export", "History"]) {
  await p.locator(".st-rail-btn", { hasText: panel }).click();
  await shot(`08-${panel.toLowerCase()}`);
}
console.log(errors.length ? `ERRORS:\n${errors.slice(0, 5).join("\n")}` : "no page errors");
await b.close();
