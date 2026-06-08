import type { NotesConfig } from "@quietdash/shared";
import { el, text } from "../el.js";
import { SANS, shell } from "./style.js";
import type { WidgetModule } from "./types.js";

/** A pinned note. Zero config beyond the text; calm filler for a slot. */
export const notesWidget: WidgetModule<NotesConfig, never> = {
  type: "notes",
  render({ config, box }) {
    const size = Math.max(18, Math.floor(Math.min(box.height * 0.16, box.width * 0.06)));
    return shell([
      el({ display: "flex", flex: "1", alignItems: "center" }, [
        text(
          { display: "flex", fontFamily: SANS, fontWeight: "400", fontSize: `${size}px`, lineHeight: "1.35" },
          config.text || "",
        ),
      ]),
    ]);
  },
};
