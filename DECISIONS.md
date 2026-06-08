# DECISIONS.md — architecture

Running log of the choices that shape the product repo. Newest decisions appended.
Each entry: the decision, the reasoning, and what it rules out.

## D1. Build from scratch, ignore the prototype repo

The old `quietdash` monorepo (api/web/raspberry-pi) was the validation prototype. We do not
port it. We design the connectivity and the dashboard fresh. The prototype is reference only.

## D2. Local by construction (positioning)

The architecture must let the end user self-host the whole thing and connect their own
hardware, with the Pi able to be the server itself. This is the moat, not a feature flag.

## D3. Topology: one server, one-or-more devices that pull

```
[ Server (Docker, or on the Pi itself) ]  <-- LAN -->  [ Pi + e-ink panel ]
  studio UI + render + connectors                       thin client: pull image, display
```

"Everything on one Pi" is just the case where server and device are the same machine.
There is one architecture, covering both the home-server and the single-Pi setups.

## D4. Server in Node / TypeScript

One language across server and studio UI (React). The device client stays Python (Waveshare
library is Python). Rules out a Go/Rust/Python server for now.

## D5. Single-user first

The self-hosted instance is protected by one password. No multi-account, no orgs, no roles.
Multi-user is strictly a concern of the future hosted version, not this codebase yet.

## D6. SQLite, not Postgres

For self-host ergonomics: one file, no extra container, runs on a Pi. The ORM keeps Postgres
possible later for the hosted version, but the default and the only thing we test on a device
is SQLite.

## D7. Server-side rendering, device is a thin client

The server produces the 800x480 1-bit image. The device does `GET image` and pushes it to the
panel. No secrets and no external API keys on the device. Render bugs are fixed server-side
without touching deployed devices. (The "server" here is local, so this is not a cloud
dependency: see D2.)

## D8. Renderer: satori + resvg + 1-bit dithering

JSX/HTML -> SVG (satori) -> PNG (resvg) -> dither to 1-bit. Pure JS, no native deps, embeds
trivially in Docker and on a Pi. Critically, the same satori runs in the browser for the
studio preview, so preview and device output are guaranteed identical. Rules out node-canvas
(painful native deps) and headless-browser rendering (too heavy for a Pi).

The renderer must be graphically good, not merely functional. It is a brand pillar, not a
technical detail.

## D9. Connectors live server-side, bring-your-own-key

External integrations (weather, calendar, etc.) run on the server. The user supplies their
own API keys in the studio, stored encrypted with a key from the environment. Caching and
rate-limiting are server-side. Rules out the device talking to external APIs directly.

## D10. Hardware target and enclosure

Panel: Waveshare 7.5" V2, 800x480, 1-bit black and white. We stay black and white on
purpose (the dithered 1-bit render is the brand). We do not move to the nicer ready-made
color wooden frames on the market.

Compute: Raspberry Pi Zero 2 W is the floor (quad-core), because the Pi can also be the local
server (D3). A Pi Zero 1 is too weak for Node + SQLite + satori. If the device is only a thin
display client (server elsewhere), a Zero 2 W is comfortable.

Enclosure: there is no good retail wooden frame for the 7.5" black and white panel (the nice
ones are color), so we make our own. Two phases: a laser-cut birch plywood prototype (stacked
layers gluing into a cavity for the electronics), then a finished small series in solid wood
once the geometry is locked. Sourcing, supplier contacts, and the detailed enclosure brief are
kept in the private repo.

## D11. Tenant-ready schema, single-user runtime, auth-mode flag

Refines D5. The self-hosted runtime stays single-user (one instance password, no
accounts), but the database carries `ownerId` on every owned resource from the first
migration, and an `AUTH_MODE` flag switches behaviour: `single-password` (self-host,
one implicit seeded user) vs `multi-user` (the future cloud, registration + per-user
isolation). "Single-tenant is multi-tenant with N=1." Cloud multi-tenancy then becomes
a config flip plus a registration UI, not a schema rewrite. Rules out stripping the
`ownerId` columns as dead weight. Isolation rule: every studio query is scoped
`WHERE ownerId = me`; no handler trusts a bare `:id`.

## D12. Server stack: Hono + Drizzle + better-sqlite3

The Node server (D4) uses Hono (tiny, fast, runs on a Pi Zero 2 W, serves the studio
static + API in one process) over the prototype's NestJS, which is overkill for
single-user and heavier on ARM. ORM is Drizzle on better-sqlite3: SQLite-first (D6),
no heavy query-engine binary, keeps the Postgres dialect open for the hosted version.
Rules out NestJS + Prisma for this codebase.

## Proposed repo layout

```
apps/
  server/        # API + render + connectors + serves the studio (Node, SQLite)
  studio/        # web config app + 800x480 layout editor + 1-bit preview
device/          # thin Pi client + installer + systemd service (Python)
packages/
  render/        # 1-bit engine (satori + resvg + dither), shared by server and studio
  connectors/    # external integrations, bring-your-own-key
docker-compose.yml
```

## First milestone

The local loop, end to end, on the existing Pi on the LAN, with one dummy widget (the
clock): server in Docker -> render 1-bit -> the Pi pulls -> it shows on the panel. Once that
loop is alive, real widgets, the layout editor, connectors, and proper pairing graft onto it
without re-litigating the architecture.

**Status (Phase 0 scaffolded):** the loop is implemented and verified locally:
`packages/render` (satori -> resvg -> Atkinson dither -> 1-bit clock PNG) ->
`apps/server` (Hono + Drizzle/SQLite, `GET /api/device/image` with token auth, stamps
`lastSeenAt`) -> `device/` Python client pulls and displays (file-save fallback off-Pi).
Studio shell stands up. Remaining for the milestone: run on the real panel on the LAN, and
the server-in-Docker path. Pairing (QR/WiFi) is Phase 1/2, tracked in issue #1.
