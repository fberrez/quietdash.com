import type { WeatherData } from "@quietdash/shared";
import type { Connector } from "./types.js";

export interface OpenWeatherConfig {
  /** city query, e.g. "Paris,FR" or "London" */
  location: string;
}

interface OwmResponse {
  name: string;
  main: { temp: number; temp_min: number; temp_max: number };
  weather: { main: string; description: string }[];
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * OpenWeather current conditions (bring-your-own key, D9). Always queried in
 * metric so `tempC` is Celsius; the widget converts for display.
 */
export const openWeatherConnector: Connector<OpenWeatherConfig, WeatherData> = {
  kind: "openweather",
  async fetch(cfg, secret) {
    if (!secret) throw new Error("OpenWeather needs an API key");
    const url = new URL("https://api.openweathermap.org/data/2.5/weather");
    url.searchParams.set("q", cfg.location);
    url.searchParams.set("units", "metric");
    url.searchParams.set("appid", secret);

    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`OpenWeather ${res.status}: ${body.slice(0, 120) || res.statusText}`);
    }
    const data = (await res.json()) as OwmResponse;
    const w = data.weather[0];
    return {
      tempC: data.main.temp,
      condition: w ? cap(w.description) : "",
      icon: w ? w.main.toLowerCase() : "clear",
      high: data.main.temp_max,
      low: data.main.temp_min,
      location: data.name,
    };
  },
};
