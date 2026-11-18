// Final screenshot matrix: every page × 390/768/1440 × light/dark → screenshots/final/
import { execFileSync } from "node:child_process";
const pages = ["/", "/studio", "/preview/saas", "/preview/pricing", "/preview/blog", "/preview/blog/article", "/preview/shop", "/preview/shop/product", "/preview/portfolio", "/preview/docs", "/preview/login", "/preview/signup", "/preview/not-found", "/preview/app", "/preview/app/table", "/preview/app/settings", "/preview/app/kanban", "/preview/app/inbox", "/preview/app/calendar", "/preview/app/checkout", "/preview/app/states", "/preview/motion", "/preview/analyzer"];
for (let i = 0; i < pages.length; i += 4) {
  execFileSync("node", ["scripts/shoot.mjs", "screenshots/final", ...pages.slice(i, i + 4)], { stdio: "inherit" });
}
execFileSync("node", ["scripts/shoot.mjs", "screenshots/final", "/preview/atlas", "--widths=1440,390"], { stdio: "inherit" });
