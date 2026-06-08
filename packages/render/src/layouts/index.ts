import type { LayoutId } from "@quietdash/shared";
import { el } from "../el.js";
import type { SatoriNode } from "../types.js";
import { INK, PAPER } from "../widgets/style.js";
import type { SlotBox } from "../widgets/types.js";

/**
 * Curated layouts: WE design the composition, the user fills named slots.
 * Each template declares its slots (name + approximate pixel box, so widgets
 * scale text to fit) and composes the rendered slot nodes into the 800x480
 * page with the house hairline frame. Slot names must match LAYOUT_SLOTS in
 * `@quietdash/shared`.
 */
export interface LayoutSlotDef {
  name: string;
  box: SlotBox;
}
export interface LayoutTemplate {
  id: LayoutId;
  slots: LayoutSlotDef[];
  compose(rendered: Record<string, SatoriNode>): SatoriNode;
}

const BORDER = `2px solid ${INK}`;

/** Outer page: white margin, then the hairline frame holding `inner`. */
function page(inner: SatoriNode): SatoriNode {
  return el(
    { display: "flex", width: "100%", height: "100%", backgroundColor: PAPER, padding: "16px" },
    [el({ display: "flex", flex: "1", border: BORDER }, [inner])],
  );
}

/** A flex cell wrapping one slot's rendered node (or an empty slot). */
function cell(style: Record<string, string>, node: SatoriNode | undefined): SatoriNode {
  return el({ display: "flex", ...style }, [node ?? el({ display: "flex", width: "100%", height: "100%" }, [])]);
}

export const LAYOUTS: Record<LayoutId, LayoutTemplate> = {
  "single-big": {
    id: "single-big",
    slots: [{ name: "main", box: { width: 764, height: 444 } }],
    compose: (r) => page(cell({ flex: "1" }, r.main)),
  },

  "desk-focus": {
    id: "desk-focus",
    slots: [
      { name: "main", box: { width: 470, height: 270 } },
      { name: "aside", box: { width: 294, height: 270 } },
      { name: "footer", box: { width: 764, height: 174 } },
    ],
    compose: (r) =>
      page(
        el({ display: "flex", flexDirection: "column", flex: "1" }, [
          el({ display: "flex", flex: "3", borderBottom: BORDER }, [
            cell({ flex: "1.6", borderRight: BORDER }, r.main),
            cell({ flex: "1" }, r.aside),
          ]),
          cell({ flex: "2" }, r.footer),
        ]),
      ),
  },

  agenda: {
    id: "agenda",
    slots: [
      { name: "header", box: { width: 764, height: 104 } },
      { name: "body", box: { width: 764, height: 340 } },
    ],
    compose: (r) =>
      page(
        el({ display: "flex", flexDirection: "column", flex: "1" }, [
          cell({ flex: "0 0 104px", borderBottom: BORDER }, r.header),
          cell({ flex: "1" }, r.body),
        ]),
      ),
  },

  "split-2": {
    id: "split-2",
    slots: [
      { name: "left", box: { width: 382, height: 444 } },
      { name: "right", box: { width: 382, height: 444 } },
    ],
    compose: (r) =>
      page(
        el({ display: "flex", flex: "1" }, [
          cell({ flex: "1", borderRight: BORDER }, r.left),
          cell({ flex: "1" }, r.right),
        ]),
      ),
  },

  "grid-4": {
    id: "grid-4",
    slots: [
      { name: "top-left", box: { width: 382, height: 222 } },
      { name: "top-right", box: { width: 382, height: 222 } },
      { name: "bottom-left", box: { width: 382, height: 222 } },
      { name: "bottom-right", box: { width: 382, height: 222 } },
    ],
    compose: (r) =>
      page(
        el({ display: "flex", flexDirection: "column", flex: "1" }, [
          el({ display: "flex", flex: "1", borderBottom: BORDER }, [
            cell({ flex: "1", borderRight: BORDER }, r["top-left"]),
            cell({ flex: "1" }, r["top-right"]),
          ]),
          el({ display: "flex", flex: "1" }, [
            cell({ flex: "1", borderRight: BORDER }, r["bottom-left"]),
            cell({ flex: "1" }, r["bottom-right"]),
          ]),
        ]),
      ),
  },
};
