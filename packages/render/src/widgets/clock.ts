import type { ClockConfig } from "@quietdash/shared";
import { el, text } from "../el.js";
import { INK, MONO, PAPER } from "./style.js";
import type { WidgetModule } from "./types.js";

/** The clock: big monospace time, the calm centerpiece. */
export const clockWidget: WidgetModule<ClockConfig, never> = {
  type: "clock",
  render({ config, now, box, timezone }) {
    const time = new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      ...(config.seconds ? { second: "2-digit" } : {}),
      hour12: config.format === "12h",
    }).format(now);

    // Scale the digits to the slot; smaller when seconds widen the string.
    const widthChars = config.seconds ? 8 : 5;
    const byWidth = (box.width * 0.92) / (widthChars * 0.62);
    const byHeight = box.height * 0.6;
    const size = Math.max(40, Math.floor(Math.min(byWidth, byHeight)));

    return el(
      {
        display: "flex",
        width: "100%",
        height: "100%",
        backgroundColor: PAPER,
        color: INK,
        alignItems: "center",
        justifyContent: "center",
      },
      [
        text(
          {
            display: "flex",
            fontFamily: MONO,
            fontWeight: "700",
            fontSize: `${size}px`,
            lineHeight: "1",
            letterSpacing: "-2px",
          },
          time,
        ),
      ],
    );
  },
};
