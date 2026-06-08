import type { WeatherConfig, WeatherData } from "@quietdash/shared";
import { el, text } from "../el.js";
import { MONO, SANS, kicker, shell, truncate } from "./style.js";
import type { WidgetModule } from "./types.js";

const round = (n: number) => Math.round(n);
const toF = (c: number) => (c * 9) / 5 + 32;

/** Current conditions + today's range. Glanceable, no live graph. */
export const weatherWidget: WidgetModule<WeatherConfig, WeatherData> = {
  type: "weather",
  dataSource: "openweather",
  render({ config, data, box }) {
    if (!data) {
      return shell([kicker("Weather"), text({ display: "flex", fontFamily: SANS, fontSize: "20px" }, "No data")]);
    }
    const unit = config.units === "imperial" ? "°F" : "°C";
    const conv = (c: number) => (config.units === "imperial" ? toF(c) : c);
    const big = Math.max(40, Math.floor(Math.min(box.height * 0.4, box.width * 0.26)));

    return shell([
      kicker(truncate(data.location, 22)),
      el({ display: "flex", flex: "1", flexDirection: "column", justifyContent: "center" }, [
        el({ display: "flex", alignItems: "flex-start" }, [
          text({ display: "flex", fontFamily: MONO, fontWeight: "700", fontSize: `${big}px`, lineHeight: "1" }, `${round(conv(data.tempC))}`),
          text({ display: "flex", fontFamily: MONO, fontSize: `${Math.floor(big * 0.3)}px`, marginTop: "6px" }, unit),
        ]),
        text({ display: "flex", fontFamily: SANS, fontSize: "22px", marginTop: "8px" }, truncate(data.condition, 28)),
        text(
          { display: "flex", fontFamily: SANS, fontSize: "18px", marginTop: "4px" },
          `H ${round(conv(data.high))}°  L ${round(conv(data.low))}°`,
        ),
      ]),
    ]);
  },
};
