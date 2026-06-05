#!/usr/bin/env python3
"""
QuietDash device client (Phase 1: pairing).

State machine for a thin e-ink client (D7):

  S1 NOT PAIRED -> discover a server (mDNS, or QUIETDASH_SERVER_URL override),
                   POST /api/pair/init, show a QR claim screen on the panel,
                   poll /api/pair/status until the owner approves in the studio,
                   then store the issued token.
  S2 PAIRED     -> pull /api/device/image with the token and display it. If the
                   token is revoked (401, e.g. unpaired), drop it and re-pair.

No panel attached (laptop dev) -> screens are saved to a file / printed, so the
whole flow can be exercised anywhere. WiFi provisioning (AP captive portal) is
Phase 2; this assumes the device is already on the network.

Optional libs: zeroconf (mDNS discovery), qrcode + Pillow (on-panel QR screen).
Missing libs degrade gracefully (use the env override / print the URL).
"""
import io
import json
import os
import socket
import sys
import time
import urllib.error
import urllib.request
import uuid
from pathlib import Path

from provisioning import ensure_network

SERVER_OVERRIDE = os.environ.get("QUIETDASH_SERVER_URL", "").rstrip("/")
DEVICE_NAME = os.environ.get("QUIETDASH_DEVICE_NAME", socket.gethostname())
STATE_FILE = Path(os.environ.get("QUIETDASH_STATE_FILE", Path.home() / ".quietdash" / "state.json"))
REFRESH_SECONDS = int(os.environ.get("QUIETDASH_REFRESH_SECONDS", "300"))
OUT_FILE = os.environ.get("QUIETDASH_OUT_FILE", "/tmp/quietdash-latest.png")
DISCOVERY_TIMEOUT = float(os.environ.get("QUIETDASH_DISCOVERY_TIMEOUT", "5"))
POLL_INTERVAL = 3


# --------------------------------------------------------------------------- state
def load_state() -> dict:
    try:
        return json.loads(STATE_FILE.read_text())
    except Exception:
        return {}


def save_state(state: dict) -> None:
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    STATE_FILE.write_text(json.dumps(state, indent=2))


# --------------------------------------------------------------------------- http
def _post_json(url: str, payload: dict) -> dict:
    req = urllib.request.Request(
        url, data=json.dumps(payload).encode(), headers={"content-type": "application/json"}, method="POST"
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read())


def _get_json(url: str) -> dict:
    with urllib.request.urlopen(url, timeout=15) as resp:
        return json.loads(resp.read())


# --------------------------------------------------------------------------- discovery
def discover_server() -> str | None:
    if SERVER_OVERRIDE:
        return SERVER_OVERRIDE
    try:
        from zeroconf import Zeroconf, ServiceBrowser  # noqa: WPS433
    except Exception:
        print("[device] zeroconf not installed and no QUIETDASH_SERVER_URL; cannot find a server")
        return None

    found: list[str] = []

    class Listener:
        def add_service(self, zc, type_, name):
            info = zc.get_service_info(type_, name)
            if info and info.addresses:
                addr = socket.inet_ntoa(info.addresses[0])
                found.append(f"http://{addr}:{info.port}")

        def update_service(self, *_):
            pass

        def remove_service(self, *_):
            pass

    zc = Zeroconf()
    ServiceBrowser(zc, "_quietdash._tcp.local.", Listener())
    deadline = time.monotonic() + DISCOVERY_TIMEOUT
    while time.monotonic() < deadline and not found:
        time.sleep(0.2)
    zc.close()
    if found:
        print(f"[device] discovered server {found[0]}")
        return found[0]
    print("[device] no QuietDash server found on the network")
    return None


# --------------------------------------------------------------------------- panel
class FileBackend:
    def show(self, png: bytes) -> None:
        with open(OUT_FILE, "wb") as f:
            f.write(png)
        print(f"[device] saved {len(png)} bytes -> {OUT_FILE}")

    def sleep_message(self) -> None:
        print("[device] (file backend) idle")


class WaveshareBackend:
    def __init__(self, epd_module, Image):
        self.Image = Image
        self.epd = epd_module.EPD()
        self.epd.init()
        self.epd.Clear()

    def show(self, png: bytes) -> None:
        image = self.Image.open(io.BytesIO(png)).convert("1", dither=self.Image.Dither.NONE)
        buf = self.epd.getbuffer(image)
        # Re-init before every full refresh reloads the full waveform LUT, which
        # keeps blacks deep and prevents the gray/ghosted drift a bare repeated
        # display() falls into (matches display.py's push_full).
        self.epd.init()
        self.epd.display(buf)
        # A second full-refresh pass re-asserts the black pixels: the 7.5" V2
        # darkens measurably on a repeat full drive, deepening its near-charcoal
        # black. Cheap insurance at our (minutes) cadence.
        self.epd.display(buf)

    def sleep_message(self) -> None:
        self.epd.sleep()


def make_backend():
    try:
        from PIL import Image  # noqa: WPS433
        from waveshare_epd import epd7in5_V2  # noqa: WPS433

        return WaveshareBackend(epd7in5_V2, Image)
    except Exception as exc:
        print(f"[device] no panel ({exc!s}); file-save fallback -> {OUT_FILE}")
        return FileBackend()


# --------------------------------------------------------------------------- pairing screen
def build_pairing_png(server: str, code: str) -> bytes | None:
    """800x480 claim screen: QR of <server>/pair?code=, plus the typed fallback."""
    try:
        import qrcode  # noqa: WPS433
        from PIL import Image, ImageDraw  # noqa: WPS433
    except Exception:
        return None

    url = f"{server}/pair?code={code}"
    qr = qrcode.QRCode(box_size=9, border=2)
    qr.add_data(url)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="black", back_color="white").convert("1")

    canvas = Image.new("1", (800, 480), 1)
    qx = (800 - qr_img.width) // 2
    canvas.paste(qr_img, (qx, 60))
    draw = ImageDraw.Draw(canvas)
    draw.rectangle((1, 1, 798, 478), outline=0)
    title = "Scan to connect this panel"
    draw.text((400 - len(title) * 3, 30), title, fill=0)
    fallback = f"or open {server.split('://')[-1]}/pair  code {code}"
    draw.text((400 - len(fallback) * 3, 440), fallback, fill=0)

    buf = io.BytesIO()
    canvas.save(buf, format="PNG")
    return buf.getvalue()


def show_pairing_screen(backend, server: str, code: str) -> None:
    png = build_pairing_png(server, code)
    if png:
        backend.show(png)
        print(f"[device] showing pairing QR for code {code}")
    else:
        print(f"[device] PAIR: open {server}/pair?code={code}  (code {code})")


# --------------------------------------------------------------------------- flow
def pair(server: str, device_id: str, backend) -> str | None:
    """Init pairing, show the QR, poll until approved. Returns a token or None."""
    init = _post_json(
        f"{server}/api/pair/init",
        {"deviceId": device_id, "name": DEVICE_NAME, "fingerprint": device_id},
    )
    pairing_id, code = init["pairingId"], init["claimCode"]

    show_pairing_screen(backend, server, code)

    print("[device] waiting for approval in the studio...")
    while True:
        try:
            status = _get_json(f"{server}/api/pair/status?pairingId={pairing_id}")
        except urllib.error.URLError as exc:
            print(f"[device] poll failed: {exc.reason}", file=sys.stderr)
            time.sleep(POLL_INTERVAL)
            continue
        state = status.get("status")
        if state == "approved" and status.get("token"):
            print("[device] approved")
            return status["token"]
        if state in ("expired", "denied"):
            print(f"[device] pairing {state}; restarting")
            return None
        time.sleep(POLL_INTERVAL)


def fetch_image(server: str, token: str) -> bytes:
    req = urllib.request.Request(f"{server}/api/device/image", headers={"Authorization": f"Bearer {token}"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read()


def steady_loop(server: str, token: str, backend) -> str:
    """Pull + display until the token is revoked. Returns 'revoked' or 'error'."""
    while True:
        try:
            backend.show(fetch_image(server, token))
        except urllib.error.HTTPError as exc:
            if exc.code == 401:
                print("[device] token revoked; re-pairing")
                return "revoked"
            print(f"[device] HTTP {exc.code}: {exc.reason}", file=sys.stderr)
        except urllib.error.URLError as exc:
            print(f"[device] server unreachable: {exc.reason}", file=sys.stderr)
        time.sleep(REFRESH_SECONDS)


def main() -> int:
    state = load_state()
    device_id = state.get("device_id") or str(uuid.uuid4())
    if "device_id" not in state:
        state["device_id"] = device_id
        save_state(state)
    print(f"[device] QuietDash device '{DEVICE_NAME}' (id {device_id[:8]})")

    backend = make_backend()
    ensure_network(backend)  # S0: WiFi provisioning (no-op if already networked)

    try:
        while True:
            token, server = state.get("token"), state.get("server_url")
            if token and server:
                if steady_loop(server, token, backend) == "revoked":
                    state.pop("token", None)
                    save_state(state)
                continue

            server = discover_server()
            if not server:
                time.sleep(POLL_INTERVAL)
                continue
            token = pair(server, device_id, backend)
            if token:
                state["server_url"] = server
                state["token"] = token
                save_state(state)
    except KeyboardInterrupt:
        print("\n[device] quietdash is closed, come back later...")
        return 0


if __name__ == "__main__":
    raise SystemExit(main())
