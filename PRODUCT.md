# PRODUCT.md — QuietDash (product repo)

This repo is the product: the self-hosted server, the config studio, the device client,
the renderer, the connectors. Marketing and the waitlist live in a separate repo.

## What QuietDash is

A calm e-ink ambient dashboard for the desk. A Waveshare 7.5" panel (800x480, 1-bit)
driven by a Raspberry Pi, showing the few things you actually track, rendered as dithered
ink. No glow, no notifications, no feed. The opposite of a phone.

## Positioning (the wedge)

The competitor that owns this space is TRMNL. Open-source, self-hostable, one-way image
polling, ~900 plugins, hosted for free, ~150 USD. We do not win by being "also open-source
and self-hostable". TRMNL already is. We win on the one axis they cannot follow without
abandoning their identity.

TRMNL's whole design follows from one choice: ESP32 + months of battery. That choice traps
them: the device is too weak to host anything, so the cloud is mandatory and self-host (BYOS)
is explicitly second-class and gated behind a 50 USD license; there is no local compute, so
it shows pre-rendered images only, refreshes slowly, and has zero interactivity; and the
plugin marketplace grows by quantity, so quality drifts.

QuietDash is the exact inverse of that compromise. Two pillars:

### 1. Local by construction (the moat)

The Pi is not a dumb client waiting for a cloud image. The Pi is the server. You open
`http://quietdash.local`, configure it, it renders locally, the panel displays. No cloud,
no account, no license. Nothing leaves your LAN by default. If the company disappears
tomorrow, nothing changes for the user. This is what an ESP32 cannot do, and what makes us
local-by-construction where TRMNL is cloud-by-default-with-self-host-as-a-downgrade.

### 2. A few widgets, designed (the taste)

TRMNL sells quantity (900+ plugins, "who is this even for"). We sell rightness: a small set
of widgets thought of as a whole, with a 1-bit render that is actually beautiful, not merely
functional. Calm means fewer things done better. This is not copyable for them: the
marketplace is their growth engine, they will not curate it down.

## The trade-off we own honestly

Going Pi and mains-powered, we lose TRMNL's number one feature: months of battery, place it
anywhere. We do not apologize for it. Battery-for-months serves a family board on the fridge.
QuietDash is a desk object, and a desk has a power outlet. Plugged in buys what TRMNL will
never have: always fresh, fast refresh, local rendering, and one day interactivity.
"Plugged in but alive" against "on battery but frozen." A category choice, not a weakness.

## Working line

Your dashboard, rendered on your desk, owned by you. Not a plugin store in the cloud.

## Users

- Primary: calm-tech / digital-minimalism people who want to look at their phone less.
  Wellbeing and focus lead, not the dev-tool angle.
- Secondary: indie makers / tinkerers who self-host on a Pi. Real credibility, not the
  headline audience.

## Tone rules (carried from the brand)

Honest, raw, human indie-maker. Anti-hype. Plain language. No SaaS hype, no fake urgency.
No em dashes (use commas, colons, periods, parentheses).
