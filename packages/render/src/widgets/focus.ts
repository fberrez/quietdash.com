import type { FocusConfig } from "@quietdash/shared";
import { el, text } from "../el.js";
import { INK, MONO, SANS, kicker, shell } from "./style.js";
import type { WidgetModule } from "./types.js";

/**
 * Focus / Pomodoro. e-ink refreshes too slowly to tick a live timer, so this
 * presents the method as a calm card (work/break intervals) rather than a
 * running countdown. Glanceable, not interactive.
 */
export const focusWidget: WidgetModule<FocusConfig, never> = {
  type: "focus",
  render({ config, box }) {
    const num = Math.max(28, Math.floor(Math.min(box.height * 0.32, box.width * 0.16)));
    const pair = (value: number, label: string) =>
      el({ display: "flex", flexDirection: "column", alignItems: "center" }, [
        text({ display: "flex", fontFamily: MONO, fontWeight: "700", fontSize: `${num}px`, lineHeight: "1" }, String(value)),
        text({ display: "flex", fontFamily: SANS, fontSize: "16px", marginTop: "6px" }, label),
      ]);

    return shell([
      kicker("Focus"),
      el({ display: "flex", flex: "1", alignItems: "center", justifyContent: "space-around" }, [
        pair(config.workMinutes, "min focus"),
        text({ display: "flex", fontFamily: MONO, fontSize: `${Math.floor(num * 0.5)}px`, color: INK }, "/"),
        pair(config.breakMinutes, "min break"),
      ]),
    ]);
  },
};
