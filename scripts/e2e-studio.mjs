// End-to-end check of the Studio workflow. Run via: bash scripts/with-server.sh node scripts/e2e-studio.mjs
import { existsSync, readdirSync, rmSync } from "node:fs";
import { launch } from "./launch-browser.mjs";

const BASE = process.env.URL ?? "http://localhost:3100";
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

// 0. First run shows the welcome picker; dismiss it
ok((await p.getByRole("dialog").count()) > 0, "welcome dialog shown on first run");
await p.keyboard.press("Escape");
await p.waitForTimeout(400);

// 1. Select mode → click the hero CTA in the canvas → Edit panel targets "Every button"
await p.locator(".st-dock-btn", { hasText: "Select" }).click();
await p.waitForTimeout(300);
await f.locator('[data-n-id="hero-cta"]').click();
await p.waitForTimeout(600);
const chip = await p.locator(".st-dock-chip").textContent();
ok(/Every button/.test(chip ?? ""), `select picked the component: ${chip}`);

// 2. "Just this one" → edit radius → only that instance changes, live
await p.locator(".st-choice-hit", { hasText: "Just this one" }).click();
await p.waitForTimeout(200);
await p.getByLabel("Search properties").fill("radius");
await p.waitForTimeout(300);
const linked = p.locator('.st-prop button[aria-label^="Radius: linked"]').first();
if (await linked.count()) await linked.click(); // theme-linked values show as a chip until you type your own
await p.locator('.st-prop input[aria-label="Radius"]').first().fill("22px");
await p.waitForTimeout(700);
const r1 = await f.locator('[data-n-id="hero-cta"]').evaluate((el) => getComputedStyle(el).borderTopLeftRadius);
ok(r1 === "22px", `instance rule applied live in canvas (radius=${r1})`);

// 3. Undo restores, redo re-applies
await p.getByRole("button", { name: "Undo" }).click();
await p.waitForTimeout(600);
const r2 = await f.locator('[data-n-id="hero-cta"]').evaluate((el) => getComputedStyle(el).borderTopLeftRadius);
ok(r2 !== "22px", `undo reverted (radius=${r2})`);
await p.getByRole("button", { name: "Redo" }).click();
await p.waitForTimeout(400);

// 4. Advanced inspector still exposes the full cascade
await p.getByRole("radio", { name: "Advanced" }).click();
await p.waitForTimeout(300);
const crumb = await p.locator(".st-crumb b").textContent();
ok(/button/.test(crumb ?? "") && /hero-cta/.test(crumb ?? ""), `advanced inspector shows scope: ${crumb}`);
await p.getByRole("radio", { name: "Simple" }).click();

// 5. Style panel: brand colour preset re-skins the canvas
await p.locator(".st-rail-btn", { hasText: "Style" }).click();
await p.waitForTimeout(300);
const before = await f.locator('[data-n-id="hero-cta"]').evaluate((el) => getComputedStyle(el).backgroundColor);
await p.getByRole("radio", { name: "Green" }).click();
await p.waitForTimeout(700);
const after = await f.locator('[data-n-id="hero-cta"]').evaluate((el) => getComputedStyle(el).backgroundColor);
ok(before !== after, `brand colour re-skinned canvas (${before} → ${after})`);

// 6. Rename + Save as → disk
await p.getByLabel("System name").fill("E2E Test");
p.once("dialog", (d) => d.accept("e2e-test"));
await p.locator(".st-rail-btn", { hasText: "Library" }).click();
await p.waitForTimeout(500);
await p.getByRole("button", { name: "Save as…" }).click();
await p.waitForTimeout(2000);
ok(existsSync("design-systems/e2e-test/system.json"), "Save as wrote design-systems/e2e-test/system.json");
const versions = existsSync("design-systems/e2e-test/versions") ? readdirSync("design-systems/e2e-test/versions").length : 0;
ok(versions >= 1, `snapshot written (${versions} version files)`);

// 7. API round-trip
const list = await (await fetch(`${BASE}/api/systems`)).json();
ok(list.systems.some((s) => s.id === "e2e-test"), "GET /api/systems lists the saved system");

// 8. Starter → canvas changes font
await p.locator(".st-rail-btn", { hasText: "Style" }).click();
await p.waitForTimeout(300);
await p.locator(".st-starter", { hasText: "Terminal" }).first().click();
await p.waitForTimeout(1200);
f = frame();
const font = await f.locator("h1").first().evaluate((el) => getComputedStyle(el).fontFamily);
ok(/jetbrains|mono/i.test(font), `starter applied to canvas (h1 font=${font.slice(0, 40)})`);

// 9. Export panel renders CSS
await p.locator(".st-rail-btn", { hasText: "Export" }).click();
await p.waitForTimeout(500);
const code = await p.locator(".st-code").textContent();
ok((code ?? "").includes("--n-color-accent"), "export panel produced CSS");

ok(errors.length === 0, `no page errors (${errors.slice(0, 2).join(" | ")})`);
await b.close();
rmSync("design-systems/e2e-test", { recursive: true, force: true });
