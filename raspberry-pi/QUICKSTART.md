# Vitrine.io E-Ink Display - Quick Start

## For Raspberry Pi Setup

### 1. Transfer Files to Raspberry Pi

Copy the entire `raspberry-pi` folder to your Raspberry Pi:

```bash
# From your computer (adjust IP address):
scp -r raspberry-pi/ pi@192.168.1.xxx:~/

# Or use a USB drive, or download from GitHub, etc.
```

### 2. Run Installation Script

On your Raspberry Pi:

```bash
cd ~/raspberry-pi
chmod +x install.sh
./install.sh
```

The script will:
- ✅ Install all dependencies
- ✅ Install Waveshare e-Paper library
- ✅ Set up the display client
- ✅ Configure your API credentials
- ✅ Optionally set up auto-start service

### 3. Manual Configuration (Alternative)

If you prefer manual setup, edit the `.env` file:

```bash
cd ~/vitrine-display
cp .env.example .env
nano .env
```

Set your values:
```env
VITRINE_API_URL=http://192.168.1.100:3000  # Your API server
VITRINE_EMAIL=your-email@example.com
VITRINE_PASSWORD=your-password
VITRINE_REFRESH_INTERVAL=300  # 5 minutes
```

### 4. Test Run

```bash
cd ~/vitrine-display
python3 vitrine_display.py
```

Press `Ctrl+C` to stop.

## Quick Commands

### Service Management

```bash
# Start service
sudo systemctl start vitrine-display.service

# Stop service
sudo systemctl stop vitrine-display.service

# Restart service
sudo systemctl restart vitrine-display.service

# Check status
sudo systemctl status vitrine-display.service

# View live logs
sudo journalctl -u vitrine-display.service -f

# Enable auto-start
sudo systemctl enable vitrine-display.service

# Disable auto-start
sudo systemctl disable vitrine-display.service
```

### Manual Run

```bash
# With .env file
cd ~/vitrine-display
set -a && source .env && set +a
python3 vitrine_display.py

# With inline environment variables
VITRINE_API_URL=http://192.168.1.100:3000 \
VITRINE_EMAIL=your-email@example.com \
VITRINE_PASSWORD=your-password \
python3 ~/vitrine-display/vitrine_display.py
```

## Troubleshooting

### SPI Not Enabled

```bash
sudo raspi-config
# Interface Options -> SPI -> Enable
# Reboot after enabling
```

### Check SPI Status

```bash
lsmod | grep spi
# Should show: spi_bcm2835
```

### Test Waveshare Display

```bash
cd ~/e-Paper/RaspberryPi_JetsonNano/python/examples
python3 epd_7in5_test.py
```

### Can't Connect to API

```bash
# Test from Raspberry Pi
curl http://YOUR_API_IP:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@vitrine.io","password":"TestPassword123"}'
```

### Update Configuration

```bash
# Edit config
nano ~/vitrine-display/.env

# Restart service to apply
sudo systemctl restart vitrine-display.service
```

## File Locations

- **Scripts**: `~/vitrine-display/`
- **Service**: `/etc/systemd/system/vitrine-display.service`
- **Config**: `~/vitrine-display/.env`
- **Logs**: `sudo journalctl -u vitrine-display.service`
- **Waveshare Library**: `~/e-Paper/`

## Default Settings

| Setting | Default Value |
|---------|--------------|
| API URL | http://localhost:3000 |
| Refresh Interval | 300 seconds (5 minutes) |
| Display Size | 800×480 pixels |
| Image Format | 1-bit B&W PNG |

## Network Configuration

### Finding Your Mac's IP Address

When running the API on your Mac and connecting from Raspberry Pi on the same WiFi:

1. **On your Mac**, find your local IP address:
   ```bash
   # Option 1: Using ifconfig
   ifconfig | grep "inet " | grep -v 127.0.0.1
   
   # Option 2: Using ipconfig (macOS)
   ipconfig getifaddr en0  # For WiFi (usually en0)
   ipconfig getifaddr en1  # For Ethernet (usually en1)
   
   # Option 3: System Preferences
   # System Preferences -> Network -> Select WiFi -> Advanced -> TCP/IP
   # Look for "IPv4 Address"
   ```

2. **The API will also display your network IP** when it starts:
   ```
   Application is running on:
     - Local: http://localhost:3000
     - Network: http://192.168.1.xxx:3000  ← Use this IP on Raspberry Pi
   ```

3. **Configure Raspberry Pi** with your Mac's IP:
   ```bash
   # Edit the .env file
   nano ~/vitrine-display/.env
   
   # Set VITRINE_API_URL to your Mac's IP:
   VITRINE_API_URL=http://192.168.1.xxx:3000  # Replace xxx with your Mac's IP
   ```

### Firewall Configuration (macOS)

If the Raspberry Pi can't connect, you may need to allow incoming connections:

1. **System Preferences -> Security & Privacy -> Firewall**
   - Click the lock to make changes
   - Click "Firewall Options"
   - Add Node.js or Terminal to allowed apps
   - Or temporarily disable firewall to test

2. **Or use command line**:
   ```bash
   # Allow incoming connections on port 3000
   sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/local/bin/node
   sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblockapp /usr/local/bin/node
   ```

### Testing Connectivity

Make sure:
1. Raspberry Pi can reach your API server
2. API server is running and accessible
3. Firewall allows port 3000 (or your custom port)

Test connectivity from Raspberry Pi:
```bash
# Test ping
ping YOUR_MAC_IP

# Test API endpoint
curl http://YOUR_MAC_IP:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@vitrine.io","password":"TestPassword123"}'
```

If you get a response, the connection is working!

## Power Requirements

- Use official Raspberry Pi power supply (5V 3A recommended)
- E-Paper draws current during refresh (~100-200mA)
- Low power consumption between refreshes (~1-5mA)

## Recommended Refresh Intervals

- **Default**: 5 minutes (300s) - Good balance
- **Frequent**: 2-3 minutes - For rapidly changing data
- **Battery powered**: 10-30 minutes - Save power
- **Minimal**: 1 hour+ - Extend display lifespan

⚠️ **Note**: E-Paper displays have limited refresh cycles. Don't refresh too frequently!

## Getting Help

1. Check logs: `sudo journalctl -u vitrine-display.service -f`
2. Test API connectivity from Raspberry Pi
3. Verify .env configuration
4. Test Waveshare display with example script
5. Check GitHub issues or README.md

## Next Steps

After getting the display working:
1. Configure widget API keys in the web dashboard
2. Customize widget layout and settings
3. Add more data sources (weather, calendar, RSS)
4. Fine-tune refresh interval for your needs
