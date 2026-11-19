// UX review walk-through: real flows at several sizes → screenshots/review/
// Usage: URL=http://localhost:3001 node scripts/review.mjs
import { mkdirSync } from "node:fs";
import { launch } from "./launch-browser.mjs";

const BASE = process.env.URL ?? "http://localhost:3100";
const OUT = "screenshots/review";
mkdirSync(OUT, { recursive: true });
const b = await launch();
const notes = [];

async function session(name, { width = 1440, height = 900, scheme = "light", ui } = {}) {
  const ctx = await b.newContext({ viewport: { width, height }, colorScheme: scheme });
  await ctx.addInitScript((u) => {
    if (sessionStorage.getItem("r")) return;
    sessionStorage.setItem("r", "1");
    localStorage.clear();
    localStorage.setItem("normy:studio-welcomed", "1");
    if (u) localStorage.setItem("normy:studio-ui", JSON.stringify(u));
  }, ui ?? null);
  const p = await ctx.newPage();
  p.on("pageerror", (e) => notes.push(`[${name}] pageerror: ${e.message}`));
  p.on("console", (m) => m.type() === "error" && notes.push(`[${name}] console: ${m.text().slice(0, 160)}`));
  await p.goto(`${BASE}/studio`, { waitUntil: "networkidle", timeout: 120000 });
  await p.waitForTimeout(2500);
  const shot = async (n) => {
    await p.waitForTimeout(700);
    await p.screenshot({ path: `${OUT}/${name}-${n}.png` });
  };
  const frame = () => p.frames().find((f) => f.url().includes("/preview/"));
  return { p, ctx, shot, frame };
}

// A. Default desktop: fine-tune, custom colour, typography, motion
{
  const { p, shot, ctx } = await session("a");
  await p.locator(".st-sec", { hasText: "Corners" }).getByRole("button", { name: "Fine-tune" }).click();
  await shot("finetune-corners");
  await p.getByLabel("Brand colour hex").fill("#ff5a1f");
  await p.locator(".st-panel-scroll").evaluate((el) => (el.scrollTop = 900));
  await shot("typography");
  await p.locator(".st-panel-scroll").evaluate((el) => (el.scrollTop = 99999));
  await shot("bottom");
  await ctx.close();
}

// B. Edit a bigger component (card) + all properties + a colour edit
{
  const { p, shot, frame, ctx } = await session("b");
  await p.locator(".st-rail-btn", { hasText: "Edit" }).click();
  await shot("browse");
  await p.locator(".st-dock-btn", { hasText: "Select" }).click();
  const f = frame();
  const card = f.locator('[data-n="card"]').first();
  await card.scrollIntoViewIfNeeded().catch(() => {});
  await card.click({ position: { x: 20, y: 20 } }).catch((e) => notes.push(`[b] card click: ${e.message.slice(0, 80)}`));
  await shot("card-picked");
  await p.locator(".st-panel-scroll").evaluate((el) => (el.scrollTop = 500));
  await shot("card-props");
  await p.getByRole("button", { name: /Show all/ }).click();
  await p.locator(".st-panel-scroll").evaluate((el) => (el.scrollTop = 99999));
  await shot("card-all");
  await ctx.close();
}

// C. Large interface + wide panel
{
  const { p, shot, ctx } = await session("c", { ui: { size: "large", width: 560 } });
  await shot("large-style");
  await p.locator(".st-rail-btn", { hasText: "Edit" }).click();
  await p.locator(".st-item", { hasText: "Button" }).first().click();
  await shot("large-edit");
  await ctx.close();
}

// D. Compact on a laptop (1280×720), dark chrome
{
  const { p, shot, ctx } = await session("d", { width: 1280, height: 720, scheme: "dark", ui: { size: "compact", width: 340 } });
  await shot("compact-dark");
  await p.getByRole("button", { name: "Toggle light / dark preview" }).click();
  await p.locator(".st-rail-btn", { hasText: "Pages" }).click();
  await shot("compact-pages-darkpreview");
  await p.locator(".st-rail-btn", { hasText: "Hide" }).click();
  await shot("panel-hidden");
  await ctx.close();
}

// E. Devices + compare + history
{
  const { p, shot, ctx } = await session("e");
  await p.getByRole("radio", { name: "Black" }).click();
  await p.getByRole("radio", { name: "Sharp" }).click();
  await p.getByRole("radio", { name: "Phone" }).click();
  await shot("phone");
  await p.getByRole("radio", { name: "Desktop" }).click();
  await shot("desktop");
  await p.getByRole("button", { name: "Compare" }).click();
  await shot("compare");
  await p.getByRole("button", { name: "Compare" }).click();
  await p.locator(".st-rail-btn", { hasText: "History" }).click();
  await shot("history");
  await p.getByRole("button", { name: "More options" }).click();
  await shot("menu");
  await ctx.close();
}

// F. Tablet-ish width
{
  const { shot, ctx } = await session("f", { width: 1024, height: 768 });
  await shot("1024");
  await ctx.close();
}

console.log(notes.length ? notes.join("\n") : "no errors");
await b.close();
