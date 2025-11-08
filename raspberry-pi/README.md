# Vitrine.io Raspberry Pi E-Ink Display Client

This script fetches your personalized dashboard image from the Vitrine.io API and displays it on a Waveshare 7.5" e-Paper display connected to your Raspberry Pi.

## Hardware Requirements

- Raspberry Pi (any model with GPIO)
- Waveshare 7.5" e-Paper display (800×480, Model B075R4QY3L)
- Internet connection

## Installation

### 1. Install Waveshare e-Paper Library

First, install the Waveshare e-Paper library on your Raspberry Pi:

```bash
# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Enable SPI interface (required for e-Paper)
sudo raspi-config
# Navigate to: Interface Options -> SPI -> Enable

# Install dependencies
sudo apt-get install -y python3-pip python3-pil python3-numpy
sudo pip3 install RPi.GPIO spidev

# Clone Waveshare e-Paper library
cd ~
git clone https://github.com/waveshareteam/e-Paper.git
cd e-Paper/RaspberryPi_JetsonNano/python
sudo python3 setup.py install
```

### 2. Install Vitrine Display Client

```bash
# Create directory for the display client
mkdir -p ~/vitrine-display
cd ~/vitrine-display

# Copy the script and requirements
# (Transfer vitrine_display.py and requirements.txt to this directory)

# Install Python dependencies
pip3 install -r requirements.txt
```

### 3. Configure the Client

Create a `.env` file with your API credentials:

```bash
cp .env.example .env
nano .env
```

Edit the values:
- `VITRINE_API_URL`: Your Vitrine.io API server URL
- `VITRINE_EMAIL`: Your registered email
- `VITRINE_PASSWORD`: Your password
- `VITRINE_REFRESH_INTERVAL`: How often to refresh (in seconds)

### 4. Test the Script

Run the script manually to test:

```bash
cd ~/vitrine-display
python3 vitrine_display.py
```

Press `Ctrl+C` to stop.

## Running as a Service (Auto-start on Boot)

To make the display update automatically on boot:

### 1. Install the Service

```bash
# Copy service file
sudo cp vitrine-display.service /etc/systemd/system/

# Edit the service file if needed (adjust paths and user)
sudo nano /etc/systemd/system/vitrine-display.service

# Reload systemd
sudo systemctl daemon-reload

# Enable the service
sudo systemctl enable vitrine-display.service

# Start the service
sudo systemctl start vitrine-display.service
```

### 2. Check Service Status

```bash
# Check if running
sudo systemctl status vitrine-display.service

# View logs
sudo journalctl -u vitrine-display.service -f
```

### 3. Manage the Service

```bash
# Stop the service
sudo systemctl stop vitrine-display.service

# Restart the service
sudo systemctl restart vitrine-display.service

# Disable auto-start
sudo systemctl disable vitrine-display.service
```

## Manual Usage

Run once without service:

```bash
# With environment variables
export VITRINE_API_URL=http://your-server:3000
export VITRINE_EMAIL=your-email@example.com
export VITRINE_PASSWORD=your-password
python3 vitrine_display.py
```

Or with .env file:

```bash
# Load .env and run
set -a
source .env
set +a
python3 vitrine_display.py
```

## Troubleshooting

### Display not working

1. Check SPI is enabled:
   ```bash
   lsmod | grep spi
   ```
   Should show `spi_bcm2835` or similar.

2. Check connections:
   - Ensure the display is properly connected to GPIO pins
   - Verify power supply is adequate (e-Paper draws current during refresh)

3. Test Waveshare library:
   ```bash
   cd ~/e-Paper/RaspberryPi_JetsonNano/python/examples
   python3 epd_7in5_test.py
   ```

### Authentication errors

1. Verify API is accessible:
   ```bash
   curl http://your-server:3000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"your-email","password":"your-password"}'
   ```

2. Check credentials in `.env` file

3. Ensure API server is running and accessible from Raspberry Pi

### Image not displaying

1. Check logs:
   ```bash
   sudo journalctl -u vitrine-display.service -n 50
   ```

2. Verify image is being fetched:
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://your-server:3000/display/image \
     --output test.png
   ```

## Configuration Options

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `VITRINE_API_URL` | `http://localhost:3000` | API server URL |
| `VITRINE_EMAIL` | `test@vitrine.io` | User email for authentication |
| `VITRINE_PASSWORD` | `TestPassword123` | User password |
| `VITRINE_REFRESH_INTERVAL` | `300` | Refresh interval in seconds (5 min) |

## Script Features

- ✅ Automatic authentication with JWT token refresh
- ✅ Periodic display updates
- ✅ Error handling and retry logic
- ✅ Power-saving sleep mode between updates
- ✅ Proper cleanup on exit
- ✅ Logging for debugging
- ✅ Systemd service integration

## Display Behavior

1. **Initialization**: Clears the display on startup
2. **Update Cycle**: Fetches image from API every `REFRESH_INTERVAL` seconds
3. **Image Processing**: Converts to 1-bit B&W format for e-Paper
4. **Error Handling**: Continues running on fetch errors, retries on next cycle
5. **Sleep Mode**: Display enters low-power mode between updates
6. **Shutdown**: Graceful cleanup on Ctrl+C or service stop

## Power Consumption

- **Active refresh**: ~100-200mA (brief, during image update)
- **Sleep mode**: ~1-5mA (between refreshes)
- **Recommended**: Use official Raspberry Pi power supply (5V 3A)

## Notes

- E-Paper displays have a limited refresh rate (~2-3 seconds per full refresh)
- Avoid refreshing too frequently to extend display lifespan (recommended: 5-30 minutes)
- The display retains the image even when powered off (bistable display)
- First refresh after power-on may take longer

## License

This script is part of the Vitrine.io project.
