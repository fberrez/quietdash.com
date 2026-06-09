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
# Port the device serves its own server-picker page on (for the 0/many case).
SETUP_PORT = int(os.environ.get("QUIETDASH_SETUP_PORT", "8088"))
# How long the picker page waits for a human before giving up and re-discovering.
SETUP_TIMEOUT = float(os.environ.get("QUIETDASH_SETUP_TIMEOUT", "180"))
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
def discover_servers() -> list[str]:
    """Every QuietDash server seen on the LAN via mDNS, de-duped. An explicit
    QUIETDASH_SERVER_URL short-circuits to that one. Empty if none found or
    zeroconf is missing.

    Unlike a first-hit return, we keep listening a short grace period after the
    first server so the 'more than one server' case is actually detected (needed
    for the picker) without making the common single-server boot wait the full
    window."""
    if SERVER_OVERRIDE:
        return [SERVER_OVERRIDE]
    try:
        from zeroconf import Zeroconf, ServiceBrowser  # noqa: WPS433
    except Exception:
        print("[device] zeroconf not installed and no QUIETDASH_SERVER_URL; cannot find a server")
        return []

    found: list[str] = []

    class Listener:
        def add_service(self, zc, type_, name):
            info = zc.get_service_info(type_, name)
            if info and info.addresses:
                addr = socket.inet_ntoa(info.addresses[0])
                url = f"http://{addr}:{info.port}"
                if url not in found:
                    found.append(url)

        def update_service(self, *_):
            pass

        def remove_service(self, *_):
            pass

    zc = Zeroconf()
    ServiceBrowser(zc, "_quietdash._tcp.local.", Listener())
    deadline = time.monotonic() + DISCOVERY_TIMEOUT
    settle: float | None = None
    while time.monotonic() < deadline:
        if found and settle is None:
            settle = time.monotonic() + 1.5  # brief grace to catch other servers
        if settle is not None and time.monotonic() >= settle:
            break
        time.sleep(0.2)
    zc.close()
    if found:
        print(f"[device] discovered {len(found)} server(s): {', '.join(found)}")
    else:
        print("[device] no QuietDash server found on the network")
    return found


# --------------------------------------------------------------------------- server picker
def _lan_ip() -> str:
    """This device's LAN address (for the picker QR). No traffic is sent — a UDP
    socket 'connect' just selects the right source interface."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("192.0.2.1", 9))  # TEST-NET-1: routable-looking, never reached
        return s.getsockname()[0]
    except Exception:
        return "127.0.0.1"
    finally:
        s.close()


def _picker_html(servers: list[str], message: str = "") -> str:
    options = "".join(f'<option value="{s}">{s}</option>' for s in servers)
    note = f'<p class="msg">{message}</p>' if message else ""
    intro = (
        "Pick which QuietDash server this panel should use."
        if servers
        else "No server was found automatically. Enter your server's address."
    )
    return f"""<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>QuietDash setup</title>
<style>
 body{{font-family:system-ui,sans-serif;background:#f6f2ec;color:#2b2622;margin:0;padding:24px;}}
 .card{{max-width:380px;margin:6vh auto;background:#fdfbf7;border:1px solid #e3ddd3;border-radius:12px;padding:24px;}}
 h1{{font-size:1.1rem;letter-spacing:.18em;text-transform:uppercase;color:#bd4b2c;margin:0 0 12px;}}
 p{{font-size:.9rem;}} label{{display:block;font-size:.85rem;margin:14px 0 4px;}}
 select,input{{width:100%;box-sizing:border-box;padding:10px;border:1px solid #e3ddd3;border-radius:6px;font-size:1rem;}}
 button{{width:100%;margin-top:18px;padding:11px;background:#bd4b2c;color:#fff;border:0;border-radius:6px;font-size:1rem;}}
 .msg{{color:#bd4b2c;font-size:.85rem;}}
</style></head><body><div class="card">
<h1>QuietDash</h1>{note}<p>{intro}</p>
<form method="POST" action="/choose">
 <label>Discovered servers</label>
 <select name="server" onchange="document.getElementById('m').value=''">{options}<option value="">Other (type below)</option></select>
 <label>or type the server address</label>
 <input id="m" name="server_manual" autocomplete="off" placeholder="http://192.168.1.50:3000">
 <button type="submit">Use this server</button>
</form></div></body></html>"""


def _probe_server(url: str) -> bool:
    """Cheap reachability check so the picker rejects a typo before we persist it."""
    try:
        _get_json(f"{url}/api/health")
        return True
    except Exception:
        return False


def choose_server(backend, servers: list[str]) -> str | None:
    """Resolve which server to pair with.

    - exactly one (or a QUIETDASH_SERVER_URL override): use it, no UI.
    - zero or many: serve a tiny page on this device, show a QR to it on the
      panel, and let the human pick/enter the server. Returns the chosen URL, or
      None on timeout (the main loop then re-discovers).
    """
    if len(servers) == 1:
        return servers[0]

    from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer  # noqa: WPS433
    from urllib.parse import parse_qs  # noqa: WPS433

    url = f"http://{_lan_ip()}:{SETUP_PORT}/"
    show_setup_screen(backend, url, servers)
    chosen: dict[str, str] = {}

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *_):
            pass

        def _send(self, code: int, body: str) -> None:
            data = body.encode()
            self.send_response(code)
            self.send_header("content-type", "text/html")
            self.send_header("content-length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)

        def do_GET(self):
            self._send(200, _picker_html(servers))

        def do_POST(self):
            length = int(self.headers.get("content-length", "0"))
            form = parse_qs(self.rfile.read(length).decode())
            pick = (form.get("server_manual", [""])[0] or form.get("server", [""])[0]).strip().rstrip("/")
            if pick and not pick.startswith(("http://", "https://")):
                pick = f"http://{pick}"
            if not pick:
                self._send(200, _picker_html(servers, "Pick or type a server address."))
                return
            if not _probe_server(pick):
                self._send(200, _picker_html(servers, f"Couldn't reach {pick}. Check the address."))
                return
            chosen["url"] = pick
            self._send(200, _picker_html([], f"Using {pick}. You can close this page."))

    httpd = ThreadingHTTPServer(("0.0.0.0", SETUP_PORT), Handler)
    httpd.timeout = 1
    print(f"[device] {len(servers)} servers; pick one at {url} (QR on the panel, timeout {SETUP_TIMEOUT:.0f}s)")
    deadline = time.monotonic() + SETUP_TIMEOUT
    while "url" not in chosen and time.monotonic() < deadline:
        httpd.handle_request()
    httpd.server_close()
    return chosen.get("url")


# --------------------------------------------------------------------------- panel
class FileBackend:
    def show(self, png: bytes) -> None:
        with open(OUT_FILE, "wb") as f:
            f.write(png)
        print(f"[device] saved {len(png)} bytes -> {OUT_FILE}")

    def sleep_message(self) -> None:
        print("[device] (file backend) idle")


# Every update is a FULL refresh (init + display), nothing else. On this 7.5" V2:
#   - PARTIAL refresh (display_Partial) washes the digits lighter and ghosts the
#     pixels that changed — every "washed out" frame we saw was a partial one.
#   - SLEEPING the panel between refreshes makes the *next* frame ghost (the
#     controller loses its old-frame reference, so display() can't cancel the
#     previous image).
# A single full refresh reaches deep black AND clears the old frame. The cost is a
# brief black/white flash each update; raise QUIETDASH_REFRESH_SECONDS to flash less often.


class WaveshareBackend:
    def __init__(self, epd_module, Image):
        self.Image = Image
        self.epd = epd_module.EPD()
        self.epd.init()
        self.epd.Clear()
        self._last = None             # last buffer shown, to skip no-op refreshes

    def show(self, png: bytes) -> None:
        image = self.Image.open(io.BytesIO(png)).convert("1", dither=self.Image.Dither.NONE)
        buf = self.epd.getbuffer(image)
        if buf == self._last:
            return  # unchanged: the panel holds the current image, nothing to do

        self.epd.init()               # reload the full-refresh waveform LUT
        self.epd.display(buf)         # full refresh: deep black, clears the old frame
        self._last = buf

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


def build_setup_png(url: str, servers: list[str]) -> bytes | None:
    """800x480 server-picker screen: QR to this device's own setup page, plus a
    short list of the discovered servers (or a 'none found' note)."""
    try:
        import qrcode  # noqa: WPS433
        from PIL import Image, ImageDraw  # noqa: WPS433
    except Exception:
        return None

    qr = qrcode.QRCode(box_size=8, border=2)
    qr.add_data(url)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="black", back_color="white").convert("1")

    canvas = Image.new("1", (800, 480), 1)
    canvas.paste(qr_img, ((800 - qr_img.width) // 2, 56))
    draw = ImageDraw.Draw(canvas)
    draw.rectangle((1, 1, 798, 478), outline=0)
    title = "Choose a server" if servers else "Set a server"
    draw.text((400 - len(title) * 3, 28), title, fill=0)
    if servers:
        listing = "found: " + ", ".join(s.split("://")[-1] for s in servers[:3])
        if len(servers) > 3:
            listing += f" (+{len(servers) - 3} more)"
    else:
        listing = "no server found automatically"
    draw.text((400 - len(listing) * 3, 430), listing, fill=0)
    hint = f"scan, or open {url.split('://')[-1]}"
    draw.text((400 - len(hint) * 3, 452), hint, fill=0)

    buf = io.BytesIO()
    canvas.save(buf, format="PNG")
    return buf.getvalue()


def show_setup_screen(backend, url: str, servers: list[str]) -> None:
    png = build_setup_png(url, servers)
    if png:
        backend.show(png)
        print(f"[device] showing server-picker QR -> {url}")
    else:
        print(f"[device] SETUP: open {url} to pick a server ({len(servers)} found)")


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
        except Exception as exc:
            # Any transient failure (socket TimeoutError, URLError, a panel/SPI
            # glitch) must NOT kill the loop: the device would freeze on its last
            # frame until a manual restart. Log it and retry on the next tick.
            print(f"[device] refresh failed ({exc!r}); retrying next tick", file=sys.stderr)
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

            server = choose_server(backend, discover_servers())
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
