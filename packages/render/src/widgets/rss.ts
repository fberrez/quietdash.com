import type { RssConfig, RssData } from "@quietdash/shared";
import { el, text } from "../el.js";
import { SANS, charsPerLine, kicker, shell, truncate } from "./style.js";
import type { WidgetModule } from "./types.js";

/** A few headlines from a feed. Titles + source, no bodies (calm). */
export const rssWidget: WidgetModule<RssConfig, RssData> = {
  type: "rss",
  dataSource: "rss",
  render({ config, data, box }) {
    const items = (data?.items ?? []).slice(0, config.maxItems);
    const titleChars = charsPerLine(box, 19, 70);

    const rows = items.map((it) =>
      el({ display: "flex", flexDirection: "column", marginBottom: "11px" }, [
        text({ display: "flex", fontFamily: SANS, fontWeight: "700", fontSize: "19px", lineHeight: "1.2" }, truncate(it.title, titleChars)),
        text({ display: "flex", fontFamily: SANS, fontSize: "14px" }, truncate(it.source, titleChars)),
      ]),
    );

    return shell([
      kicker("Feed"),
      el(
        { display: "flex", flexDirection: "column", flex: "1" },
        rows.length ? rows : [text({ display: "flex", fontFamily: SANS, fontSize: "19px" }, "No items")],
      ),
    ]);
  },
};
