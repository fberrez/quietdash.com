# Dashboard layout schema (the open contract)

A dashboard's `layout` is a stable, hand-authorable JSON document. The studio
editor writes it, but you can also `PUT /api/dashboards/:id` with your own. It
is validated server-side by the zod schema in
`packages/shared/src/layout.ts` (`dashboardLayout`). Bump `version` on any
breaking change.

## Shape

```jsonc
{
  "version": 1,
  "layoutId": "desk-focus",          // one of the layouts below
  "slots": {                          // slot name -> one widget
    "main":   { "type": "clock",  "config": { "format": "24h", "seconds": false } },
    "aside":  { "type": "weather","config": { "connectorId": "<id>", "units": "metric" } },
    "footer": { "type": "agenda", "config": { "connectorId": "<id>", "maxEvents": 4 } }
  }
}
```

A slot may be omitted (it renders empty). A slot name that is not part of
`layoutId` is rejected.

## Layouts and their slots

Slot geometry (pixel boxes) lives in `packages/render/src/layouts/`. Slot
*names* are fixed here:

| `layoutId`   | slots                                                  |
|--------------|--------------------------------------------------------|
| `single-big` | `main`                                                 |
| `desk-focus` | `main`, `aside`, `footer`                              |
| `agenda`     | `header`, `body`                                       |
| `split-2`    | `left`, `right`                                        |
| `grid-4`     | `top-left`, `top-right`, `bottom-left`, `bottom-right` |

## Widgets and their config

| `type`    | data source        | config fields (defaults)                                   |
|-----------|--------------------|------------------------------------------------------------|
| `clock`   | none               | `format` `"24h"`\|`"12h"` (`24h`), `seconds` bool (`false`) |
| `date`    | none               | `style` `"long"`\|`"short"` (`long`)                        |
| `notes`   | none               | `text` string ≤500 (`""`)                                   |
| `focus`   | none               | `workMinutes` int (`25`), `breakMinutes` int (`5`)         |
| `weather` | openweather conn.  | `connectorId` str, `units` `"metric"`\|`"imperial"` (`metric`) |
| `agenda`  | ics connector      | `connectorId` str, `maxEvents` 1–10 (`4`)                  |
| `tasks`   | local task list    | `listId` str? (first list), `maxItems` 1–12 (`6`)          |
| `rss`     | rss connector      | `connectorId` str, `maxItems` 1–8 (`5`)                    |

`connectorId` references a connector created via `POST /api/connectors`
(weather needs a bring-your-own OpenWeather key; agenda/rss take a public URL).

## Rotation

A device can rotate dashboards by schedule. `PUT /api/devices/:id/playlist`:

```jsonc
{
  "timezone": "Europe/Paris",
  "defaultDashboardId": "<id>",       // shown outside every window
  "entries": [
    { "dashboardId": "<id>", "days": [1,2,3,4,5], "startMinute": 540, "endMinute": 1020 }
  ]
}
```

`days` are `0=Sun..6=Sat` (empty = every day); minutes are since local midnight
(a window may wrap past midnight). The server shows the first matching window,
else the default, else the device's assigned dashboard.
