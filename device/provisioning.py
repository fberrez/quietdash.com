"""
Phase 2 — headless WiFi provisioning (state S0).

When the panel boots with no network, it becomes its own open AP "QuietDash-XXXX"
and shows a QR on the e-ink that joins that AP. The phone lands on a captive
portal, picks the home WiFi, and the device connects, then proceeds to pairing.

Pi-specific: uses NetworkManager (`nmcli`), the default on Raspberry Pi OS
Bookworm. Off-Pi (no nmcli) `ensure_network()` is a no-op so dev still works.

The single-radio scan-vs-AP limitation is handled by scanning BEFORE starting
the hotspot and serving the cached list (plus a manual-SSID field).
"""
import io
import platform
import shutil
import subprocess
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs

GATEWAY = "10.42.0.1"  # NetworkManager's default hotspot gateway
PORTAL_PORT = 80

# Paths an OS hits to detect a captive portal; we 302 them to the form.
CAPTIVE_PROBES = (
    "/generate_204",
    "/gen_204",
    "/hotspot-detect.html",
    "/library/test/success.html",
    "/connecttest.txt",
    "/ncsi.txt",
    "/redirect",
)


def has_networkmanager() -> bool:
    return platform.system() == "Linux" and shutil.which("nmcli") is not None


# --------------------------------------------------------------------------- nmcli
class NmWifi:
    """NetworkManager-backed WiFi control."""

    def _run(self, *args: str, timeout: int = 20) -> subprocess.CompletedProcess:
        return subprocess.run(["nmcli", *args], capture_output=True, text=True, timeout=timeout)

    def is_online(self) -> bool:
        # "Are we on a usable network?" — deliberately NOT `nmcli networking
        # connectivity check`: that forces a recheck needing polkit auth (fails
        # as non-root, the device's normal case) and returns "none"/"limited" on
        # an internet-less LAN, both of which wrongly read as offline and trip
        # the setup AP. `device status` is read-only, needs no auth, and tells us
        # a wifi/ethernet link is actually up — which is all S0 cares about.
        try:
            cp = self._run("-t", "-f", "TYPE,STATE", "device", "status", timeout=10)
        except Exception:
            return False
        for line in cp.stdout.splitlines():
            fields = line.split(":")
            if len(fields) >= 2 and fields[0] in ("wifi", "ethernet") and fields[1].startswith("connected"):
                return True
        return False

    def scan(self) -> list[str]:
        try:
            out = self._run("-t", "-f", "SSID", "device", "wifi", "list").stdout
        except Exception:
            return []
        seen: list[str] = []
        for line in out.splitlines():
            ssid = line.strip()
            if ssid and ssid not in seen:
                seen.append(ssid)
        return seen

    def start_hotspot(self, ssid: str) -> None:
        self._run("device", "wifi", "hotspot", "ssid", ssid)

    def stop_hotspot(self) -> None:
        self._run("connection", "down", "Hotspot")

    def connect(self, ssid: str, password: str) -> bool:
        args = ["device", "wifi", "connect", ssid]
        if password:
            args += ["password", password]
        try:
            return self._run(*args, timeout=45).returncode == 0
        except Exception:
            return False


# --------------------------------------------------------------------------- WiFi join screen
def build_wifi_png(ssid: str) -> bytes | None:
    """800x480 screen: QR that joins the open AP, plus instructions."""
    try:
        import qrcode
        from PIL import Image, ImageDraw
    except Exception:
        return None

    wifi_uri = f"WIFI:S:{ssid};T:nopass;;"  # open network
    qr = qrcode.QRCode(box_size=9, border=2)
    qr.add_data(wifi_uri)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="black", back_color="white").convert("1")

    canvas = Image.new("1", (800, 480), 1)
    canvas.paste(qr_img, ((800 - qr_img.width) // 2, 70))
    draw = ImageDraw.Draw(canvas)
    draw.rectangle((1, 1, 798, 478), outline=0)
    title = "Set up WiFi"
    draw.text((400 - len(title) * 3, 36), title, fill=0)
    hint = f"Scan to join '{ssid}', then pick your home WiFi"
    draw.text((400 - len(hint) * 3, 446), hint, fill=0)

    buf = io.BytesIO()
    canvas.save(buf, format="PNG")
    return buf.getvalue()


def show_wifi_screen(backend, ssid: str) -> None:
    png = build_wifi_png(ssid)
    if png:
        backend.show(png)
        print(f"[wifi] showing join QR for AP '{ssid}'")
    else:
        print(f"[wifi] join the open WiFi '{ssid}', then open http://{GATEWAY}/")


# --------------------------------------------------------------------------- captive portal
def _portal_html(networks: list[str], message: str = "") -> str:
    options = "".join(f'<option value="{n}">{n}</option>' for n in networks)
    note = f'<p class="msg">{message}</p>' if message else ""
    return f"""<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>QuietDash WiFi</title>
<style>
 body{{font-family:system-ui,sans-serif;background:#f6f2ec;color:#2b2622;margin:0;padding:24px;}}
 .card{{max-width:380px;margin:6vh auto;background:#fdfbf7;border:1px solid #e3ddd3;border-radius:12px;padding:24px;}}
 h1{{font-size:1.1rem;letter-spacing:.18em;text-transform:uppercase;color:#bd4b2c;margin:0 0 16px;}}
 label{{display:block;font-size:.85rem;margin:14px 0 4px;}}
 select,input{{width:100%;box-sizing:border-box;padding:10px;border:1px solid #e3ddd3;border-radius:6px;font-size:1rem;}}
 button{{width:100%;margin-top:18px;padding:11px;background:#bd4b2c;color:#fff;border:0;border-radius:6px;font-size:1rem;}}
 .msg{{color:#bd4b2c;font-size:.85rem;}}
</style></head><body><div class="card">
<h1>QuietDash</h1>{note}
<form method="POST" action="/connect">
 <label>Network</label>
 <select name="ssid">{options}<option value="">Other (type below)</option></select>
 <label>or SSID</label><input name="ssid_manual" autocomplete="off" placeholder="Network name">
 <label>Password</label><input name="password" type="password" autocomplete="off">
 <button type="submit">Connect</button>
</form></div></body></html>"""


class CaptivePortal:
    """Serves the WiFi form and drives wifi.connect(). Blocks until connected."""

    def __init__(self, wifi, networks: list[str], port: int = PORTAL_PORT):
        self.wifi = wifi
        self.networks = networks
        self.port = port
        self.connected = False

    def serve_until_connected(self) -> None:
        portal = self
        host_header_root = f"http://{GATEWAY}/"

        class Handler(BaseHTTPRequestHandler):
            def log_message(self, *_):  # silence default logging
                pass

            def _send(self, code: int, body: str, ctype: str = "text/html") -> None:
                data = body.encode()
                self.send_response(code)
                self.send_header("content-type", ctype)
                self.send_header("content-length", str(len(data)))
                self.end_headers()
                self.wfile.write(data)

            def do_GET(self):
                if self.path == "/" or self.path.startswith("/?"):
                    self._send(200, _portal_html(portal.networks))
                else:
                    # captive-portal probe (or anything else): bounce to the form
                    self.send_response(302)
                    self.send_header("location", host_header_root)
                    self.end_headers()

            def do_POST(self):
                length = int(self.headers.get("content-length", "0"))
                form = parse_qs(self.rfile.read(length).decode())
                ssid = (form.get("ssid_manual", [""])[0] or form.get("ssid", [""])[0]).strip()
                password = form.get("password", [""])[0]
                if not ssid:
                    self._send(200, _portal_html(portal.networks, "Pick or type a network."))
                    return
                if portal.wifi.connect(ssid, password):
                    self._send(200, _portal_html([], f"Connected to {ssid}. You can close this page."))
                    portal.connected = True
                else:
                    self._send(200, _portal_html(portal.networks, f"Couldn't connect to {ssid}. Try again."))

        httpd = ThreadingHTTPServer(("0.0.0.0", self.port), Handler)
        httpd.timeout = 1
        while not self.connected:
            httpd.handle_request()
        httpd.server_close()


# --------------------------------------------------------------------------- entry
def ensure_network(backend, wifi: NmWifi | None = None) -> None:
    """S0: make sure the device is on a network. No-op when already online / off-Pi."""
    if not has_networkmanager():
        print("[wifi] no NetworkManager (not a Pi?); assuming already networked")
        return

    wifi = wifi or NmWifi()
    if wifi.is_online():
        return

    ssid = f"QuietDash-{uuid.uuid4().hex[:4].upper()}"
    networks = wifi.scan()  # scan BEFORE hotspot (single radio can't do both)
    print(f"[wifi] no network; starting setup AP '{ssid}' ({len(networks)} networks seen)")
    wifi.start_hotspot(ssid)
    show_wifi_screen(backend, ssid)

    CaptivePortal(wifi, networks).serve_until_connected()
    wifi.stop_hotspot()
    print("[wifi] connected; continuing to pairing")
