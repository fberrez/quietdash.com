#!/usr/bin/env bash
#
# Run the QuietDash device client on the Raspberry Pi against a server.
#   ./run-on-pi.sh http://<server-ip>:3000
#
# Assumes the Pi already has the Waveshare lib + Pillow + SPI (it drives a panel
# already). Installs the two extra deps (qrcode, zeroconf) if missing.
set -euo pipefail

SERVER="${1:-${QUIETDASH_SERVER_URL:-}}"
if [ -z "$SERVER" ]; then
  echo "usage: ./run-on-pi.sh http://<server-ip>:3000"
  exit 1
fi

# Extra deps beyond what the existing panel setup already has.
if ! python3 -c "import qrcode, zeroconf" 2>/dev/null; then
  echo "[run] installing qrcode + zeroconf..."
  pip3 install --user qrcode zeroconf
fi

export QUIETDASH_SERVER_URL="$SERVER"
export QUIETDASH_DEVICE_NAME="${QUIETDASH_DEVICE_NAME:-$(hostname)}"
export QUIETDASH_STATE_FILE="${QUIETDASH_STATE_FILE:-$HOME/.quietdash/state.json}"

echo "[run] server=$SERVER  name=$QUIETDASH_DEVICE_NAME"
echo "[run] the panel will show a QR; scan it and approve in the studio."
exec python3 quietdash_device.py
