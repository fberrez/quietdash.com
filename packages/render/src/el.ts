import type { SatoriNode } from "./types.js";

/**
 * Minimal element builder for composing satori node trees by hand (so layouts
 * can nest pre-rendered widget nodes as children — satori-html templates can
 * only interpolate text). satori only lays out with flex, so every container
 * style should set `display:"flex"`.
 *
 * Style keys are CSS-in-JS (camelCase), values are strings.
 */
export type Style = Record<string, string>;

export function el(style: Style, children: SatoriNode[] | SatoriNode | string): SatoriNode {
  return { type: "div", props: { style, children } } as unknown as SatoriNode;
}

/** A leaf text node with its own style. */
export function text(style: Style, value: string): SatoriNode {
  return el(style, value);
}
