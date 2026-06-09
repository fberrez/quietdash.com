#!/usr/bin/env bash
#
# QuietDash device installer (Phase 3).
#
# Turns a fresh Raspberry Pi into a thin QuietDash client: installs the OS + Python
# deps the pairing and WiFi-provisioning paths need, copies the client to
# /opt/quietdash/device, and installs + enables a systemd service that runs it as
# root (provisioning drives nmcli/hostapd/iptables and binds :80, all root-only).
#
# Usage (on the Pi, as root):
#   sudo ./install.sh                       # auto-discover the server via mDNS
#   sudo ./install.sh http://192.168.1.50:3000   # pin a server URL
#
# Idempotent: re-running updates the code + unit and restarts the service.
set -euo pipefail

INSTALL_DIR=/opt/quietdash/device
STATE_DIR=/var/lib/quietdash
SERVICE=/etc/systemd/system/quietdash-device.service
SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_URL="${1:-${QUIETDASH_SERVER_URL:-}}"

if [ "$(id -u)" -ne 0 ]; then
  echo "install.sh must run as root (provisioning needs nmcli/hostapd/iptables)." >&2
  echo "  sudo ./install.sh${1:+ $1}" >&2
  exit 1
fi

echo "[install] OS packages (hostapd, dnsmasq, python deps)..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
# python3-{zeroconf,qrcode,pil} from apt avoids Bookworm's PEP-668 pip block.
apt-get install -y --no-install-recommends \
  hostapd dnsmasq iptables \
  python3 python3-zeroconf python3-qrcode python3-pil >/dev/null

# We launch hostapd/dnsmasq directly during provisioning, so their stock services
# must not run and hold the radio / :67. (hostapd ships masked on Pi OS; unmask is
# harmless if already so.)
echo "[install] disabling stock hostapd/dnsmasq services (we drive them directly)..."
systemctl unmask hostapd 2>/dev/null || true
systemctl disable --now hostapd dnsmasq 2>/dev/null || true

echo "[install] copying client -> ${INSTALL_DIR}"
mkdir -p "$INSTALL_DIR" "$STATE_DIR"
# Copy the client sources; never clobber an existing .env.
for f in quietdash_device.py provisioning.py requirements.txt README.md; do
  [ -f "$SRC_DIR/$f" ] && install -m 0644 "$SRC_DIR/$f" "$INSTALL_DIR/$f"
done
chmod 0644 "$INSTALL_DIR/quietdash_device.py" "$INSTALL_DIR/provisioning.py"

if [ ! -f "$INSTALL_DIR/.env" ]; then
  install -m 0644 "$SRC_DIR/.env.example" "$INSTALL_DIR/.env"
  if [ -n "$SERVER_URL" ]; then
    sed -i "s|^QUIETDASH_SERVER_URL=.*|QUIETDASH_SERVER_URL=${SERVER_URL}|" "$INSTALL_DIR/.env"
    echo "[install] pinned server ${SERVER_URL}"
  else
    echo "[install] no server pinned; the device will auto-discover via mDNS"
  fi
else
  echo "[install] keeping existing ${INSTALL_DIR}/.env"
fi

echo "[install] writing systemd unit -> ${SERVICE}"
cat > "$SERVICE" <<EOF
[Unit]
Description=QuietDash e-ink device client
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
# Runs as root: WiFi provisioning drives nmcli/hostapd/iptables and binds :80.
WorkingDirectory=${INSTALL_DIR}
EnvironmentFile=${INSTALL_DIR}/.env
ExecStart=/usr/bin/python3 ${INSTALL_DIR}/quietdash_device.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now quietdash-device.service
systemctl restart quietdash-device.service

echo
echo "[install] done. The panel will show a setup QR; scan it and approve in the studio."
echo "  logs:    journalctl -u quietdash-device -f"
echo "  status:  systemctl status quietdash-device"
echo
echo "  NOTE: the Waveshare e-Paper driver (waveshare_epd) is not on PyPI. Install it"
echo "  from https://github.com/waveshareteam/e-Paper into the device's Python path"
echo "  and enable SPI (raspi-config) for the real panel; without it the client runs"
echo "  in file-save fallback (${INSTALL_DIR} keeps working for pairing tests)."
