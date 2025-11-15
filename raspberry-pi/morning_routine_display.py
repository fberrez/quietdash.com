#!/usr/bin/python3
# -*- coding:utf-8 -*-
"""
Morning Routine Dashboard for Waveshare 7.5" e-Paper
Displays time, weather, calendar events, and daily quote
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
    Generate mock data for morning routine dashboard

    Returns:
        dict with time, weather, calendar, and quote data
    """
    now = datetime.now()

    # Weather conditions
    weather_conditions = [
        ("Sunny", "☀️", 22),
        ("Partly Cloudy", "⛅", 19),
        ("Cloudy", "☁️", 17),
        ("Rainy", "🌧️", 15),
        ("Clear", "🌙", 20)
    ]

    condition, icon, temp = random.choice(weather_conditions)

    # Calendar events
    events = [
        ("Team Standup", "9:30 AM", "Office"),
        ("Client Meeting", "11:00 AM", "Zoom"),
        ("Lunch with Sarah", "12:30 PM", "Café de Flore"),
        ("Code Review", "2:00 PM", "Conference Room"),
        ("Gym", "6:00 PM", "Fitness Club"),
        ("Dentist Appointment", "10:00 AM", "Dr. Martin's Office"),
        ("Project Demo", "3:30 PM", "Main Hall"),
    ]

    # Select 3 random events
    selected_events = random.sample(events, 3)
    selected_events.sort(key=lambda x: x[1])  # Sort by time

    # Daily quotes
    quotes = [
        "Start where you are. Use what you have. Do what you can.",
        "The best time to plant a tree was 20 years ago. The second best time is now.",
        "Small daily improvements are the key to staggering long-term results.",
        "Focus on being productive instead of busy.",
        "Don't watch the clock; do what it does. Keep going.",
        "The secret of getting ahead is getting started.",
        "It always seems impossible until it's done.",
    ]

    quote = random.choice(quotes)

    data = {
        'time': now.strftime('%H:%M'),
        'date': now.strftime('%A, %B %d'),
        'weather': {
            'condition': condition,
            'icon': icon,
            'temp': temp,
            'humidity': random.randint(40, 80),
        },
        'events': selected_events,
        'quote': quote,
    }

    logging.info(f"Generated morning routine data: {now.strftime('%Y-%m-%d %H:%M')}")
    return data


class MorningRoutineDisplay:
    """Manages the morning routine e-ink display"""

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
                    fonts['huge'] = ImageFont.truetype(font_path, 120)
                    fonts['title'] = ImageFont.truetype(font_path, 48)
                    fonts['large'] = ImageFont.truetype(font_path, 32)
                    fonts['medium'] = ImageFont.truetype(font_path, 24)
                    fonts['small'] = ImageFont.truetype(font_path, 18)
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
        return fonts

    def draw_dashboard(self, data):
        """
        Draw morning routine dashboard on the e-Paper display

        Args:
            data: Dictionary with time, weather, calendar, and quote data
        """
        if not self.epd:
            logging.error("Display not initialized")
            return False

        try:
            logging.info("Creating morning routine dashboard...")

            # Create a new 1-bit image (255 = white background)
            image = Image.new('1', (self.display_width, self.display_height), 255)
            draw = ImageDraw.Draw(image)

            # Load fonts
            fonts = self.load_fonts()

            # Layout configuration
            margin = 20

            # Draw time at top center (smaller to avoid overlap)
            time_text = data['time']
            try:
                bbox = draw.textbbox((0, 0), time_text, font=fonts['title'])
                time_width = bbox[2] - bbox[0]
                time_height = bbox[3] - bbox[1]
            except AttributeError:
                time_width, time_height = draw.textsize(time_text, font=fonts['title'])

            time_x = (self.display_width - time_width) // 2
            time_y = margin
            draw.text((time_x, time_y), time_text, font=fonts['title'], fill=0)

            # Draw date below time
            date_text = data['date']
            try:
                bbox = draw.textbbox((0, 0), date_text, font=fonts['small'])
                date_width = bbox[2] - bbox[0]
            except AttributeError:
                date_width, _ = draw.textsize(date_text, font=fonts['small'])

            date_x = (self.display_width - date_width) // 2
            date_y = time_y + time_height + 10
            draw.text((date_x, date_y), date_text, font=fonts['small'], fill=0)

            # Draw horizontal separator
            separator_y = date_y + 30
            draw.line((margin, separator_y, self.display_width - margin, separator_y), fill=0, width=2)

            # Content area starts after separator
            content_top = separator_y + 20

            # Left side: Weather (40% width)
            weather_width = int(self.display_width * 0.4)
            weather_x = margin
            weather_y = content_top

            # Weather box
            weather_box_height = 140
            draw.rectangle(
                [(weather_x, weather_y), (weather_x + weather_width - 20, weather_y + weather_box_height)],
                outline=0,
                width=2
            )

            # Weather content
            weather = data['weather']
            temp_text = f"{weather['temp']}°"
            condition_text = weather['condition'][:13]  # Allow longer conditions
            humidity_text = f"{weather['humidity']}%"

            # Temperature (large)
            try:
                bbox = draw.textbbox((0, 0), temp_text, font=fonts['title'])
                temp_width = bbox[2] - bbox[0]
            except AttributeError:
                temp_width, _ = draw.textsize(temp_text, font=fonts['title'])

            temp_x = weather_x + (weather_width - 20 - temp_width) // 2
            draw.text((temp_x, weather_y + 15), temp_text, font=fonts['title'], fill=0)

            # Condition
            try:
                bbox = draw.textbbox((0, 0), condition_text, font=fonts['small'])
                cond_width = bbox[2] - bbox[0]
            except AttributeError:
                cond_width, _ = draw.textsize(condition_text, font=fonts['small'])

            cond_x = weather_x + (weather_width - 20 - cond_width) // 2
            draw.text((cond_x, weather_y + 75), condition_text, font=fonts['small'], fill=0)

            # Humidity
            try:
                bbox = draw.textbbox((0, 0), humidity_text, font=fonts['small'])
                hum_width = bbox[2] - bbox[0]
            except AttributeError:
                hum_width, _ = draw.textsize(humidity_text, font=fonts['small'])

            hum_x = weather_x + (weather_width - 20 - hum_width) // 2
            draw.text((hum_x, weather_y + 105), humidity_text, font=fonts['small'], fill=0)

            # Right side: Calendar Events (no header, more space)
            calendar_x = weather_x + weather_width + 10
            calendar_y = content_top
            calendar_width = self.display_width - calendar_x - margin

            # Events (no header, more spacing)
            event_y = calendar_y + 10
            line_height = 40

            for i, (title, time, location) in enumerate(data['events']):
                y = event_y + (i * line_height)

                # Time
                draw.text((calendar_x, y), time, font=fonts['small'], fill=0)

                # Title only (no location, more spacing from time)
                title_short = title[:22] + ".." if len(title) > 22 else title
                draw.text((calendar_x + 100, y), title_short, font=fonts['small'], fill=0)

            # No quote section - removed for minimalism

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
    """Main function to display morning routine dashboard"""
    display = MorningRoutineDisplay()

    try:
        # Initialize display
        if not display.init_display():
            logging.error("Failed to initialize display, exiting...")
            return 1

        # Generate mock data
        data = generate_mock_data()

        # Log the data
        logging.info("Morning routine data:")
        logging.info(f"  Time: {data['time']}")
        logging.info(f"  Date: {data['date']}")
        logging.info(f"  Weather: {data['weather']['temp']}°C, {data['weather']['condition']}")
        logging.info(f"  Events: {len(data['events'])}")
        logging.info(f"  Quote: {data['quote'][:50]}...")

        # Draw the dashboard
        if not display.draw_dashboard(data):
            logging.error("Failed to draw dashboard")
            return 1

        logging.info("Morning routine dashboard displayed successfully!")
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
