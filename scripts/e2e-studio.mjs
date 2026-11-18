// End-to-end check of the Studio workflow. Run via: bash scripts/with-server.sh node scripts/e2e-studio.mjs
import { existsSync, readdirSync, rmSync } from "node:fs";
import { launch } from "./launch-browser.mjs";

const BASE = "http://localhost:3100";
const ok = (cond, msg) => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${msg}`);
  if (!cond) process.exitCode = 1;
};

rmSync("design-systems/e2e-test", { recursive: true, force: true });
const b = await launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(() => {
  if (!sessionStorage.getItem("e2e")) {
    localStorage.clear();
    sessionStorage.setItem("e2e", "1");
  }
});
const p = await ctx.newPage();
const errors = [];
p.on("pageerror", (e) => errors.push(e.message));
await p.goto(`${BASE}/studio`, { waitUntil: "networkidle" });
await p.waitForTimeout(2500);

const frame = () => p.frames().find((f) => f.url().includes("/preview/"));
let f = frame();
ok(!!f, "canvas iframe loaded a preview page");

// 1. Inspect mode → click the hero CTA in the canvas
await p.getByRole("button", { name: "Inspect" }).click();
await p.waitForTimeout(300);
await f.locator('[data-n-id="hero-cta"]').click();
await p.waitForTimeout(500);
const scopeText = await p.locator(".st-crumb b").textContent();
ok(/button/.test(scopeText ?? "") && /hero-cta/.test(scopeText ?? ""), `inspect picked scope: ${scopeText}`);

// 2. Jump from the picked part to the component root, edit radius → canvas updates
if (await p.getByRole("button", { name: "↑ root" }).count()) await p.getByRole("button", { name: "↑ root" }).click();
await p.waitForTimeout(200);
const radiusRow = p.locator(".st-prop", { hasText: /^Radius/ }).first();
await p.getByLabel("Search properties").fill("radius");
await p.waitForTimeout(300);
const radiusInput = p.locator('.st-prop input[aria-label="Radius"]').first();
await radiusInput.fill("22px");
await p.waitForTimeout(600);
const r1 = await f.locator('[data-n-id="hero-cta"]').evaluate((el) => getComputedStyle(el).borderTopLeftRadius);
ok(r1 === "22px", `instance rule applied live in canvas (radius=${r1})`);
void radiusRow;

// 3. Undo restores
await p.getByRole("button", { name: "Undo" }).click();
await p.waitForTimeout(600);
const r2 = await f.locator('[data-n-id="hero-cta"]').evaluate((el) => getComputedStyle(el).borderTopLeftRadius);
ok(r2 !== "22px", `undo reverted (radius=${r2})`);
await p.getByRole("button", { name: "Redo" }).click();
await p.waitForTimeout(400);

// 4. Global token: accent colour
await p.getByLabel("Component", { exact: true }).selectOption("");
await p.getByLabel("Search properties").fill("Accent");
await p.waitForTimeout(300);
const accentIn = p.locator('.st-prop input[aria-label="Accent"]').first();
await accentIn.fill("#1d6fd6");
await p.waitForTimeout(700);
const acc = await f.locator('[data-n-id="hero-cta"]').evaluate((el) => getComputedStyle(el).backgroundColor);
ok(/29, 111, 214|0\.1\d+ 0\.4\d+ 0\.8\d+/.test(acc) || acc.includes("rgb(29, 111, 214)"), `token edit re-skinned canvas (bg=${acc})`);

// 5. Rename + save to disk
await p.getByLabel("System name").fill("E2E Test");
await p.evaluate(async () => {
  const mod = window;
  void mod;
});
// set id by Save as flow: use the Systems tab "Save as…"
p.once("dialog", (d) => d.accept("e2e-test"));
await p.getByRole("tab", { name: "Systems" }).click().catch(() => {});
await p.locator('label:has-text("Systems")').click().catch(() => {});
await p.waitForTimeout(500);
await p.getByRole("button", { name: "Save as…" }).click();
await p.waitForTimeout(2000);
ok(existsSync("design-systems/e2e-test/system.json"), "Save as wrote design-systems/e2e-test/system.json");
const versions = existsSync("design-systems/e2e-test/versions") ? readdirSync("design-systems/e2e-test/versions").length : 0;
ok(versions >= 1, `snapshot written (${versions} version files)`);

// 6. API round-trip
const list = await (await fetch(`${BASE}/api/systems`)).json();
ok(list.systems.some((s) => s.id === "e2e-test"), "GET /api/systems lists the saved system");

// 7. Starter load → canvas changes font
await p.getByRole("button", { name: /Terminal/ }).first().click();
await p.waitForTimeout(1200);
f = frame();
const font = await f.locator("h1").first().evaluate((el) => getComputedStyle(el).fontFamily);
ok(/jetbrains|mono/i.test(font), `starter applied to canvas (h1 font=${font.slice(0, 40)})`);

// 8. Export tab renders tailwind output
await p.locator('label:has-text("Export")').click();
await p.waitForTimeout(500);
const code = await p.locator(".st-code").textContent();
ok((code ?? "").includes("--n-color-accent"), "export panel produced CSS");

ok(errors.length === 0, `no page errors (${errors.slice(0, 2).join(" | ")})`);
await b.close();
rmSync("design-systems/e2e-test", { recursive: true, force: true });
