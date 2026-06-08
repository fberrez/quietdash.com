# Bring your own widget

QuietDash widgets are small, pure, server-side render functions. There is no
plugin marketplace and no runtime-uploaded code (the calm/self-host ethos, and
no sandbox attack surface): you add a widget by contributing a module to
`packages/render` in a PR. It is auditable, type-checked, and renders
identically in the studio preview and on the panel.

## The rule: widgets do no I/O

A widget is a pure function `(ctx) => SatoriNode`. It never fetches anything.
The server resolves data (connectors, local tasks) *before* render and passes
it in as `ctx.data`. This is what makes preview == device and keeps widgets
trivially testable.

```ts
interface WidgetContext<C, D> {
  config: C;        // validated per-widget config from the layout JSON
  data: D | null;   // server-resolved data, or null if unavailable
  now: Date;        // real clock; format for display with `timezone`
  box: { width: number; height: number }; // slot size, to scale text
  timezone: string; // IANA tz
}
```

## Add a widget in four steps

1. **Config** — add a zod object + a union member in
   `packages/shared/src/layout.ts` (`WIDGET_TYPES`, `widgetInstance`), and a
   `<Type>Config` export.
2. **Render** — create `packages/render/src/widgets/<type>.ts` exporting a
   `WidgetModule`. Use the helpers in `widgets/style.ts` (`shell`, `kicker`,
   `truncate`, `charsPerLine`) and `el.ts`. Register it in
   `packages/render/src/widgets/index.ts`.
3. **Data (optional)** — if it needs external data, set `dataSource` on the
   module and add a connector under `packages/connectors` whose normalized
   output type lives in `@quietdash/shared` (so widget `data` and connector
   `Out` agree). Wire the kind into `resolveConnector` in
   `apps/server/src/render-pipeline.ts`.
4. **Studio** — add a label + default to `apps/studio/src/lib/widgets.ts` and,
   if it has config, a case in `DashboardEditor`'s `WidgetConfig`.

## 1-bit design rules

The panel is pure black on white (Atkinson-dithered, D10). For crisp output:

- Use `#000` on `#fff`. Do not rely on gray — midtones dither; near-black and
  near-white snap hard (the FLAT_BAND in `dither.ts`).
- Size text from `ctx.box` and truncate server-side (satori has no ellipsis).
- Mono (`IBM Plex Mono`) for numerics/labels; `Atkinson Hyperlegible` for body.
- Glanceable beats live: the panel refreshes on a cadence, not continuously.

Smoke-render your widget in every layout's smallest slot (see
`packages/render/src/smoke-dash.ts`) before opening a PR.
