# QuietDash device client

Thin client for the Waveshare 7.5" V2 panel. Pulls the server-rendered 1-bit PNG
and shows it. No rendering or secrets live here (D7).

## Onboarding (now): WiFi → pairing

On boot the device runs two steps before it can display a dashboard:

1. **WiFi (S0, Phase 2).** If there's no network, the Pi becomes its own open AP
   `QuietDash-XXXX` and shows a QR that joins it. Your phone lands on a captive
   portal, you pick the home WiFi, the Pi connects. Pi-only (NetworkManager); a
   no-op when already networked or off-Pi. See `provisioning.py`.
2. **Pairing (S1→S2, Phase 1).** Discovers a server (mDNS, or `QUIETDASH_SERVER_URL`),
   opens a pairing, shows a **QR claim screen**. Scan it, approve in the studio,
   the device stores the issued token and starts pulling. If the token is later
   revoked (Unpair), it drops back to the QR screen automatically.

The WiFi step needs **root** (nmcli + binding port 80 for the portal); the
systemd unit runs as root by default.

```bash
cp .env.example .env          # leave SERVER_URL empty to auto-discover
python3 quietdash_device.py   # laptop: writes screens to QUIETDASH_OUT_FILE
```

No `zeroconf`/`qrcode`/`Pillow`? It still works for dev: set `QUIETDASH_SERVER_URL`
to skip discovery, and the claim URL is printed instead of drawn.

On a Raspberry Pi with the panel:

1. Enable SPI: `sudo raspi-config` → Interface Options → SPI → enable.
2. Install Pillow and the Waveshare driver:
   ```bash
   pip3 install -r requirements.txt
   # waveshare_epd is not on PyPI — install from:
   #   https://github.com/waveshareteam/e-Paper  (RaspberryPi/python/lib)
   ```
3. Run, or install the systemd unit:
   ```bash
   sudo cp quietdash-device.service /etc/systemd/system/
   sudo systemctl enable --now quietdash-device.service
   journalctl -u quietdash-device.service -f
   ```

## Later (Phase 1/2)

Replaces the fixed token with onboarding: AP-mode WiFi captive portal → mDNS
server discovery → QR claim screen on the panel → approve in the studio →
device receives an issued token and starts pulling. See the tracking issue.
