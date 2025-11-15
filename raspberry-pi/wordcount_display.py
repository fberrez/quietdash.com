#!/usr/bin/python3
# -*- coding:utf-8 -*-
"""
Word Count Display for Waveshare 7.5" e-Paper
Displays total word count and a 7-day bar chart on e-ink display
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


def generate_mock_data(days=7):
    """
    Generate mock word count data for the last N days

    Args:
        days: Number of days of data to generate

    Returns:
        List of tuples (date, word_count)
    """
    data = []
    today = datetime.now()

    for i in range(days - 1, -1, -1):
        date = today - timedelta(days=i)
        # Generate realistic word counts (between 500 and 3000 words per day)
        word_count = random.randint(500, 3000)
        data.append((date, word_count))

    logging.info(f"Generated mock data for {days} days")
    return data


class WordCountDisplay:
    """Manages the word count e-ink display"""

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
            '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
            '/System/Library/Fonts/Helvetica.ttc',
        ]

        fonts = {}

        for font_path in font_paths:
            if os.path.exists(font_path):
                try:
                    fonts['title'] = ImageFont.truetype(font_path, 60)
                    fonts['large'] = ImageFont.truetype(font_path, 32)
                    fonts['medium'] = ImageFont.truetype(font_path, 24)
                    fonts['small'] = ImageFont.truetype(font_path, 16)
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
        return fonts

    def draw_wordcount_chart(self, word_data):
        """
        Draw word count chart on the e-Paper display

        Args:
            word_data: List of tuples (date, word_count)
        """
        if not self.epd:
            logging.error("Display not initialized")
            return False

        try:
            logging.info("Creating word count chart...")

            # Create a new 1-bit image (255 = white background)
            image = Image.new('1', (self.display_width, self.display_height), 255)
            draw = ImageDraw.Draw(image)

            # Load fonts
            fonts = self.load_fonts()

            # Calculate total word count
            total_words = sum(count for _, count in word_data)

            # Draw title with total word count
            title_text = f"{total_words:,} words"
            subtitle_text = "Total Written"

            # Draw title (centered at top)
            try:
                bbox = draw.textbbox((0, 0), title_text, font=fonts['title'])
                title_width = bbox[2] - bbox[0]
            except AttributeError:
                title_width, _ = draw.textsize(title_text, font=fonts['title'])

            title_x = (self.display_width - title_width) // 2
            draw.text((title_x, 20), title_text, font=fonts['title'], fill=0)

            # Draw subtitle
            try:
                bbox = draw.textbbox((0, 0), subtitle_text, font=fonts['medium'])
                subtitle_width = bbox[2] - bbox[0]
            except AttributeError:
                subtitle_width, _ = draw.textsize(subtitle_text, font=fonts['medium'])

            subtitle_x = (self.display_width - subtitle_width) // 2
            draw.text((subtitle_x, 90), subtitle_text, font=fonts['medium'], fill=0)

            # Draw separator line
            draw.line((50, 130, self.display_width - 50, 130), fill=0, width=2)

            # Chart area configuration
            chart_top = 160
            chart_bottom = self.display_height - 80
            chart_left = 60
            chart_right = self.display_width - 60
            chart_height = chart_bottom - chart_top
            chart_width = chart_right - chart_left

            # Calculate bar width and spacing
            num_bars = len(word_data)
            bar_spacing = 10
            bar_width = (chart_width - (num_bars - 1) * bar_spacing) // num_bars

            # Find max word count for scaling
            max_count = max(count for _, count in word_data) if word_data else 1

            # Draw bars
            for i, (date, count) in enumerate(word_data):
                # Calculate bar position
                x = chart_left + i * (bar_width + bar_spacing)

                # Calculate bar height (proportional to count)
                bar_height = int((count / max_count) * chart_height)
                y_top = chart_bottom - bar_height

                # Draw bar
                draw.rectangle(
                    [(x, y_top), (x + bar_width, chart_bottom)],
                    fill=0,
                    outline=0
                )

                # Draw word count above bar
                count_text = f"{count:,}"
                try:
                    bbox = draw.textbbox((0, 0), count_text, font=fonts['small'])
                    count_width = bbox[2] - bbox[0]
                except AttributeError:
                    count_width, _ = draw.textsize(count_text, font=fonts['small'])

                count_x = x + (bar_width - count_width) // 2
                count_y = y_top - 20
                draw.text((count_x, count_y), count_text, font=fonts['small'], fill=0)

                # Draw date label below chart
                day_name = date.strftime('%a')  # Mon, Tue, etc.
                date_str = date.strftime('%m/%d')

                try:
                    bbox = draw.textbbox((0, 0), day_name, font=fonts['small'])
                    day_width = bbox[2] - bbox[0]
                except AttributeError:
                    day_width, _ = draw.textsize(day_name, font=fonts['small'])

                day_x = x + (bar_width - day_width) // 2
                draw.text((day_x, chart_bottom + 10), day_name, font=fonts['small'], fill=0)

                try:
                    bbox = draw.textbbox((0, 0), date_str, font=fonts['small'])
                    date_width = bbox[2] - bbox[0]
                except AttributeError:
                    date_width, _ = draw.textsize(date_str, font=fonts['small'])

                date_x = x + (bar_width - date_width) // 2
                draw.text((date_x, chart_bottom + 30), date_str, font=fonts['small'], fill=0)

            # Draw axis lines
            draw.line((chart_left, chart_bottom, chart_right, chart_bottom), fill=0, width=2)  # X-axis
            draw.line((chart_left, chart_top, chart_left, chart_bottom), fill=0, width=2)  # Y-axis

            # Rotate image 180 degrees for upside-down display
            logging.info("Rotating image 180 degrees...")
            image = image.rotate(180)

            # Display the image
            logging.info(f"Displaying chart on e-Paper (size: {image.size}, mode: {image.mode})...")
            buffer = self.epd.getbuffer(image)
            self.epd.display(buffer)
            logging.info("Chart displayed successfully")
            return True

        except Exception as e:
            logging.error(f"Failed to draw chart: {e}")
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
    """Main function to display word count chart"""
    display = WordCountDisplay()

    try:
        # Initialize display
        if not display.init_display():
            logging.error("Failed to initialize display, exiting...")
            return 1

        # Generate mock data for 7 days
        word_data = generate_mock_data(days=7)

        # Log the data
        logging.info("Word count data:")
        for date, count in word_data:
            logging.info(f"  {date.strftime('%Y-%m-%d')}: {count:,} words")

        total = sum(count for _, count in word_data)
        logging.info(f"Total: {total:,} words")

        # Draw the chart
        if not display.draw_wordcount_chart(word_data):
            logging.error("Failed to draw chart")
            return 1

        logging.info("Word count chart displayed successfully!")
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
