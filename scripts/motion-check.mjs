// Studio Motion section: view switch, four tabs, entrance sequence, open/close, loops, theme sync.
// Usage: URL=http://localhost:3001 node scripts/motion-check.mjs
import { launch } from "./launch-browser.mjs";

const BASE = process.env.URL ?? "http://localhost:3001";
const results = [];
const check = (name, ok, extra = "") => {
  results.push(ok);
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? `  (${extra})` : ""}`);
};

const b = await launch();
const ctx = await b.newContext({ viewport: { width: 1600, height: 1000 }, colorScheme: "light" });
await ctx.addInitScript(() => localStorage.setItem("normy:studio-welcomed", "1"));
const p = await ctx.newPage();
const errs = [];
p.on("pageerror", (e) => errs.push(e.message));
p.on("console", (m) => m.type() === "error" && !/favicon/.test(m.text()) && errs.push(m.text().slice(0, 200)));
await p.goto(`${BASE}/studio`, { waitUntil: "networkidle" });
await p.waitForTimeout(1500);

const frame = () => p.frames().find((f) => f.url().includes("/preview/motion-studio"));

// 1. View switch → Motion opens the panel and the canvas page.
await p.getByRole("radio", { name: "Motion" }).click();
await p.waitForTimeout(2500);
check("Motion view opens the motion canvas", !!frame());
check("Motion panel is shown", await p.getByRole("tablist", { name: "Kind of motion" }).isVisible());

// 2. Each tab navigates the canvas.
for (const [tab, path] of [["Open & close", "open-close"], ["Interactive", "interactive"], ["Loops", "loops"], ["Entrance", "entrance"]]) {
  await p.getByRole("tab", { name: new RegExp(tab) }).click();
  await p.waitForTimeout(1800);
  check(`tab ${tab} shows its page`, !!frame()?.url().endsWith(path));
}

// 3. Entrance scenario writes the sequence into the cascade.
const enterVars = () => frame().evaluate(() => {
  const cs = getComputedStyle(document.querySelector('[data-n="feature"]'));
  return { effect: cs.getPropertyValue("--n-enter").trim(), lead: cs.getPropertyValue("--n-enter-lead").trim() };
});
await p.getByRole("button", { name: /One by one/ }).click();
await p.waitForTimeout(1200);
const ev = await enterVars();
check("scenario 'One by one' sets lead 100%", ev.lead === "100%", JSON.stringify(ev));
await p.getByRole("radio", { name: "Focus in" }).click();
await p.waitForTimeout(800);
check("effect tile switches the entrance", (await enterVars()).effect === "blur");

// 4. Open & close: dialog opens with the open animation and closes faster before unmounting.
await p.getByRole("tab", { name: /Open & close/ }).click();
await p.waitForTimeout(1800);
await frame().getByRole("button", { name: "Open dialog" }).click();
await p.waitForTimeout(60);
const open = await frame().evaluate(() => { const cs = getComputedStyle(document.querySelector('[role="dialog"]')); return { name: cs.animationName, dur: parseFloat(cs.animationDuration) }; });
check("dialog opens with n-open", open.name === "n-open", JSON.stringify(open));
await p.waitForTimeout(400);
await frame().locator("body").press("Escape");
await p.waitForTimeout(30);
const closing = await frame().evaluate(() => { const el = document.querySelector('[role="dialog"]'); if (!el) return null; const cs = getComputedStyle(el); return { name: cs.animationName, dur: parseFloat(cs.animationDuration) }; });
check("dialog plays a faster close animation", !!closing && closing.name.startsWith("n-close") && closing.dur < open.dur, JSON.stringify(closing));
await p.waitForTimeout(500);
check("dialog unmounts after closing", await frame().evaluate(() => !document.querySelector('[role="dialog"]')));

// 5. Loops: every loop component renders and pauses off screen.
await p.getByRole("tab", { name: /Loops/ }).click();
await p.waitForTimeout(2500);
const loops = await frame().evaluate(() => ({ roots: document.querySelectorAll("[data-n-loop]").length, paused: document.querySelectorAll("[data-n-loop][data-n-paused]").length }));
check("loop components render", loops.roots >= 16, `${loops.roots} roots`);
check("off-screen loops are paused", loops.paused > 0, `${loops.paused} paused`);

// 6. Marquee loops seamlessly: the second copy starts exactly one period later.
const seam = await frame().evaluate(() => {
  const kids = [...document.querySelector('[data-n-part="marquee.track"]').children];
  const per = kids.findIndex((k, i) => i > 0 && k.getAttribute("aria-hidden") === "true");
  if (per <= 0) return null;
  const period = kids[per].offsetLeft - kids[0].offsetLeft;
  const worst = Math.max(...kids.slice(0, per).map((k, i) => Math.abs(kids[i + per].offsetLeft - k.offsetLeft - period)));
  return { period, worst, copies: kids.length / per };
});
check("marquee period is exact", !!seam && seam.worst < 0.5, JSON.stringify(seam));

// 7. One theme: toggling dark switches the Studio and the page together, and it persists.
await p.getByRole("button", { name: "Toggle light / dark" }).click();
await p.waitForTimeout(1000);
const dark = await p.evaluate(() => ({ studio: document.documentElement.classList.contains("dark"), frame: document.querySelector("iframe")?.contentDocument?.documentElement.classList.contains("dark") }));
check("dark mode switches Studio and page together", dark.studio && dark.frame, JSON.stringify(dark));
const opt = await p.evaluate(() => { const o = document.querySelector(".st-page-pick option"); const cs = getComputedStyle(o); return { bg: cs.backgroundColor, color: cs.color }; });
check("page menu options are themed (readable)", opt.bg !== opt.color && !/rgba\(0, 0, 0, 0\)/.test(opt.bg), JSON.stringify(opt));
await p.getByRole("button", { name: "Toggle light / dark" }).click();

check("no page errors", errs.length === 0, errs.slice(0, 2).join(" | "));
await b.close();
const failed = results.filter((x) => !x).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
