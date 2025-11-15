#!/usr/bin/python3
# -*- coding:utf-8 -*-
"""
SNCF Train Schedule Dashboard for Waveshare 7.5" e-Paper
Displays upcoming train departures in a clean, minimal design
"""

import sys
import os
import logging
import traceback
from datetime import datetime, timedelta
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
    Generate mock SNCF train schedule data

    Returns:
        dict with station info and train departures
    """
    now = datetime.now()

    # Destinations for trains from Paris
    destinations = [
        "Lyon Part-Dieu",
        "Marseille St-Charles",
        "Bordeaux St-Jean",
        "Lille Europe",
        "Strasbourg",
        "Nantes",
        "Toulouse Matabiau",
        "Rennes",
        "Nice Ville",
        "Montpellier St-Roch",
    ]

    # Generate 5 upcoming trains
    trains = []
    base_time = now + timedelta(minutes=random.randint(5, 20))

    statuses = ["On Time", "On Time", "On Time", "Delayed 5 min", "Boarding"]
    train_types = ["TGV", "TGV INOUI", "INTERCITÉS", "TER"]

    for i in range(5):
        departure_time = base_time + timedelta(minutes=i * random.randint(15, 45))
        destination = random.choice(destinations)
        destinations.remove(destination)  # Avoid duplicates

        train = {
            'time': departure_time.strftime('%H:%M'),
            'destination': destination,
            'platform': str(random.randint(1, 23)),
            'status': random.choice(statuses),
            'train_type': random.choice(train_types),
            'number': f"{random.randint(6000, 9999)}",
        }
        trains.append(train)

    data = {
        'station': 'Paris Gare de Lyon',
        'current_time': now.strftime('%H:%M'),
        'current_date': now.strftime('%A %d %B %Y'),
        'trains': trains,
    }

    logging.info(f"Generated train schedule for {data['station']}: {len(trains)} trains")
    return data


class TrainScheduleDisplay:
    """Manages the train schedule e-ink display"""

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
                    fonts['title'] = ImageFont.truetype(font_path, 48)
                    fonts['large'] = ImageFont.truetype(font_path, 32)
                    fonts['medium'] = ImageFont.truetype(font_path, 24)
                    fonts['small'] = ImageFont.truetype(font_path, 20)
                    fonts['tiny'] = ImageFont.truetype(font_path, 16)
                    logging.info(f"Loaded fonts from {font_path}")
                    return fonts
                except Exception as e:
                    logging.warning(f"Failed to load font from {font_path}: {e}")
                    continue

        # Fallback to default font
        logging.warning("Using default fonts")
        fonts['title'] = ImageFont.load_default()
        fonts['large'] = ImageFont.load_default()
        fonts['medium'] = ImageFont.load_default()
        fonts['small'] = ImageFont.load_default()
        fonts['tiny'] = ImageFont.load_default()
        return fonts

    def draw_dashboard(self, data):
        """
        Draw train schedule dashboard on the e-Paper display

        Args:
            data: Dictionary with train schedule data
        """
        if not self.epd:
            logging.error("Display not initialized")
            return False

        try:
            logging.info("Creating train schedule dashboard...")

            # Create a new 1-bit image (255 = white background)
            image = Image.new('1', (self.display_width, self.display_height), 255)
            draw = ImageDraw.Draw(image)

            # Load fonts
            fonts = self.load_fonts()

            margin = 20

            # Header section
            header_height = 80

            # Station name (left, keep Gare de)
            station_text = data['station'].replace("Paris ", "")
            draw.text((margin, margin), station_text, font=fonts['title'], fill=0)

            # Current time (right)
            time_text = data['current_time']
            try:
                bbox = draw.textbbox((0, 0), time_text, font=fonts['large'])
                time_width = bbox[2] - bbox[0]
            except AttributeError:
                time_width, _ = draw.textsize(time_text, font=fonts['large'])

            time_x = self.display_width - margin - time_width
            draw.text((time_x, margin + 5), time_text, font=fonts['large'], fill=0)

            # Separator line (no date)
            separator_y = 65
            draw.line((margin, separator_y, self.display_width - margin, separator_y), fill=0, width=2)

            # Table header
            table_start_y = separator_y + 20
            header_y = table_start_y

            # Column headers (adjusted spacing)
            col_time_x = margin + 5
            col_train_x = margin + 80
            col_destination_x = margin + 190
            col_platform_x = margin + 500
            col_status_x = margin + 600

            # Draw header background (light rectangle effect with border)
            header_box_height = 30
            draw.rectangle(
                [(margin, header_y), (self.display_width - margin, header_y + header_box_height)],
                outline=0,
                width=2
            )

            # Header text (shorter labels)
            draw.text((col_time_x, header_y + 5), "TIME", font=fonts['tiny'], fill=0)
            draw.text((col_train_x, header_y + 5), "TRAIN", font=fonts['tiny'], fill=0)
            draw.text((col_destination_x, header_y + 5), "DESTINATION", font=fonts['tiny'], fill=0)
            draw.text((col_platform_x, header_y + 5), "PLAT", font=fonts['tiny'], fill=0)
            draw.text((col_status_x, header_y + 5), "STATUS", font=fonts['tiny'], fill=0)

            # Table rows
            row_height = 45
            table_data_start_y = header_y + header_box_height

            for i, train in enumerate(data['trains']):
                row_y = table_data_start_y + (i * row_height)

                # Draw row separator
                draw.line((margin, row_y, self.display_width - margin, row_y), fill=0, width=1)

                # Row content (vertically centered in row)
                text_y = row_y + 10

                # Time
                draw.text((col_time_x, text_y), train['time'], font=fonts['small'], fill=0)

                # Train type only (no number)
                train_type_short = train['train_type'][:3]  # TGV, TER, etc.
                draw.text((col_train_x, text_y), train_type_short, font=fonts['tiny'], fill=0)

                # Destination (truncated more aggressively)
                destination = train['destination']
                if len(destination) > 18:
                    destination = destination[:15] + ".."
                draw.text((col_destination_x, text_y), destination, font=fonts['small'], fill=0)

                # Platform (medium size, not large)
                platform_text = train['platform']
                try:
                    bbox = draw.textbbox((0, 0), platform_text, font=fonts['medium'])
                    platform_width = bbox[2] - bbox[0]
                except AttributeError:
                    platform_width, _ = draw.textsize(platform_text, font=fonts['medium'])

                # Center platform in column
                platform_x = col_platform_x + (70 - platform_width) // 2
                draw.text((platform_x, text_y), platform_text, font=fonts['medium'], fill=0)

                # Status (shortened)
                status = train['status']
                if "Delayed" in status:
                    status = "Late"
                elif "On Time" in status:
                    status = "OK"
                elif "Boarding" in status:
                    status = "Board"

                if "Late" in status or "Cancelled" in status:
                    # Draw a box around delayed/cancelled trains
                    draw.rectangle(
                        [(col_status_x - 2, text_y - 2), (self.display_width - margin - 10, text_y + 20)],
                        outline=0,
                        width=2
                    )

                draw.text((col_status_x + 5, text_y), status, font=fonts['tiny'], fill=0)

            # Bottom separator
            final_row_y = table_data_start_y + (len(data['trains']) * row_height)
            draw.line((margin, final_row_y, self.display_width - margin, final_row_y), fill=0, width=1)

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
    """Main function to display train schedule dashboard"""
    display = TrainScheduleDisplay()

    try:
        # Initialize display
        if not display.init_display():
            logging.error("Failed to initialize display, exiting...")
            return 1

        # Generate mock data
        data = generate_mock_data()

        # Log the data
        logging.info("Train schedule data:")
        logging.info(f"  Station: {data['station']}")
        logging.info(f"  Current time: {data['current_time']}")
        logging.info(f"  Trains: {len(data['trains'])}")
        for train in data['trains']:
            logging.info(f"    {train['time']} → {train['destination']} (Platform {train['platform']})")

        # Draw the dashboard
        if not display.draw_dashboard(data):
            logging.error("Failed to draw dashboard")
            return 1

        logging.info("Train schedule dashboard displayed successfully!")
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
