import type { AgendaConfig, AgendaData } from "@quietdash/shared";
import { el, text } from "../el.js";
import { MONO, SANS, charsPerLine, kicker, shell, truncate } from "./style.js";
import type { WidgetModule } from "./types.js";

/** Next few calendar events: time + title. */
export const agendaWidget: WidgetModule<AgendaConfig, AgendaData> = {
  type: "agenda",
  dataSource: "ics",
  render({ config, data, box, timezone }) {
    const events = (data?.events ?? []).slice(0, config.maxEvents);
    const titleChars = charsPerLine(box, 19, 130);

    const rows = events.map((ev) => {
      const when = ev.allDay
        ? "all day"
        : new Intl.DateTimeFormat("en-GB", { timeZone: timezone, hour: "2-digit", minute: "2-digit" }).format(
            new Date(ev.start),
          );
      return el({ display: "flex", alignItems: "baseline", marginBottom: "10px" }, [
        text({ display: "flex", fontFamily: MONO, fontSize: "18px", fontWeight: "700", width: "92px" }, when),
        text({ display: "flex", fontFamily: SANS, fontSize: "19px" }, truncate(ev.title, titleChars)),
      ]);
    });

    return shell([
      kicker("Agenda"),
      el(
        { display: "flex", flexDirection: "column", flex: "1" },
        rows.length ? rows : [text({ display: "flex", fontFamily: SANS, fontSize: "19px" }, "Nothing scheduled")],
      ),
    ]);
  },
};
