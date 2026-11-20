// Films navigation frame by frame (CDP screencast, no ffmpeg) to catch flashes a human sees.
// Usage: URL=http://localhost:3001 [MODE=preview|studio|load] node scripts/film-nav.mjs
// Writes screenshots/film/<case>/NNN.jpg plus a summary of how much each frame differs from the last.
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { launch } from "./launch-browser.mjs";

const BASE = process.env.URL ?? "http://localhost:3001";
const MODE = process.env.MODE ?? "preview";
const b = await launch();
const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
await ctx.addInitScript(() => localStorage.setItem("normy:studio-welcomed", "1"));
const p = await ctx.newPage();
const cdp = await ctx.newCDPSession(p);

async function film(name, action, ms = 2500) {
  const dir = `screenshots/film/${name}`;
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const frames = [];
  const onFrame = async (f) => {
    frames.push({ t: f.metadata.timestamp, data: f.data });
    await cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }).catch(() => {});
  };
  cdp.on("Page.screencastFrame", onFrame);
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 60, maxWidth: 640, maxHeight: 400, everyNthFrame: 1 });
  await p.waitForTimeout(300);
  const t0 = Date.now() / 1000;
  await action();
  await p.waitForTimeout(ms);
  await cdp.send("Page.stopScreencast");
  cdp.off("Page.screencastFrame", onFrame);
  const lines = [];
  frames.forEach((f, i) => {
    const file = `${dir}/${String(i).padStart(3, "0")}.jpg`;
    writeFileSync(file, Buffer.from(f.data, "base64"));
    lines.push(`${String(i).padStart(3, "0")}  +${Math.round((f.t - t0) * 1000)}ms  ${Math.round(f.data.length / 1024)}KB`);
  });
  writeFileSync(`${dir}/frames.txt`, lines.join("\n"));
  console.log(`${name}: ${frames.length} frames → ${dir}`);
  console.log(lines.join("\n"));
}

if (MODE === "preview") {
  await p.goto(BASE + "/preview/saas", { waitUntil: "load" });
  await p.waitForTimeout(2500);
  await film("preview-saas-to-pricing", () => p.locator('a[href="/preview/pricing"]').first().click());
}
if (MODE === "load") {
  await film("load-pricing", () => p.goto(BASE + "/preview/pricing"), 3000);
}
if (MODE === "studio") {
  await p.goto(BASE + "/studio", { waitUntil: "load" });
  await p.waitForTimeout(4000);
  await film("studio-switch-page", async () => {
    await p.locator("select.st-page-pick, .st-page-pick select").first().selectOption({ label: "Pricing" }).catch(async () => {
      await p.locator(".st-page-pick").first().click();
    });
  }, 3500);
}
await b.close();
