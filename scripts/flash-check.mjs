// Detects the "page loads twice" flash: samples the visible opacity of the first <h1>
// on every animation frame, on first load and after a client-side navigation.
// A flash = the heading is visible (≥0.9) and then drops to near-invisible (≤0.2) again.
// Usage: URL=http://localhost:3001 node scripts/flash-check.mjs
import { launch } from "./launch-browser.mjs";

const BASE = process.env.URL ?? "http://localhost:3100";
const b = await launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(() => {
  const samples = [];
  window.__samples = samples;
  const vis = (el) => {
    let o = 1;
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) o *= parseFloat(getComputedStyle(n).opacity);
    return o;
  };
  const tick = () => {
    const h = document.querySelector("[data-n-page] h1, [data-n-page] h2, h1, h2");
    if (h) samples.push({ t: Math.round(performance.now()), path: location.pathname, o: +vis(h).toFixed(2) });
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
});
const p = await ctx.newPage();

function flashes(samples, path) {
  const s = samples.filter((x) => x.path === path);
  let seenVisible = false;
  for (const x of s) {
    if (x.o >= 0.9) seenVisible = true;
    else if (seenVisible && x.o <= 0.2) return { flash: true, at: x.t, first: s[0]?.o, n: s.length };
  }
  return { flash: false, first: s[0]?.o, last: s.at(-1)?.o, n: s.length };
}

let fail = false;
for (const path of ["/preview/saas", "/preview/pricing", "/", "/preview/app", "/preview/app/table", "/preview/blog"]) {
  await p.goto(BASE + path, { waitUntil: "load" });
  await p.waitForTimeout(2500);
  const r = flashes(await p.evaluate(() => window.__samples), path);
  console.log(`${r.flash ? "FLASH" : "ok   "}  first load ${path}  first=${r.first} last=${r.last ?? "-"} frames=${r.n}`);
  fail ||= r.flash;
}

// client-side navigations inside the preview app
for (const [from, to] of [["/preview/saas", "/preview/pricing"], ["/preview/pricing", "/preview/blog"], ["/preview/blog", "/preview/saas"], ["/preview/app", "/preview/app/table"]]) {
  await p.goto(BASE + from, { waitUntil: "load" });
  await p.waitForTimeout(2000);
  await p.evaluate(() => (window.__samples.length = 0));
  await p.locator(`a[href="${to}"]`).first().click();
  await p.waitForTimeout(2500);
  const r = flashes(await p.evaluate(() => window.__samples), to);
  console.log(`${r.flash ? "FLASH" : "ok   "}  navigate ${from} → ${to}  first=${r.first} last=${r.last ?? "-"} frames=${r.n}`);
  fail ||= r.flash;
}
await b.close();
process.exitCode = fail ? 1 : 0;
