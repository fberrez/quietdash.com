#!/bin/bash
# QuietDash.io E-Ink Display - Installation Script for Raspberry Pi

set -e

echo "========================================"
echo "QuietDash.io E-Ink Display - Installation"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running on Raspberry Pi
if ! grep -q "Raspberry Pi" /proc/cpuinfo 2>/dev/null; then
    echo -e "${YELLOW}Warning: This doesn't appear to be a Raspberry Pi${NC}"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo -e "${RED}Error: Please run this script as a normal user (not root)${NC}"
    echo "The script will use sudo when needed"
    exit 1
fi

# Get the script directory early (before any cd commands)
SCRIPT_SOURCE="${BASH_SOURCE[0]}"
# Expand tilde if present
if [[ "$SCRIPT_SOURCE" == ~* ]]; then
    SCRIPT_SOURCE="${SCRIPT_SOURCE/#\~/$HOME}"
fi
SCRIPT_DIR="$( cd "$( dirname "$SCRIPT_SOURCE" )" && pwd )"

echo -e "${GREEN}Step 1: Installing system dependencies...${NC}"
sudo apt-get update
sudo apt-get install -y python3-pip python3-pil python3-numpy python3-venv git

echo ""
echo -e "${GREEN}Step 2: Checking SPI interface...${NC}"
if ! lsmod | grep -q spi_bcm2835; then
    echo -e "${YELLOW}SPI interface not enabled. You need to enable it in raspi-config.${NC}"
    echo "Run: sudo raspi-config"
    echo "Then: Interface Options -> SPI -> Enable"
    echo "After enabling SPI, reboot and run this script again."
    read -p "Do you want to open raspi-config now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sudo raspi-config
    fi
    exit 1
else
    echo -e "${GREEN}✓ SPI interface is enabled${NC}"
fi

echo ""
echo -e "${GREEN}Step 3: Installing Waveshare e-Paper library...${NC}"
EPAPER_DIR="$HOME/e-Paper"
if [ -d "$EPAPER_DIR" ]; then
    echo "Waveshare library already exists at $EPAPER_DIR"
    read -p "Update it? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cd "$EPAPER_DIR"
        git pull
    fi
else
    cd "$HOME"
    git clone https://github.com/waveshareteam/e-Paper.git
fi

echo -e "${GREEN}✓ Waveshare library cloned${NC}"

echo ""
echo -e "${GREEN}Step 4: Creating QuietDash display directory...${NC}"
QUIETDASH_DIR="$HOME/quietdash-display"
mkdir -p "$QUIETDASH_DIR"

# Copy files from script directory
echo "Copying files from $SCRIPT_DIR to $QUIETDASH_DIR..."
if [ ! -f "$SCRIPT_DIR/quietdash_display.py" ]; then
    echo -e "${RED}Error: quietdash_display.py not found in $SCRIPT_DIR${NC}"
    exit 1
fi
cp "$SCRIPT_DIR/quietdash_display.py" "$QUIETDASH_DIR/"
cp "$SCRIPT_DIR/requirements.txt" "$QUIETDASH_DIR/"
if [ -f "$SCRIPT_DIR/.env.example" ]; then
    cp "$SCRIPT_DIR/.env.example" "$QUIETDASH_DIR/"
fi

# Make script executable
chmod +x "$QUIETDASH_DIR/quietdash_display.py"

echo ""
echo -e "${GREEN}Step 5: Creating virtual environment and installing Python dependencies...${NC}"
cd "$QUIETDASH_DIR"
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo -e "${GREEN}✓ Virtual environment created${NC}"
fi
source venv/bin/activate
pip install --upgrade pip
pip install setuptools wheel
pip install -r requirements.txt
echo -e "${GREEN}✓ Python dependencies installed${NC}"

# Install Waveshare library in venv
echo ""
echo -e "${GREEN}Installing Waveshare e-Paper library in virtual environment...${NC}"
cd "$EPAPER_DIR/RaspberryPi_JetsonNano/python"
# Clean any previous build artifacts
rm -rf build dist *.egg-info 2>/dev/null || true
# Install using pip instead of setup.py (more modern and handles permissions better)
pip install -e .
echo -e "${GREEN}✓ Waveshare library installed in venv${NC}"

deactivate

echo ""
echo -e "${GREEN}Step 6: Creating configuration file...${NC}"
if [ -f "$QUIETDASH_DIR/.env" ]; then
    echo -e "${YELLOW}.env file already exists, skipping...${NC}"
else
    echo "Please provide your QuietDash.io API configuration:"

    read -p "API URL (e.g., http://192.168.1.100:3000): " api_url
    read -p "Email: " email
    read -sp "Password: " password
    echo
    read -p "Refresh interval in seconds (default: 300): " refresh_interval
    refresh_interval=${refresh_interval:-300}

    cat > "$QUIETDASH_DIR/.env" <<EOF
# QuietDash.io API Configuration
QUIETDASH_API_URL=${api_url}
QUIETDASH_EMAIL=${email}
QUIETDASH_PASSWORD=${password}

# Refresh interval in seconds
QUIETDASH_REFRESH_INTERVAL=${refresh_interval}
EOF
    echo -e "${GREEN}✓ Configuration saved to $QUIETDASH_DIR/.env${NC}"
fi

echo ""
echo -e "${GREEN}Step 7: Testing the display...${NC}"
read -p "Do you want to test the display now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Starting test... (Press Ctrl+C to stop)"
    cd "$QUIETDASH_DIR"
    set -a
    source .env
    set +a
    source venv/bin/activate
    python quietdash_display.py
    deactivate
fi

echo ""
echo -e "${GREEN}Step 8: Setting up systemd service (optional)...${NC}"
read -p "Do you want to enable auto-start on boot? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Update service file with actual paths
    sed "s|/home/pi/quietdash-display|$QUIETDASH_DIR|g" "$SCRIPT_DIR/quietdash-display.service" | \
    sed "s|User=pi|User=$USER|g" | \
    sed "s|/usr/bin/python3|$QUIETDASH_DIR/venv/bin/python|g" | \
    sudo tee /etc/systemd/system/quietdash-display.service > /dev/null

    sudo systemctl daemon-reload
    sudo systemctl enable quietdash-display.service

    echo -e "${GREEN}✓ Service installed and enabled${NC}"

    read -p "Start the service now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sudo systemctl start quietdash-display.service
        echo ""
        echo "Service started. Check status with:"
        echo "  sudo systemctl status quietdash-display.service"
        echo ""
        echo "View logs with:"
        echo "  sudo journalctl -u quietdash-display.service -f"
    fi
fi

echo ""
echo -e "${GREEN}========================================"
echo "Installation Complete! ✓"
echo "========================================${NC}"
echo ""
echo "Files installed to: $QUIETDASH_DIR"
echo ""
echo "Next steps:"
echo "  1. To run manually: cd $QUIETDASH_DIR && source venv/bin/activate && python quietdash_display.py"
echo "  2. To check service: sudo systemctl status quietdash-display.service"
echo "  3. To view logs: sudo journalctl -u quietdash-display.service -f"
echo ""
echo "Configuration: $QUIETDASH_DIR/.env"
echo ""
