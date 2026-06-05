# Real-hardware test — server on Mac, client on the Pi (multi-user)

A first end-to-end run on the actual Waveshare panel. The server stays on your
Mac; the Pi runs only the Python client.

## 1. Mac — start the server (multi-user)

```bash
# in the repo root
MAC_IP=$(ipconfig getifaddr en0)        # your LAN IP (en0 = Wi-Fi; try en1 if blank)
echo "studio + API at http://$MAC_IP:3000"
AUTH_MODE=multi-user pnpm --filter @quietdash/server start
```

- The server binds `0.0.0.0:3000`, so the Pi can reach it at `http://$MAC_IP:3000`.
- First time, macOS may ask to allow incoming connections for `node` — allow it.
- Open `http://$MAC_IP:3000` in a browser and **Create account**.

## 2. Pi — copy the two client files over

From the Mac (repo root):

```bash
ssh pi@192.168.1.119 'mkdir -p ~/quietdash-device'
scp device/quietdash_device.py device/provisioning.py device/run-on-pi.sh \
    pi@192.168.1.119:~/quietdash-device/
```

## 3. Pi — free the panel, then run

Only one process can drive the e-ink panel at a time, so stop the existing one:

```bash
ssh pi@192.168.1.119
sudo systemctl stop focus-board     # whatever currently runs focus_live.py
cd ~/quietdash-device
chmod +x run-on-pi.sh
./run-on-pi.sh http://<MAC_IP>:3000
```

The panel renders a **QR claim screen**. Scan it with your phone (or open
`http://<MAC_IP>:3000/pair?code=...`), and you'll see *"Pair this panel?"* in
your account → **Approve**. The panel switches to the live clock, and the device
shows up **online** on your dashboard.

## Notes / gotchas
- Panel variant: the client imports `waveshare_epd.epd7in5_V2`. If your panel is
  a different model, edit the import in `quietdash_device.py` (`WaveshareBackend`).
- No panel output? It falls back to saving the PNG to `/tmp/quietdash-latest.png`
  and printing the claim URL — check the console.
- Re-test from scratch: `rm ~/.quietdash/state.json` on the Pi (drops the token),
  and Unpair the device in the studio.
- mDNS: this uses the explicit `QUIETDASH_SERVER_URL`, so discovery is bypassed.
  To try auto-discovery instead, omit the URL (needs `zeroconf` + working
  multicast on the LAN).
