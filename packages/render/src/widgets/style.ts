import { el, text, type Style } from "../el.js";
import type { SatoriNode } from "../types.js";
import type { SlotBox } from "./types.js";

/** The brand is pure black ink on white paper (D10); both snap crisp at 1-bit. */
export const INK = "#000000";
export const PAPER = "#ffffff";
export const MONO = "'IBM Plex Mono'";
export const SANS = "'Atkinson Hyperlegible'";

/** A widget shell: fills its slot, padded, clipped, calm. */
export function shell(children: SatoriNode[], pad = 20): SatoriNode {
  return el(
    {
      display: "flex",
      flexDirection: "column",
      width: "100%",
      height: "100%",
      backgroundColor: PAPER,
      color: INK,
      padding: `${pad}px`,
      overflow: "hidden",
    },
    children,
  );
}

/** Small uppercase mono kicker, the house "label" voice. */
export function kicker(label: string): SatoriNode {
  return text(
    {
      display: "flex",
      fontFamily: MONO,
      fontSize: "14px",
      fontWeight: "700",
      letterSpacing: "2px",
      marginBottom: "10px",
    },
    label.toUpperCase(),
  );
}

/** Clamp a string to a character budget with an ellipsis. */
export function truncate(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, Math.max(1, max - 1)).trimEnd()}…`;
}

/** Rough char budget for one line of `fontPx` text across `box` width. */
export function charsPerLine(box: SlotBox, fontPx: number, padPx = 40): number {
  // Atkinson Hyperlegible averages ~0.55em per glyph.
  return Math.max(6, Math.floor((box.width - padPx) / (fontPx * 0.55)));
}

export type { Style };
