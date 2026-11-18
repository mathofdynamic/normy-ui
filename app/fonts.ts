import { Archivo, Cormorant_Garamond, DM_Sans, Fraunces, Fredoka, IBM_Plex_Mono, IBM_Plex_Sans, JetBrains_Mono, Jost, Manrope, Newsreader, Nunito, Roboto, Space_Grotesk, Space_Mono } from "next/font/google";

/* Bundled families. Defaults preload; preset families load on demand (preload: false). */
const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin"], axes: ["wdth"], display: "swap" });
const plexSans = IBM_Plex_Sans({ variable: "--font-plex-sans", subsets: ["latin"], display: "swap" });
const plexMono = IBM_Plex_Mono({ variable: "--font-plex-mono", subsets: ["latin"], weight: ["400", "500"], display: "swap" });
const spaceGrotesk = Space_Grotesk({ variable: "--font-space-grotesk", subsets: ["latin"], display: "swap", preload: false });
const spaceMono = Space_Mono({ variable: "--font-space-mono", subsets: ["latin"], weight: ["400", "700"], display: "swap", preload: false });
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"], display: "swap", preload: false });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], display: "swap", preload: false });
const newsreader = Newsreader({ variable: "--font-newsreader", subsets: ["latin"], display: "swap", preload: false });
const cormorant = Cormorant_Garamond({ variable: "--font-cormorant", subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap", preload: false });
const jost = Jost({ variable: "--font-jost", subsets: ["latin"], display: "swap", preload: false });
const fredoka = Fredoka({ variable: "--font-fredoka", subsets: ["latin"], display: "swap", preload: false });
const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"], display: "swap", preload: false });
const roboto = Roboto({ variable: "--font-roboto", subsets: ["latin"], display: "swap", preload: false });
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"], display: "swap", preload: false });
const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"], display: "swap", preload: false });

export const fontVariables = [archivo, plexSans, plexMono, spaceGrotesk, spaceMono, manrope, fraunces, newsreader, cormorant, jost, fredoka, nunito, roboto, jetbrains, dmSans]
  .map((f) => f.variable)
  .join(" ");
