import type { TasksConfig, TasksData } from "@quietdash/shared";
import { el, text } from "../el.js";
import { MONO, SANS, charsPerLine, kicker, shell, truncate } from "./style.js";
import type { WidgetModule } from "./types.js";

/** Local todo list: checkbox + title, done items marked. */
export const tasksWidget: WidgetModule<TasksConfig, TasksData> = {
  type: "tasks",
  dataSource: "tasks",
  render({ config, data, box }) {
    const items = (data?.items ?? []).slice(0, config.maxItems);
    const titleChars = charsPerLine(box, 19, 80);

    const rows = items.map((it) =>
      el({ display: "flex", alignItems: "baseline", marginBottom: "9px" }, [
        text({ display: "flex", fontFamily: MONO, fontSize: "18px", fontWeight: "700", marginRight: "10px" }, it.done ? "[x]" : "[ ]"),
        text(
          {
            display: "flex",
            fontFamily: SANS,
            fontSize: "19px",
            ...(it.done ? { textDecoration: "line-through" } : {}),
          },
          truncate(it.title, titleChars),
        ),
      ]),
    );

    return shell([
      kicker("Tasks"),
      el(
        { display: "flex", flexDirection: "column", flex: "1" },
        rows.length ? rows : [text({ display: "flex", fontFamily: SANS, fontSize: "19px" }, "All clear")],
      ),
    ]);
  },
};
