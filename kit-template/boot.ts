/* Runs before first paint (inline <script> in <head>): applies the saved light/dark choice
 * and briefly holds animated content so entrances never blink. The hold always expires. */
export const MODE_KEY = "normy:mode";

export const NORMY_BOOT = `(function(){try{var d=document.documentElement;var m=localStorage.getItem('${MODE_KEY}')||'system';var dk=m==='dark'||(m==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);if(dk)d.classList.add('dark');d.dataset.nModePref=m;if(!matchMedia('(prefers-reduced-motion: reduce)').matches){d.setAttribute('data-n-pre','');window.__nPre='held';setTimeout(function(){if(d.hasAttribute('data-n-pre')){d.setAttribute('data-n-reveal','');d.removeAttribute('data-n-pre');window.__nPre='expired';setTimeout(function(){d.removeAttribute('data-n-reveal');},700);}},1200);}}catch(e){}})();`;

export type Mode = "light" | "dark" | "system";

export function setMode(mode: Mode) {
  const d = document.documentElement;
  try {
    localStorage.setItem(MODE_KEY, mode);
  } catch {}
  d.dataset.nModePref = mode;
  const dark = mode === "dark" || (mode === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  d.classList.toggle("dark", dark);
}

export function getMode(): Mode {
  try {
    return (localStorage.getItem(MODE_KEY) as Mode) || "system";
  } catch {
    return "system";
  }
}
