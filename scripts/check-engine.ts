import { compile } from "../engine/compile";
import { COMPONENTS } from "../engine/components";
import { registryStats } from "../engine/registry";
import { createSystem } from "../engine/system";

const sys = createSystem({ id: "normy", name: "Normy" });
const out = compile(sys, COMPONENTS);
const s = registryStats();
console.log(`components=${COMPONENTS.length} tokens=${s.tokens} properties=${s.properties} total=${s.total}`);
console.log(`rules=${out.stats.rules} decls=${out.stats.declarations} bytes=${out.stats.bytes} ms=${out.stats.ms.toFixed(1)}`);
const bad = out.css.match(/:\s*(undefined|null|NaN|\[object Object\])/g);
if (bad) console.log("BAD VALUES:", bad.slice(0, 10));
const t0 = performance.now();
for (let i = 0; i < 20; i++) compile(sys, COMPONENTS);
console.log(`avg compile ms=${((performance.now() - t0) / 20).toFixed(2)}`);
if (process.argv[2] === "dump") console.log(out.css.slice(0, Number(process.argv[3] ?? 3000)));
