import { launch } from "./launch-browser.mjs";
const b = await launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 900 } })).newPage();
for (const path of process.argv.slice(2)) {
  await p.goto("http://localhost:3100" + path, { waitUntil: "networkidle" });
  await p.waitForTimeout(800);
  const res = await p.evaluate(() => {
    const vw = window.innerWidth; const out = [];
    for (const el of document.querySelectorAll("body *")) {
      const r = el.getBoundingClientRect();
      let clipped = false;
      for (let a = el.parentElement; a; a = a.parentElement) {
        const o = getComputedStyle(a);
        if (/(auto|scroll|hidden|clip)/.test(o.overflowX) && a.getBoundingClientRect().right <= vw + 1) { clipped = true; break; }
      }
      if (!clipped && r.right > vw + 1 && r.width > 0) {
        // only report the outermost offenders
        const parent = el.parentElement?.getBoundingClientRect();
        if (!parent || parent.right <= vw + 1) out.push(`${el.tagName.toLowerCase()}[${el.getAttribute("data-n") || el.getAttribute("data-n-part") || el.className || ""} #${el.getAttribute("data-n-id") || ""} ${el.getAttribute("data-n-variant") || ""}] right=${Math.round(r.right)} w=${Math.round(r.width)}`);
      }
    }
    return { scroll: document.documentElement.scrollWidth - vw, out: out.slice(0, 8) };
  });
  console.log(path, JSON.stringify(res, null, 1));
}
await b.close();
