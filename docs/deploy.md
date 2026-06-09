# Deploying QuietDash

Two topologies, one image (D3). The **server** (studio + render + connectors +
pairing) runs in Docker; the **device** (Python + e-ink panel) is installed
separately because it needs GPIO/SPI and can't be containerized.

- **All-in-one** — run the server container *on the Pi itself*; the device client
  runs on the same Pi and discovers `localhost`.
- **Separate server** — run the container on a home server / NAS; thin devices on
  the LAN discover it over mDNS.

## Server (Docker)

```bash
docker compose up -d            # builds apps/server/Dockerfile, serves on :3000
docker compose logs -f          # watch boot (migrations + mDNS advert)
```

Open `http://<host>:3000`, set the instance password on first run, then pair a
device (its panel shows a QR → approve in the studio).

The image builds the studio bundle and runs the server from TS source via `tsx`
(no server build step — D8). Migrations and first-run seeding happen on boot, so
there is nothing to run by hand.

### Configuration

Set these in `docker-compose.yml` under `environment:` (defaults in parentheses):

| Var | Purpose |
|---|---|
| `QUIETDASH_PORT` (`3000`) | HTTP port inside the container |
| `QUIETDASH_DATA_DIR` (`/data`) | SQLite location; back this volume up |
| `AUTH_MODE` (`single-password`) | `single-password` self-host, or `multi-user` cloud |
| `QUIETDASH_INSTANCE_NAME` (`QuietDash`) | name shown in the studio + mDNS |
| `QUIETDASH_SECRET_KEY` (derived) | 64 hex chars; encrypts connector API keys at rest. Set it explicitly if you want the data dir to be portable across instances. |

The SQLite database lives on the `quietdash-data` named volume — it survives
`docker compose down/up`. Use `docker compose down -v` only when you intend to
wipe it.

### mDNS discovery (`_quietdash._tcp`) needs host networking

Devices auto-discover the server via mDNS, which is multicast and **does not cross
the default Docker bridge**. For the separate-server box, run the container on the
host network so the advert reaches the LAN:

```yaml
services:
  server:
    # ...
    network_mode: host        # publishes _quietdash._tcp on the LAN; drop the `ports:` block
```

Without host networking the server still works — devices just can't find it
automatically, so pin the address on the device with `QUIETDASH_SERVER_URL`
(e.g. `http://192.168.1.50:3000`) instead. (The mDNS advert is best-effort; a
bridged container simply skips it.)

## Device (Raspberry Pi)

On a fresh Pi, from a checkout of this repo:

```bash
cd device
sudo ./install.sh                          # auto-discover the server via mDNS
# or pin it:
sudo ./install.sh http://192.168.1.50:3000
```

`install.sh` installs the OS + Python deps (`hostapd`, `dnsmasq`, `zeroconf`,
`qrcode`, `Pillow`), copies the client to `/opt/quietdash/device`, and enables a
root systemd service (`quietdash-device`). It runs as root because headless WiFi
provisioning drives `nmcli`/`hostapd`/`iptables` and binds port 80.

```bash
journalctl -u quietdash-device -f          # follow the device
```

The Waveshare e-Paper driver (`waveshare_epd`) is not on PyPI — install it from
<https://github.com/waveshareteam/e-Paper> and enable SPI (`raspi-config`). See
`device/README.md` for the onboarding flow (WiFi → mDNS/picker → QR pairing) and
`PI-TEST.md` for hardware bring-up notes.
