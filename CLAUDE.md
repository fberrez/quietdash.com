# QuietDash

Local-by-construction e-ink dashboard. A Node/TypeScript server renders 800×480
1-bit images; thin Python clients (Raspberry Pi + Waveshare 7.5" panel) pull and
display them. One architecture covers both the all-in-one Pi and the
separate-server topologies.

The canonical context for this repo — read it before making architectural calls:

@DECISIONS.md

## Working notes

- Monorepo: `apps/server` (Hono + Drizzle/SQLite), `apps/studio` (Vite/React),
  `packages/render` (satori → resvg → Atkinson dither → 1-bit PNG, shared),
  `device/` (Python thin client + pairing state machine).
- Renderer and server consume `@quietdash/*` packages as TS source via `tsx`
  (no build step); the studio is served from `apps/studio/dist`.
- The pairing + multi-tenant design and roadmap live in GitHub issue #1.
- The dashboard/widget product surface: curated layouts + per-slot widgets,
  server-side connectors (BYO-key), a studio editor with server-rendered
  preview, and time-based rotation. The public layout contract is
  `docs/layout-schema.md`; adding a widget is `docs/widgets.md`.
