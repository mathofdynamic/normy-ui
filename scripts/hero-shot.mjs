// Product shot of the Studio for the Hub hero → public/studio-hero.png
// Usage: bash scripts/with-server.sh node scripts/hero-shot.mjs
import { launch } from "./launch-browser.mjs";

const BASE = process.env.URL ?? "http://localhost:3100";
const b = await launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: "light" });
await ctx.addInitScript(() => localStorage.setItem("normy:studio-welcomed", "1"));
const p = await ctx.newPage();
await p.goto(`${BASE}/studio`, { waitUntil: "networkidle", timeout: 120000 });
await p.waitForTimeout(3000);
await p.screenshot({ path: "public/studio-hero.png" });
await b.close();
console.log("wrote public/studio-hero.png");
