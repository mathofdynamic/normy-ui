import { mkdirSync, writeFileSync } from "node:fs";
import { STARTERS } from "../engine/systems";
mkdirSync("screenshots/_systems", { recursive: true });
for (const s of STARTERS) writeFileSync(`screenshots/_systems/${s.meta.id}.json`, JSON.stringify(s));
console.log(STARTERS.map((s) => `${s.meta.id}:${s.rules.length}r/${Object.keys(s.tokens).length}t`).join(" "));
