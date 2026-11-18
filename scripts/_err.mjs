import { readFileSync } from "node:fs";
import { launch } from "./launch-browser.mjs";
const b = await launch(); const ctx = await b.newContext();
if (process.env.SYS) { const s = readFileSync(process.env.SYS, "utf8"); await ctx.addInitScript((x) => { localStorage.setItem("normy:active-system", x); localStorage.removeItem("normy:active-css"); }, s); }
const p = await ctx.newPage();
p.on("console", (m) => m.type() === "error" && console.log("ERR:", m.text().slice(0, 1500)));
p.on("pageerror", (e) => console.log("PAGEERR:", e.message.slice(0, 800)));
await p.goto((process.env.URL ?? "http://localhost:3100") + (process.argv[2] ?? "/"), { waitUntil: "networkidle" });
await p.waitForTimeout(2500); await b.close();
