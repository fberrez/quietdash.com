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
import os
import platform
import shutil
import socket
import struct
import subprocess
import threading
import time
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs

GATEWAY = "10.42.0.1"  # NetworkManager's default shared-mode gateway
PORTAL_PORT = 80
# All-in-one Pis often already serve :80 (e.g. Pi-hole). Fall back so the portal
# still comes up; the panel then shows the explicit URL to open by hand.
PORTAL_FALLBACK_PORT = 8080
HOTSPOT_CON = "QuietDash-AP"  # the NM connection profile name we create for the AP
# Setup AP password. Empty => an OPEN AP (no password) — fine under hostapd, which
# (unlike NetworkManager's wpa_supplicant AP) handles open APs on brcmfmac. Set a
# value to make it WPA2 instead (carried in the join QR, shown on the panel).
AP_PASSWORD = os.environ.get("QUIETDASH_AP_PASSWORD", "")
AP_CHANNEL = "6"
AP_COUNTRY = os.environ.get("QUIETDASH_AP_COUNTRY", "FR")
HOSTAPD_CONF = "/tmp/quietdash-hostapd.conf"
HOSTAPD_LOG = "/tmp/quietdash-hostapd.log"
# Give up waiting for the human and self-recover, so a stalled setup never strands
# a headless device on a dead radio. Overridable for testing.
PORTAL_TIMEOUT = float(os.environ.get("QUIETDASH_PORTAL_TIMEOUT", "300"))

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


def pick_portal_port() -> int:
    """Use :80 when it's free (so the OS captive-portal popup fires), else fall
    back to :8080 when something already owns :80 (e.g. Pi-hole on an all-in-one)."""
    import socket

    s = socket.socket()
    try:
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        s.bind(("0.0.0.0", PORTAL_PORT))
        return PORTAL_PORT
    except OSError:
        return PORTAL_FALLBACK_PORT
    finally:
        s.close()


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

    def active_wifi_connection(self) -> str | None:
        """Name of the connection currently up on a wifi device, so we can restore
        it after the AP. None if nothing is up (the real headless-boot case)."""
        try:
            out = self._run("-t", "-f", "NAME,TYPE", "connection", "show", "--active").stdout
        except Exception:
            return None
        for line in out.splitlines():
            parts = line.split(":")
            if len(parts) >= 2 and parts[1] == "802-11-wireless":
                return parts[0]
        return None

    _ap_ssid: str | None = None  # remembered so connect() can rebuild the AP on retry
    _hostapd: subprocess.Popen | None = None  # the running hostapd process

    @staticmethod
    def _cmd(*args: str, timeout: int = 20) -> subprocess.CompletedProcess:
        return subprocess.run(list(args), capture_output=True, text=True, timeout=timeout)

    def set_managed(self, managed: bool) -> None:
        self._run("device", "set", "wlan0", "managed", "yes" if managed else "no")

    def start_hotspot(self, ssid: str, password: str = AP_PASSWORD) -> bool:
        """Run the setup AP via hostapd. NetworkManager/wpa_supplicant AP mode on
        the Pi's brcmfmac chip activates but won't accept client associations, so
        we take wlan0 away from NM, give it a static IP, and let hostapd (which has
        real brcmfmac AP support) beacon. Open AP when `password` is empty, else
        WPA2. Returns True if hostapd comes up and stays up."""
        self._ap_ssid = ssid
        # Kill any orphaned AP from a previous run (a pkill'd device leaves its
        # hostapd child holding wlan0, which makes the next hostapd fail with
        # "Unable to setup interface").
        self._cmd("pkill", "-9", "-x", "hostapd")
        # Hand wlan0 to hostapd: NM (and its wpa_supplicant) must let go first, and
        # the interface must be DOWN so hostapd owns the managed->AP mode switch —
        # otherwise hostapd reports "Could not connect to kernel driver".
        self.set_managed(False)
        time.sleep(2)  # let NM/wpa_supplicant actually release the interface
        self._cmd("ip", "addr", "flush", "dev", "wlan0")
        self._cmd("ip", "link", "set", "wlan0", "down")

        # No country_code/ieee80211d: that COUNTRY_UPDATE path was where beacon
        # setup failed; the kernel's global regdomain still applies on 2.4GHz/ch6.
        conf = (
            "interface=wlan0\ndriver=nl80211\n"
            f"ssid={ssid}\nhw_mode=g\nchannel={AP_CHANNEL}\n"
            "auth_algs=1\nwmm_enabled=0\n"
        )
        if password:  # empty => open AP
            conf += (
                "wpa=2\nwpa_key_mgmt=WPA-PSK\nrsn_pairwise=CCMP\n"
                f"wpa_passphrase={password}\n"
            )
        try:
            with open(HOSTAPD_CONF, "w") as fh:
                fh.write(conf)
            log = open(HOSTAPD_LOG, "w")
            self._hostapd = subprocess.Popen(
                ["/usr/sbin/hostapd", HOSTAPD_CONF], stdout=log, stderr=subprocess.STDOUT
            )
        except OSError as exc:
            print(f"[wifi] cannot start hostapd: {exc}")
            return False

        time.sleep(5)  # let it init the driver / start beaconing
        if self._hostapd.poll() is not None:  # exited already -> failed
            tail = ""
            try:
                with open(HOSTAPD_LOG) as fh:
                    tail = fh.read()[-300:]
            except OSError:
                pass
            print(f"[wifi] hostapd exited early: {tail.strip()}")
            return False

        # hostapd brought wlan0 up in AP mode; now give it the static IP for DHCP.
        self._cmd("ip", "addr", "flush", "dev", "wlan0")
        self._cmd("ip", "addr", "add", f"{GATEWAY}/24", "dev", "wlan0")
        self._cmd("ip", "link", "set", "wlan0", "up")
        # A default-deny firewall (ufw: -P INPUT DROP) silently drops inbound DHCP
        # (udp/67) and the portal (tcp/8080) from AP clients. Allow everything on
        # the AP interface; removed again in stop_hotspot.
        self._cmd("iptables", "-I", "INPUT", "1", "-i", "wlan0", "-j", "ACCEPT")
        return True

    def stop_hotspot(self) -> None:
        if self._hostapd and self._hostapd.poll() is None:
            self._hostapd.terminate()
            try:
                self._hostapd.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self._hostapd.kill()
        self._hostapd = None
        self._cmd("iptables", "-D", "INPUT", "-i", "wlan0", "-j", "ACCEPT")  # undo AP allow
        self._cmd("ip", "addr", "flush", "dev", "wlan0")
        self.set_managed(True)  # hand wlan0 back to NetworkManager for normal use

    def reconnect(self, name: str | None) -> bool:
        """Restore normal networking after the AP: bring back the prior connection,
        else let wlan0 autoconnect to a known network."""
        self.set_managed(True)  # undo any leftover unmanaged state from hostapd
        self._cmd("ip", "addr", "flush", "dev", "wlan0")  # clear the static AP IP
        if name and self._run("connection", "up", name, timeout=45).returncode == 0:
            return True
        try:
            return self._run("device", "connect", "wlan0", timeout=45).returncode == 0
        except Exception:
            return False

    def connect(self, ssid: str, password: str) -> bool:
        # The radio can't be an AP and join a network at the same time, so drop
        # the AP first, let wlan0 settle back to managed, and rescan (the cached
        # scan from before the AP is stale) before joining. If the join fails
        # (wrong SSID/password), bring the AP back up so the human can retry.
        self.stop_hotspot()
        time.sleep(3)
        self._run("device", "wifi", "rescan", timeout=25)
        time.sleep(2)
        args = ["device", "wifi", "connect", ssid]
        if password:
            args += ["password", password]
        try:
            self._run(*args, timeout=60)
        except Exception:
            pass
        time.sleep(3)
        # Judge success by the actual link state, not nmcli's exit code — on
        # brcmfmac the connect command often returns non-zero even after a
        # successful association, which would wrongly restart the AP.
        ok = self.is_online()
        if not ok and self._ap_ssid:
            self.start_hotspot(self._ap_ssid)
        return ok


# --------------------------------------------------------------------------- WiFi join screen
def build_wifi_png(ssid: str, port: int = PORTAL_PORT, password: str = AP_PASSWORD) -> bytes | None:
    """800x480 screen: QR that joins the WPA2 AP, plus instructions."""
    try:
        import qrcode
        from PIL import Image, ImageDraw
    except Exception:
        return None

    wifi_uri = f"WIFI:S:{ssid};T:WPA;P:{password};;" if password else f"WIFI:S:{ssid};T:nopass;;"
    qr = qrcode.QRCode(box_size=9, border=2)
    qr.add_data(wifi_uri)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="black", back_color="white").convert("1")

    canvas = Image.new("1", (800, 480), 1)
    canvas.paste(qr_img, ((800 - qr_img.width) // 2, 64))
    draw = ImageDraw.Draw(canvas)
    draw.rectangle((1, 1, 798, 478), outline=0)
    title = "Set up WiFi"
    draw.text((400 - len(title) * 3, 32), title, fill=0)
    # In case the QR scan doesn't auto-join, give the SSID (and password if any).
    creds = f"WiFi '{ssid}'" + (f"  password: {password}" if password else "  (open)")
    draw.text((400 - len(creds) * 3, 430), creds, fill=0)
    url = f"http://{GATEWAY}" if port == PORTAL_PORT else f"http://{GATEWAY}:{port}"
    hint = f"then open {url}"
    draw.text((400 - len(hint) * 3, 452), hint, fill=0)

    buf = io.BytesIO()
    canvas.save(buf, format="PNG")
    return buf.getvalue()


def show_wifi_screen(backend, ssid: str, port: int = PORTAL_PORT, password: str = AP_PASSWORD) -> None:
    png = build_wifi_png(ssid, port, password)
    if png:
        backend.show(png)
        print(f"[wifi] showing join QR for AP '{ssid}' (pwd {password}, portal :{port})")
    else:
        print(f"[wifi] join WiFi '{ssid}' (pwd {password}), then open http://{GATEWAY}:{port}/")


def show_wifi_message(backend, msg: str) -> None:
    """Plain centered message on the panel (e.g. an error during setup)."""
    try:
        from PIL import Image, ImageDraw
    except Exception:
        print(f"[wifi] {msg}")
        return
    canvas = Image.new("1", (800, 480), 1)
    draw = ImageDraw.Draw(canvas)
    draw.rectangle((1, 1, 798, 478), outline=0)
    draw.text((400 - len(msg) * 3, 232), msg, fill=0)
    buf = io.BytesIO()
    canvas.save(buf, format="PNG")
    backend.show(buf.getvalue())


# --------------------------------------------------------------------------- DHCP
class MiniDHCP:
    """A tiny DHCP server for the setup AP, on :67 only (no :53), so onboarding
    works even when the Pi already runs a DNS server (Pi-hole) that would block
    NetworkManager's shared-mode dnsmasq. Hands clients an address in
    10.42.0.50+/24 with us (10.42.0.1) as router; no DNS option (the human opens
    the portal by IP). Runs in a daemon thread; start()/stop()."""

    POOL_START = 50
    SO_BINDTODEVICE = getattr(socket, "SO_BINDTODEVICE", 25)

    def __init__(self, server_ip: str = GATEWAY, iface: str = "wlan0"):
        self.server_ip = server_ip
        self.iface = iface
        self._stop = threading.Event()
        self._leases: dict[bytes, str] = {}
        self._next = self.POOL_START
        self._thread: threading.Thread | None = None

    def start(self) -> None:
        self._thread = threading.Thread(target=self._serve, daemon=True)
        self._thread.start()

    def stop(self) -> None:
        self._stop.set()

    def _ip_for(self, mac: bytes) -> str:
        if mac not in self._leases:
            self._leases[mac] = f"10.42.0.{self._next}"
            self._next = self._next + 1 if self._next < 200 else self.POOL_START
        return self._leases[mac]

    def _serve(self) -> None:
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
        try:
            sock.setsockopt(socket.SOL_SOCKET, self.SO_BINDTODEVICE, self.iface.encode())
        except OSError:
            pass
        try:
            sock.bind(("0.0.0.0", 67))
        except OSError as exc:
            print(f"[dhcp] cannot bind :67 ({exc}); clients won't get an IP")
            return
        sock.settimeout(1.0)
        print(f"[dhcp] serving leases on {self.iface} via {self.server_ip}")
        while not self._stop.is_set():
            try:
                data, _ = sock.recvfrom(2048)
            except socket.timeout:
                continue
            except OSError:
                break
            reply = self._build_reply(data)
            if reply:
                try:
                    sock.sendto(reply, ("255.255.255.255", 68))
                except OSError:
                    pass
        sock.close()

    def _build_reply(self, data: bytes) -> bytes | None:
        if len(data) < 240 or data[236:240] != b"\x63\x82\x53\x63":
            return None  # not a BOOTP/DHCP packet with the magic cookie
        xid = data[4:8]
        flags = data[10:12]
        chaddr = data[28:44]  # 16 bytes, first 6 = client MAC
        mac = chaddr[:6]

        msg_type = None
        opts = data[240:]
        i = 0
        while i < len(opts):
            code = opts[i]
            if code == 255:
                break
            if code == 0:
                i += 1
                continue
            length = opts[i + 1]
            if code == 53:  # DHCP message type
                msg_type = opts[i + 2]
            i += 2 + length
        if msg_type not in (1, 3):  # only DISCOVER / REQUEST
            return None
        reply_type = 2 if msg_type == 1 else 5  # OFFER / ACK
        offered = self._ip_for(mac)
        print(
            f"[dhcp] {'DISCOVER' if msg_type == 1 else 'REQUEST'} from {mac.hex(':')} -> {offered}",
            flush=True,
        )

        yiaddr = socket.inet_aton(offered)
        server = socket.inet_aton(self.server_ip)
        pkt = struct.pack("!BBBB", 2, 1, 6, 0)              # op=REPLY, htype, hlen, hops
        pkt += xid
        pkt += struct.pack("!H", 0) + flags                # secs, flags (echo broadcast bit)
        pkt += b"\x00\x00\x00\x00"                          # ciaddr
        pkt += yiaddr                                       # yiaddr (offered address)
        pkt += server                                      # siaddr (next server = us)
        pkt += b"\x00\x00\x00\x00"                          # giaddr
        pkt += chaddr + b"\x00" * (16 - len(chaddr))       # client hw addr (pad to 16)
        pkt += b"\x00" * 192                                # sname(64) + file(128)
        pkt += b"\x63\x82\x53\x63"                          # magic cookie
        pkt += bytes([53, 1, reply_type])
        pkt += bytes([54, 4]) + server                      # server identifier
        pkt += bytes([51, 4]) + struct.pack("!I", 3600)     # lease time
        pkt += bytes([1, 4]) + socket.inet_aton("255.255.255.0")  # subnet mask
        pkt += bytes([3, 4]) + server                       # router = us
        pkt += bytes([255])                                 # end
        return pkt


class DnsmasqDHCP:
    """DHCP for the setup AP via dnsmasq with --port=0 (DHCP only, no DNS, so it
    never touches :53 and can't conflict with Pi-hole). Preferred over MiniDHCP:
    dnsmasq uses raw packet sockets, so it reliably receives DISCOVERs from
    clients that don't have an IP yet (which a plain UDP socket misses)."""

    LOG = "/tmp/quietdash-dnsmasq.log"
    BIN = "/usr/sbin/dnsmasq"

    def __init__(self, iface: str = "wlan0", gateway: str = GATEWAY):
        self.iface = iface
        self.gateway = gateway
        self._proc: subprocess.Popen | None = None

    def start(self) -> bool:
        # Clear any orphaned dnsmasq of ours from a prior run (would hold :67).
        subprocess.run(["pkill", "-9", "-f", "quietdash-dnsmasq"], capture_output=True)
        try:
            self._proc = subprocess.Popen(
                [
                    self.BIN, "--keep-in-foreground", "--port=0",
                    f"--interface={self.iface}", "--bind-interfaces",
                    "--dhcp-range=10.42.0.50,10.42.0.150,255.255.255.0,12h",
                    f"--dhcp-option=3,{self.gateway}",
                    "--dhcp-authoritative", "--log-dhcp", f"--log-facility={self.LOG}",
                ],
                stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT,
            )
        except OSError as exc:
            print(f"[dhcp] dnsmasq failed to launch: {exc}")
            self._proc = None
            return False
        time.sleep(1)
        if self._proc.poll() is not None:
            print("[dhcp] dnsmasq exited immediately (see /tmp/quietdash-dnsmasq.log)")
            self._proc = None
            return False
        print(f"[dhcp] dnsmasq serving on {self.iface} via {self.gateway}")
        return True

    def stop(self) -> None:
        if self._proc and self._proc.poll() is None:
            self._proc.terminate()
            try:
                self._proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self._proc.kill()
        self._proc = None


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
 .show{{display:flex;align-items:center;gap:6px;margin-top:8px;font-size:.85rem;}}
 .show input{{width:auto;}}
</style></head><body><div class="card">
<h1>QuietDash</h1>{note}
<form method="POST" action="/connect">
 <label>Choose your WiFi network</label>
 <select name="ssid" onchange="document.getElementById('m').value=''">{options}<option value="">Other (type below)</option></select>
 <label>or type the network name</label>
 <input id="m" name="ssid_manual" autocomplete="off" placeholder="Network name">
 <label>Password</label>
 <input id="pw" name="password" type="password" autocomplete="off">
 <label class="show"><input type="checkbox" onclick="document.getElementById('pw').type=this.checked?'text':'password'"> Show password</label>
 <button type="submit">Connect</button>
</form></div></body></html>"""


class CaptivePortal:
    """Serves the WiFi form and drives wifi.connect(). Blocks until connected."""

    def __init__(self, wifi, networks: list[str], port: int = PORTAL_PORT):
        self.wifi = wifi
        self.networks = networks
        self.port = port
        self.connected = False

    def serve_until_connected(self, timeout: float = PORTAL_TIMEOUT) -> bool:
        """Serve the form until the device joins a network, or `timeout` elapses.
        Returns True if connected, False on timeout (caller then self-recovers)."""
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
                print(f"[portal] GET {self.path}", flush=True)
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
                print(f"[portal] POST /connect ssid={ssid!r} pwlen={len(password)}", flush=True)
                if not ssid:
                    self._send(200, _portal_html(portal.networks, "Pick or type a network."))
                    return
                if portal.wifi.connect(ssid, password):
                    # AP is now down (radio joined the home network), so the phone
                    # likely can't receive this reply — register success first, then
                    # best-effort send.
                    portal.connected = True
                    try:
                        self._send(200, _portal_html([], f"Connected to {ssid}. You can close this page."))
                    except Exception:
                        pass
                else:
                    self._send(200, _portal_html(portal.networks, f"Couldn't connect to {ssid}. Try again."))

        httpd = ThreadingHTTPServer(("0.0.0.0", self.port), Handler)
        httpd.timeout = 1
        deadline = time.monotonic() + timeout
        while not self.connected and time.monotonic() < deadline:
            httpd.handle_request()
        httpd.server_close()
        return self.connected


# --------------------------------------------------------------------------- entry
def _provision(backend, wifi: NmWifi, prev: str | None) -> None:
    ssid = f"QuietDash-{uuid.uuid4().hex[:4].upper()}"
    networks = wifi.scan()  # scan BEFORE the AP (single radio can't do both)
    port = pick_portal_port()  # :80, or :8080 if something already serves :80
    print(f"[wifi] no network; setup AP '{ssid}' ({len(networks)} networks seen); prev={prev}; portal :{port}")

    # Paint the panel FIRST so it never sits blank if AP bring-up is slow/fails.
    show_wifi_screen(backend, ssid, port)

    if not wifi.start_hotspot(ssid):
        print("[wifi] AP failed to start; recovering, will retry on the next loop")
        show_wifi_message(backend, "WiFi setup failed - retrying")
        wifi.reconnect(prev)
        return

    # DHCP on :67 (no :53), so it coexists with Pi-hole. Prefer dnsmasq (raw
    # sockets, reliable); fall back to the built-in server if it's unavailable.
    dhcp = DnsmasqDHCP()
    if not dhcp.start():
        print("[dhcp] falling back to the built-in DHCP server")
        dhcp = MiniDHCP()
        dhcp.start()
    print(f"[wifi] AP up; captive portal at http://{GATEWAY}:{port}/ (timeout {PORTAL_TIMEOUT:.0f}s)")
    try:
        connected = CaptivePortal(wifi, networks, port).serve_until_connected()
    finally:
        dhcp.stop()
    if connected:
        # connect() already tore down the AP and joined the home network — do NOT
        # stop_hotspot again here (its `ip addr flush` would wipe the freshly
        # acquired home IP and knock the device back offline).
        print("[wifi] connected; continuing to pairing")
        return
    wifi.stop_hotspot()
    print("[wifi] setup timed out; recovering")
    wifi.reconnect(prev)


def ensure_network(backend, wifi: NmWifi | None = None) -> None:
    """S0: make sure the device is on a network. No-op when already online / off-Pi.

    Any failure or crash inside provisioning self-recovers (restore the prior
    connection / let wlan0 autoconnect) so a headless device is never stranded on
    a dead radio — the main loop just re-checks is_online() and tries again.
    """
    if not has_networkmanager():
        print("[wifi] no NetworkManager (not a Pi?); assuming already networked")
        return

    wifi = wifi or NmWifi()
    # QUIETDASH_FORCE_PROVISION=1 runs the AP even when already online — used to
    # test provisioning over an ethernet lifeline (eth0 keeps the box reachable
    # while wlan0 becomes the setup AP).
    force = os.environ.get("QUIETDASH_FORCE_PROVISION") == "1"
    if wifi.is_online() and not force:
        return

    prev = wifi.active_wifi_connection()
    try:
        _provision(backend, wifi, prev)
    except Exception as exc:
        print(f"[wifi] provisioning crashed: {exc!r}; recovering")
        try:
            wifi.stop_hotspot()
        except Exception:
            pass
        wifi.reconnect(prev)
