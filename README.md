# QuietDash

A small e-ink screen for your desk. It shows the few numbers you actually care about, then it sits there quietly. No glow, no notifications, no reason to keep checking it.

**[quietdash.com →](https://quietdash.com)**

## What it is

QuietDash drives a Waveshare 7.5" e-Paper display (800×480, black and white) from a Raspberry Pi. You pick a handful of widgets, the screen renders them, and it refreshes a few times an hour. That's it. The whole point is a screen you stop noticing.

It started as a thing for my own desk. I posted it on Reddit, around 100 people asked to be told when it was ready, and now I'm building it out properly.

## What's on it

- A workday progress ring so you can see how much of the day is left at a glance
- Today's tasks
- Weather
- Calendar
- Time and date
- A news/RSS line

Widgets are configurable in position and size within the 800×480 frame.

## Why e-ink

A backlit screen is one more thing pulling at you. E-ink doesn't glow and doesn't move, so it reads like paper on the desk. You look when you want to, not when it pings you, because it never pings you.

## Run it yourself

QuietDash is open source and self-hostable. One server renders your dashboard, one or more Pi devices pull the image and show it. The server can run on the Pi itself (all in one) or on any machine on your network. Nothing leaves your LAN by default.

Repo layout:

- `apps/server` - Node server: renders the 1-bit image, the API, serves the studio (SQLite, no cloud)
- `apps/studio` - the web app where you log in, pair devices, and arrange your dashboard
- `packages/render` - the 1-bit dithered renderer, shared by server and studio
- `device/` - the Python client that runs on the Pi and drives the panel

### Server and studio

Needs Node 22+ and pnpm 10+.

```bash
pnpm install
pnpm --filter @quietdash/studio build      # build the web app
pnpm --filter @quietdash/server start      # API + studio on http://localhost:3000
```

Open http://localhost:3000 and set a password. For studio development with hot reload, run the server in one terminal and `pnpm --filter @quietdash/studio dev` in another (it proxies the API).

### Pair a device

On a Raspberry Pi with the Waveshare panel:

```bash
# point it at your server; it shows a QR on the panel
QUIETDASH_SERVER_URL=http://<server-ip>:3000 python3 device/quietdash_device.py
```

Scan the QR with your phone, approve the device in the studio, and the panel starts showing your dashboard. If the Pi has no network yet, it opens its own setup hotspot and a QR to join WiFi first. Full hardware walkthrough is in `device/PI-TEST.md`, device details in `device/README.md`.

### Self-host or hosted

- `AUTH_MODE=single-password` (default): one instance, one password, the Pi can be the server.
- `AUTH_MODE=multi-user`: accounts, where each person sees only their own devices. For a hosted version.

## Status

I'm building this in the open-ish. The marketing site and waitlist are live at [quietdash.com](https://quietdash.com). If you'd like to be told when it ships, the waitlist is the place.

## License

TBD.
