// Debug: list elements wider than the viewport. Usage: node scripts/_wide.mjs <path> [width]
import { launch } from "./launch-browser.mjs";
const [path = "/studio", w = "390"] = process.argv.slice(2);
const b = await launch();
const ctx = await b.newContext({ viewport: { width: Number(w), height: 900 } });
await ctx.addInitScript(() => localStorage.setItem("normy:studio-welcomed", "1"));
const p = await ctx.newPage();
await p.goto(`http://localhost:3100${path}`, { waitUntil: "networkidle" });
await p.waitForTimeout(2000);
const out = await p.evaluate((vw) => {
  const res = [];
  for (const el of document.querySelectorAll("body *")) {
    const r = el.getBoundingClientRect();
    if (r.right > vw + 1 && r.width > 0) res.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 40)} w=${Math.round(r.width)} right=${Math.round(r.right)}`);
  }
  return [document.documentElement.scrollWidth, ...res.slice(0, 25)];
}, Number(w));
console.log(out.join("\n"));
await b.close();
