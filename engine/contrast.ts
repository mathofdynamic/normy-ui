/* Contrast maths: WCAG 2.x ratio and APCA (0.0.98G-4g) Lc. Colours are sRGB 0–255. */

export type RGBA = [number, number, number, number];

const lin = (c: number) => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};

export function luminance([r, g, b]: RGBA) {
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** Composite a (possibly translucent) colour over an opaque background. */
export function over(fg: RGBA, bg: RGBA): RGBA {
  const a = fg[3];
  return [fg[0] * a + bg[0] * (1 - a), fg[1] * a + bg[1] * (1 - a), fg[2] * a + bg[2] * (1 - a), 1];
}

export function wcagRatio(fg: RGBA, bg: RGBA) {
  const L1 = luminance(over(fg, bg));
  const L2 = luminance(bg);
  const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (hi + 0.05) / (lo + 0.05);
}

/** APCA Lc (absolute value; ≥ 75 body text, ≥ 60 large text, ≥ 45 UI). */
export function apca(fgIn: RGBA, bg: RGBA) {
  const fg = over(fgIn, bg);
  const Y = ([r, g, b]: RGBA) => 0.2126729 * Math.pow(r / 255, 2.4) + 0.7151522 * Math.pow(g / 255, 2.4) + 0.072175 * Math.pow(b / 255, 2.4);
  const clamp = (y: number) => (y > 0.022 ? y : y + Math.pow(0.022 - y, 1.414));
  const Yt = clamp(Y(fg));
  const Yb = clamp(Y(bg));
  let C: number;
  if (Yb > Yt) C = (Math.pow(Yb, 0.56) - Math.pow(Yt, 0.57)) * 1.14;
  else C = (Math.pow(Yb, 0.65) - Math.pow(Yt, 0.62)) * 1.14;
  const out = Math.abs(C) < 0.1 ? 0 : C > 0 ? C - 0.027 : C + 0.027;
  return Math.abs(out * 100);
}

/** Resolve any CSS colour (including var() and color-mix) to sRGB in the browser. */
export function makeResolver() {
  const probe = document.createElement("span");
  probe.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;pointer-events:none";
  document.body.appendChild(probe);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  const resolve = (css: string): RGBA => {
    probe.style.color = "";
    probe.style.color = css;
    const computed = getComputedStyle(probe).color;
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = "#000";
    ctx.fillStyle = computed;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    return [r, g, b, a / 255];
  };
  return { resolve, dispose: () => probe.remove() };
}

export interface ContrastPair {
  fg: string;
  bg: string;
  label: string;
  /** Minimum WCAG ratio for this pair's use. */
  min: number;
}

export const CONTRAST_PAIRS: ContrastPair[] = [
  { fg: "text", bg: "bg", label: "Body text on canvas", min: 4.5 },
  { fg: "text", bg: "surface-raised", label: "Body text on cards", min: 4.5 },
  { fg: "text-muted", bg: "bg", label: "Muted text on canvas", min: 4.5 },
  { fg: "text-muted", bg: "surface-raised", label: "Muted text on cards", min: 4.5 },
  { fg: "text-subtle", bg: "bg", label: "Subtle text (labels, captions)", min: 3 },
  { fg: "text-on-accent", bg: "accent", label: "Text on accent buttons", min: 4.5 },
  { fg: "accent-text", bg: "bg", label: "Accent text on canvas", min: 4.5 },
  { fg: "link", bg: "bg", label: "Links on canvas", min: 4.5 },
  { fg: "text-inverse", bg: "surface-inverse", label: "Inverse text", min: 4.5 },
  { fg: "success-text", bg: "bg", label: "Success text", min: 4.5 },
  { fg: "warning-text", bg: "bg", label: "Warning text", min: 4.5 },
  { fg: "danger-text", bg: "bg", label: "Danger text", min: 4.5 },
  { fg: "info-text", bg: "bg", label: "Info text", min: 4.5 },
  { fg: "border-strong", bg: "bg", label: "Control borders (non-text)", min: 3 },
  { fg: "focus", bg: "bg", label: "Focus ring (non-text)", min: 3 },
];

export interface ContrastResult extends ContrastPair {
  mode: "light" | "dark";
  ratio: number;
  lc: number;
  pass: boolean;
}

/** Measure all pairs in both modes against the live document (toggles .dark synchronously, no paint). */
export function measureContrast(pairs = CONTRAST_PAIRS): ContrastResult[] {
  const root = document.documentElement;
  const wasDark = root.classList.contains("dark");
  const { resolve, dispose } = makeResolver();
  const out: ContrastResult[] = [];
  for (const mode of ["light", "dark"] as const) {
    root.classList.toggle("dark", mode === "dark");
    const page = resolve("var(--n-color-bg)");
    for (const p of pairs) {
      const bgRaw = resolve(`var(--n-color-${p.bg})`);
      const bg = over(bgRaw, page);
      const fg = resolve(`var(--n-color-${p.fg})`);
      const ratio = wcagRatio(fg, bg);
      out.push({ ...p, mode, ratio, lc: apca(fg, bg), pass: ratio >= p.min });
    }
  }
  root.classList.toggle("dark", wasDark);
  dispose();
  return out;
}
