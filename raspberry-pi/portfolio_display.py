#!/usr/bin/python3
# -*- coding:utf-8 -*-
"""
PEA Portfolio Dashboard for Waveshare 7.5" e-Paper
Displays portfolio value, P&L, holdings, and sector allocation
"""

import sys
import os
import logging
import traceback
from datetime import datetime
from PIL import Image, ImageDraw, ImageFont
import random

# Add Waveshare library path
libdir = os.path.join(os.path.dirname(os.path.dirname(os.path.realpath(__file__))), 'lib')
if os.path.exists(libdir):
    sys.path.append(libdir)

from waveshare_epd import epd7in5_V2

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# Display constants
DISPLAY_WIDTH = 800
DISPLAY_HEIGHT = 480


def generate_mock_data():
    """
    Generate mock PEA portfolio data

    Returns:
        dict with portfolio value, holdings, P&L, and sector allocation
    """
    # Portfolio value
    total_value = random.uniform(25000, 75000)
    invested = random.uniform(20000, total_value)
    daily_change = random.uniform(-500, 800)
    daily_change_pct = (daily_change / total_value) * 100

    # Top holdings (French stocks for PEA)
    stock_list = [
        ("LVMH", "Luxury Goods"),
        ("TotalEnergies", "Energy"),
        ("Sanofi", "Healthcare"),
        ("BNP Paribas", "Banking"),
        ("Air Liquide", "Chemicals"),
        ("L'Oréal", "Consumer Goods"),
        ("Schneider Electric", "Industrials"),
        ("Airbus", "Aerospace"),
        ("Danone", "Food & Beverage"),
        ("Orange", "Telecom"),
    ]

    holdings = []
    total_allocation = 0

    for i in range(5):
        ticker, sector = random.choice(stock_list)
        stock_list.remove((ticker, sector))

        shares = random.randint(10, 200)
        value = random.uniform(2000, 8000)
        allocation = (value / total_value) * 100
        total_allocation += allocation

        change_pct = random.uniform(-3, 5)

        holdings.append({
            'ticker': ticker,
            'sector': sector,
            'shares': shares,
            'value': value,
            'allocation': allocation,
            'change': change_pct,
        })

    # Sort by value descending
    holdings.sort(key=lambda x: x['value'], reverse=True)

    # Sector allocation
    sectors = {}
    for holding in holdings:
        sector = holding['sector']
        if sector in sectors:
            sectors[sector] += holding['allocation']
        else:
            sectors[sector] = holding['allocation']

    # Normalize to 100%
    total_sector_pct = sum(sectors.values())
    sectors = {k: (v / total_sector_pct) * 100 for k, v in sectors.items()}

    data = {
        'total_value': total_value,
        'invested': invested,
        'total_gain': total_value - invested,
        'total_gain_pct': ((total_value - invested) / invested) * 100,
        'daily_change': daily_change,
        'daily_change_pct': daily_change_pct,
        'holdings': holdings,
        'sectors': sectors,
        'updated_at': datetime.now(),
    }

    logging.info(f"Generated portfolio data: €{total_value:,.2f}, {len(holdings)} holdings")
    return data


class PortfolioDisplay:
    """Manages the portfolio e-ink display"""

    def __init__(self):
        self.epd = None
        self.display_width = DISPLAY_WIDTH
        self.display_height = DISPLAY_HEIGHT

    def init_display(self):
        """Initialize the e-Paper display"""
        try:
            logging.info("Initializing 7.5inch e-Paper V2 display")
            self.epd = epd7in5_V2.EPD()
            self.epd.init()

            # Get display dimensions
            self.display_width = self.epd.width
            self.display_height = self.epd.height

            logging.info(f"Display dimensions: {self.display_width}x{self.display_height}")
            logging.info("Display initialized successfully")
            return True
        except Exception as e:
            logging.error(f"Failed to initialize display: {e}")
            logging.error(traceback.format_exc())
            return False

    def load_fonts(self):
        """Load fonts for the display, fallback to default if needed"""
        font_paths = [
            '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
            '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
            '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
            '/System/Library/Fonts/Helvetica.ttc',
        ]

        fonts = {}

        for font_path in font_paths:
            if os.path.exists(font_path):
                try:
                    fonts['huge'] = ImageFont.truetype(font_path, 80)
                    fonts['title'] = ImageFont.truetype(font_path, 42)
                    fonts['large'] = ImageFont.truetype(font_path, 32)
                    fonts['medium'] = ImageFont.truetype(font_path, 24)
                    fonts['small'] = ImageFont.truetype(font_path, 18)
                    fonts['tiny'] = ImageFont.truetype(font_path, 14)
                    logging.info(f"Loaded fonts from {font_path}")
                    return fonts
                except Exception as e:
                    logging.warning(f"Failed to load font from {font_path}: {e}")
                    continue

        # Fallback to default font
        logging.warning("Using default fonts")
        fonts['huge'] = ImageFont.load_default()
        fonts['title'] = ImageFont.load_default()
        fonts['large'] = ImageFont.load_default()
        fonts['medium'] = ImageFont.load_default()
        fonts['small'] = ImageFont.load_default()
        fonts['tiny'] = ImageFont.load_default()
        return fonts

    def draw_dashboard(self, data):
        """
        Draw portfolio dashboard on the e-Paper display

        Args:
            data: Dictionary with portfolio data
        """
        if not self.epd:
            logging.error("Display not initialized")
            return False

        try:
            logging.info("Creating portfolio dashboard...")

            # Create a new 1-bit image (255 = white background)
            image = Image.new('1', (self.display_width, self.display_height), 255)
            draw = ImageDraw.Draw(image)

            # Load fonts
            fonts = self.load_fonts()

            margin = 20

            # Header (minimal, just time)
            time_text = data['updated_at'].strftime('%H:%M')
            try:
                bbox = draw.textbbox((0, 0), time_text, font=fonts['medium'])
                time_width = bbox[2] - bbox[0]
            except AttributeError:
                time_width, _ = draw.textsize(time_text, font=fonts['medium'])

            time_x = self.display_width - margin - time_width
            draw.text((time_x, margin), time_text, font=fonts['medium'], fill=0)

            # Separator
            separator_y = 50
            draw.line((margin, separator_y, self.display_width - margin, separator_y), fill=0, width=2)

            # Portfolio value section
            value_y = separator_y + 20

            # Total value (large)
            value_text = f"€{data['total_value']:,.2f}"
            draw.text((margin, value_y), value_text, font=fonts['huge'], fill=0)

            # Daily change (no label)
            daily_change = data['daily_change']
            daily_pct = data['daily_change_pct']
            sign = "+" if daily_change >= 0 else ""
            change_text = f"{sign}€{daily_change:.0f} ({sign}{daily_pct:.1f}%)"

            change_y = value_y + 85
            draw.text((margin, change_y), change_text, font=fonts['small'], fill=0)

            # Total gain/loss (no label, smaller)
            total_gain = data['total_gain']
            total_gain_pct = data['total_gain_pct']
            sign = "+" if total_gain >= 0 else ""
            gain_text = f"{sign}€{total_gain:.0f} ({sign}{total_gain_pct:.1f}%)"

            gain_y = change_y + 25
            draw.text((margin, gain_y), gain_text, font=fonts['tiny'], fill=0)

            # Holdings table (no header)
            table_y = gain_y + 40

            # Table header (adjusted column positions)
            header_y = table_y + 10
            col_ticker_x = margin
            col_shares_x = margin + 150
            col_value_x = margin + 270
            col_alloc_x = margin + 420
            col_change_x = margin + 550

            draw.text((col_ticker_x, header_y), "TICKER", font=fonts['tiny'], fill=0)
            draw.text((col_shares_x, header_y), "QTY", font=fonts['tiny'], fill=0)
            draw.text((col_value_x, header_y), "VALUE", font=fonts['tiny'], fill=0)
            draw.text((col_alloc_x, header_y), "%", font=fonts['tiny'], fill=0)
            draw.text((col_change_x, header_y), "CHG", font=fonts['tiny'], fill=0)

            # Table rows
            row_height = 30
            data_y = header_y + 30

            for i, holding in enumerate(data['holdings']):
                row_y = data_y + (i * row_height)

                # Ticker (truncated)
                ticker_short = holding['ticker'][:12]
                draw.text((col_ticker_x, row_y), ticker_short, font=fonts['tiny'], fill=0)

                # Shares
                shares_text = str(holding['shares'])
                draw.text((col_shares_x, row_y), shares_text, font=fonts['tiny'], fill=0)

                # Value
                value_text = f"€{holding['value']:,.0f}"
                draw.text((col_value_x, row_y), value_text, font=fonts['tiny'], fill=0)

                # Allocation
                alloc_text = f"{holding['allocation']:.1f}%"
                draw.text((col_alloc_x, row_y), alloc_text, font=fonts['tiny'], fill=0)

                # Change
                change = holding['change']
                sign = "+" if change >= 0 else ""
                change_text = f"{sign}{change:.1f}%"
                draw.text((col_change_x, row_y), change_text, font=fonts['tiny'], fill=0)

            # No sectors section - removed

            # No footer - removed for minimalism

            # Rotate image 180 degrees for upside-down display
            logging.info("Rotating image 180 degrees...")
            image = image.rotate(180)

            # Display the image
            logging.info(f"Displaying dashboard on e-Paper (size: {image.size}, mode: {image.mode})...")
            buffer = self.epd.getbuffer(image)
            self.epd.display(buffer)
            logging.info("Dashboard displayed successfully")
            return True

        except Exception as e:
            logging.error(f"Failed to draw dashboard: {e}")
            logging.error(traceback.format_exc())
            return False

    def sleep(self):
        """Put the display to sleep to save power"""
        if self.epd:
            try:
                logging.info("Putting display to sleep...")
                self.epd.sleep()
            except Exception as e:
                logging.error(f"Failed to put display to sleep: {e}")

    def cleanup(self):
        """Clean up resources"""
        self.sleep()
        logging.info("Cleanup complete")


def main():
    """Main function to display portfolio dashboard"""
    display = PortfolioDisplay()

    try:
        # Initialize display
        if not display.init_display():
            logging.error("Failed to initialize display, exiting...")
            return 1

        # Generate mock data
        data = generate_mock_data()

        # Log the data
        logging.info("Portfolio data:")
        logging.info(f"  Total value: €{data['total_value']:,.2f}")
        logging.info(f"  Daily change: €{data['daily_change']:.2f} ({data['daily_change_pct']:.2f}%)")
        logging.info(f"  Total gain: €{data['total_gain']:.2f} ({data['total_gain_pct']:.2f}%)")
        logging.info(f"  Holdings: {len(data['holdings'])}")
        logging.info(f"  Sectors: {len(data['sectors'])}")

        # Draw the dashboard
        if not display.draw_dashboard(data):
            logging.error("Failed to draw dashboard")
            return 1

        logging.info("Portfolio dashboard displayed successfully!")
        return 0

    except KeyboardInterrupt:
        logging.info("Interrupted by user (Ctrl+C)")
    except Exception as e:
        logging.error(f"Unexpected error: {e}")
        logging.error(traceback.format_exc())
    finally:
        display.cleanup()
        logging.info("Exiting...")

    return 0


if __name__ == '__main__':
    sys.exit(main())
