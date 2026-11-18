import { existsSync, readdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright";

/** Launch Playwright Chromium, falling back to a cached build or system Chrome. */
export async function launch() {
  try {
    return await chromium.launch();
  } catch {
    // Fall back to any Chromium already in the Playwright cache.
    const cache = path.join(os.homedir(), "AppData", "Local", "ms-playwright");
    const dirs = existsSync(cache) ? readdirSync(cache).filter((d) => /^chromium-\d+$/.test(d)).sort().reverse() : [];
    for (const dir of dirs) {
      for (const sub of ["chrome-win64", "chrome-win"]) {
        const exe = path.join(cache, dir, sub, "chrome.exe");
        if (existsSync(exe)) return chromium.launch({ executablePath: exe });
      }
    }
    return chromium.launch({ channel: "chrome" });
  }
}
