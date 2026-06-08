import type { DateConfig } from "@quietdash/shared";
import { el, text } from "../el.js";
import { INK, PAPER, SANS } from "./style.js";
import type { WidgetModule } from "./types.js";

/** The date: weekday + day/month, glanceable. */
export const dateWidget: WidgetModule<DateConfig, never> = {
  type: "date",
  render({ config, now, box, timezone }) {
    const long = config.style === "long";
    const weekday = new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone,
      weekday: long ? "long" : "short",
    }).format(now);
    const rest = new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone,
      day: "numeric",
      month: long ? "long" : "short",
      ...(long ? { year: "numeric" } : {}),
    }).format(now);

    const size = Math.max(20, Math.floor(Math.min(box.height * 0.22, box.width * 0.09)));

    return el(
      {
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        backgroundColor: PAPER,
        color: INK,
        alignItems: "center",
        justifyContent: "center",
      },
      [
        text({ display: "flex", fontFamily: SANS, fontWeight: "700", fontSize: `${size}px` }, weekday),
        text(
          { display: "flex", fontFamily: SANS, fontWeight: "400", fontSize: `${Math.floor(size * 0.7)}px`, marginTop: "4px" },
          rest,
        ),
      ],
    );
  },
};
