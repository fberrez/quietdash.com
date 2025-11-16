#!/usr/bin/python3
# -*- coding:utf-8 -*-
"""
Weekly Planning Dashboard for Waveshare 7.5" e-Paper
Displays week overview with weather, metro status, priorities, and habits
Perfect for Sunday night planning ritual

Currently uses mock data for demo purposes.
Can be integrated with real APIs (RATP, OpenWeatherMap, Google Calendar, etc.)
"""

import sys
import os
import logging
import traceback
import math
from datetime import datetime, timedelta
from PIL import Image, ImageDraw, ImageFont
import random
from typing import List, Dict

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


def get_metro_line1_status() -> Dict:
    """
    Generate mock Metro Line 1 status

    Returns:
        dict with status info (slug, title, message)
    """
    status = {
        'slug': 'normal',
        'title': 'Line 1',
        'message': 'Traffic normal on the entire line'
    }

    logging.info(f"Mock Metro Line 1 status: {status['slug']} - {status['message']}")
    return status


def get_weather_forecast() -> List[Dict]:
    """
    Generate mock 7-day weather forecast

    Returns:
        list of dicts with daily forecast (date, temp_min, temp_max, condition, icon)
    """
    logging.info("Using mock weather data")
    return generate_mock_weather()


def generate_mock_weather() -> List[Dict]:
    """Generate mock weather data for 7 days (Paris late November)"""
    conditions = ['Clear', 'Cloudy', 'Rain', 'Overcast']
    forecast = []
    today = datetime.now()

    for i in range(7):
        date = today + timedelta(days=i)
        # Paris late November: typically 5-12°C
        temp_min = random.randint(4, 8)
        temp_max = random.randint(9, 13)
        forecast.append({
            'date': date,
            'temp_min': temp_min,
            'temp_max': temp_max,
            'condition': random.choice(conditions),
            'icon': '01d'
        })

    return forecast


def generate_mock_planning_data() -> Dict:
    """
    Generate mock planning data

    Returns:
        dict with priorities, events, intention, and habits
    """
    # Calculate week range
    today = datetime.now()
    # Get Monday of this week
    days_since_monday = (today.weekday() - 0) % 7
    monday = today - timedelta(days=days_since_monday)
    sunday = monday + timedelta(days=6)

    # Weekly priorities (balanced: work, home, personal)
    all_priorities = [
        # Work
        "Finish API documentation",
        "Review PR feedback",
        "Prepare weekly update",
        # Home
        "Deep clean kitchen",
        "Fix bathroom sink",
        "Organize closet",
        "Meal prep for week",
        "Water plants",
        # Personal
        "Call mom",
        "Read 2 chapters",
        "Plan weekend trip",
        "Book dentist appointment"
    ]
    priorities = random.sample(all_priorities, 3)

    # Key calendar events (mix of work, personal, household)
    all_events = [
        # Work
        {"day": "Mon", "time": "10:00", "title": "Team standup"},
        {"day": "Tue", "time": "14:00", "title": "Project sync"},
        {"day": "Fri", "time": "11:00", "title": "1:1 with manager"},
        # Personal
        {"day": "Mon", "time": "19:00", "title": "Yoga class"},
        {"day": "Wed", "time": "12:30", "title": "Lunch with Alex"},
        {"day": "Thu", "time": "18:30", "title": "Gym"},
        {"day": "Sat", "time": "10:00", "title": "Farmer's market"},
        # Household
        {"day": "Tue", "time": "17:00", "title": "Grocery shopping"},
        {"day": "Wed", "time": "20:00", "title": "Laundry"},
        {"day": "Sat", "time": "14:00", "title": "Garden maintenance"},
    ]
    events = sorted(random.sample(all_events, 5), key=lambda x: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].index(x['day']))

    # Habit trackers (7 days, all unchecked - week hasn't started yet)
    all_habits = [
        "Morning walk",
        "Read 30min",
        "No phone 1h",
        "Journal",
        "Meditate 10min",
        "Cook dinner",
        "Stretch",
        "Gratitude note"
    ]
    selected_habits = random.sample(all_habits, 3)
    habits = [
        {"name": habit, "days": [False] * 7}
        for habit in selected_habits
    ]

    data = {
        'week_start': monday,
        'week_end': sunday,
        'priorities': priorities,
        'events': events,
        'habits': habits,
    }

    logging.info(f"Generated planning data for week of {monday.strftime('%b %d')}")
    return data


class WeeklyPlanningDisplay:
    """Manages the weekly planning e-ink display"""

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
                    fonts['title'] = ImageFont.truetype(font_path, 32)
                    fonts['large'] = ImageFont.truetype(font_path, 26)
                    fonts['medium'] = ImageFont.truetype(font_path, 20)
                    fonts['small'] = ImageFont.truetype(font_path, 16)
                    fonts['tiny'] = ImageFont.truetype(font_path, 13)
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

    def draw_checkbox(self, draw, x, y, size, checked):
        """Draw a checkbox"""
        draw.rectangle([(x, y), (x + size, y + size)], outline=0, width=2)

        if checked:
            # Draw checkmark
            offset = size // 4
            draw.line(
                [(x + offset, y + size // 2), (x + size // 2 - 1, y + size - offset)],
                fill=0, width=2
            )
            draw.line(
                [(x + size // 2 - 1, y + size - offset), (x + size - offset, y + offset)],
                fill=0, width=2
            )

    def draw_weather_icon(self, draw, x, y, size, condition):
        """
        Draw simple weather icon for e-ink display

        Args:
            draw: ImageDraw object
            x, y: center position
            size: icon size (diameter of bounding box)
            condition: weather condition string
        """
        radius = size // 2

        if condition == 'Clear':
            # Sun: simple circle
            draw.ellipse([(x - radius, y - radius), (x + radius, y + radius)], outline=0, width=2)

        elif condition == 'Rain':
            # Rain: three vertical lines
            spacing = size // 4
            line_len = size // 2
            for i in range(3):
                line_x = x - spacing + (i * spacing)
                draw.line([(line_x, y - line_len // 2), (line_x, y + line_len // 2)], fill=0, width=2)

        elif condition == 'Cloudy':
            # Cloud: simple arc shape
            draw.arc([(x - radius, y - radius // 2), (x + radius, y + radius // 2)], start=0, end=180, fill=0, width=2)
            draw.line([(x - radius, y), (x + radius, y)], fill=0, width=2)

        elif condition == 'Overcast':
            # Overcast: filled circle
            draw.ellipse([(x - radius, y - radius), (x + radius, y + radius)], fill=0)

    def draw_dashboard(self, planning_data, weather_data, metro_status):
        """
        Draw weekly planning dashboard on the e-Paper display

        Args:
            planning_data: Dictionary with priorities, events, intention, habits
            weather_data: List of daily weather forecasts
            metro_status: Dictionary with Line 1 status
        """
        if not self.epd:
            logging.error("Display not initialized")
            return False

        try:
            logging.info("Creating weekly planning dashboard...")

            # Create a new 1-bit image (255 = white background)
            image = Image.new('1', (self.display_width, self.display_height), 255)
            draw = ImageDraw.Draw(image)

            # Load fonts
            fonts = self.load_fonts()

            margin = 15

            # Header: Week of [Date Range]
            week_text = f"WEEK OF {planning_data['week_start'].strftime('%b %d')} - {planning_data['week_end'].strftime('%b %d')}"
            draw.text((margin, margin), week_text, font=fonts['title'], fill=0)

            # Separator line
            separator_y = 55
            draw.line([(margin, separator_y), (self.display_width - margin, separator_y)], fill=0, width=2)

            # Weather Forecast Strip (7 days, text only)
            weather_y = separator_y + 15
            weather_strip_height = 55

            # Calculate spacing for 7 days
            weather_start_x = margin
            day_width = (self.display_width - 2 * margin) // 7

            for i, forecast in enumerate(weather_data[:7]):
                x = weather_start_x + (i * day_width)

                # Day name
                day_name = forecast['date'].strftime('%a')
                try:
                    bbox = draw.textbbox((0, 0), day_name, font=fonts['tiny'])
                    text_width = bbox[2] - bbox[0]
                except AttributeError:
                    text_width, _ = draw.textsize(day_name, font=fonts['tiny'])

                day_x = x + (day_width - text_width) // 2
                draw.text((day_x, weather_y), day_name, font=fonts['tiny'], fill=0)

                # Temperature range
                temp_text = f"{forecast['temp_min']}-{forecast['temp_max']}°"
                try:
                    bbox = draw.textbbox((0, 0), temp_text, font=fonts['small'])
                    temp_width = bbox[2] - bbox[0]
                except AttributeError:
                    temp_width, _ = draw.textsize(temp_text, font=fonts['small'])

                temp_x = x + (day_width - temp_width) // 2
                draw.text((temp_x, weather_y + 18), temp_text, font=fonts['small'], fill=0)

                # Condition
                condition_text = forecast['condition']
                try:
                    bbox = draw.textbbox((0, 0), condition_text, font=fonts['tiny'])
                    cond_width = bbox[2] - bbox[0]
                except AttributeError:
                    cond_width, _ = draw.textsize(condition_text, font=fonts['tiny'])

                cond_x = x + (day_width - cond_width) // 2
                draw.text((cond_x, weather_y + 40), condition_text, font=fonts['tiny'], fill=0)

            # Main content separator
            content_y = weather_y + weather_strip_height + 10
            draw.line([(margin, content_y), (self.display_width - margin, content_y)], fill=0, width=2)

            # Two column layout for content
            content_top = content_y + 15

            # Left side: Priorities (60% width)
            left_width = int(self.display_width * 0.6)

            # Section 1: Top 3 Weekly Priorities (left side)
            priorities_y = content_top
            draw.text((margin, priorities_y), "TOP 3 PRIORITIES", font=fonts['medium'], fill=0)

            priority_y = priorities_y + 26
            priority_spacing = 22
            for i, priority in enumerate(planning_data['priorities'][:3]):
                # Simple bullet point
                bullet_x = margin + 5
                y_pos = priority_y + (i * priority_spacing)
                draw.ellipse([(bullet_x, y_pos + 5), (bullet_x + 4, y_pos + 9)], fill=0)

                # Priority text
                draw.text((margin + 15, y_pos), priority[:38], font=fonts['small'], fill=0)

            # Right side: Metro Line 1 Status
            metro_x = left_width + 10
            metro_y = content_top

            draw.text((metro_x, metro_y), "LINE 1", font=fonts['medium'], fill=0)

            # Status indicator and message
            status_y = metro_y + 26
            metro_text = metro_status['message'][:28]

            # Draw status indicator based on slug
            status_x = metro_x
            if metro_status['slug'] == 'normal':
                # Green = empty square (normal)
                draw.rectangle([(status_x, status_y), (status_x + 12, status_y + 12)], outline=0, width=2)
            elif metro_status['slug'] == 'critical':
                # Red = filled square (critical)
                draw.rectangle([(status_x, status_y), (status_x + 12, status_y + 12)], fill=0)
            else:
                # Yellow = half-filled (warning)
                draw.rectangle([(status_x, status_y), (status_x + 12, status_y + 12)], outline=0, width=2)
                draw.rectangle([(status_x + 2, status_y + 7), (status_x + 10, status_y + 10)], fill=0)

            # Status message (word wrapped if needed)
            draw.text((status_x + 18, status_y - 2), metro_text, font=fonts['tiny'], fill=0)

            # Section 2: Habit Tracker (full width, horizontal)
            habits_y = priority_y + (3 * priority_spacing) + 15
            draw.text((margin, habits_y), "HABIT TRACKER", font=fonts['medium'], fill=0)

            habits_content_y = habits_y + 26
            day_names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

            # Calculate spacing
            habit_name_width = 120
            checkbox_area_width = self.display_width - margin * 2 - habit_name_width - 20
            checkbox_size = 16
            checkbox_spacing = (checkbox_area_width - 7 * checkbox_size) // 8

            # Draw day headers
            day_header_y = habits_content_y
            checkbox_start_x = margin + habit_name_width + 10
            for i, day in enumerate(day_names):
                day_x = checkbox_start_x + checkbox_spacing + i * (checkbox_size + checkbox_spacing)
                draw.text((day_x, day_header_y), day[:3], font=fonts['tiny'], fill=0)

            # Draw habits with checkboxes
            habit_y = day_header_y + 20
            habit_row_height = 26
            for habit in planning_data['habits']:
                # Habit name
                habit_name = habit['name'][:16]
                draw.text((margin, habit_y), habit_name, font=fonts['small'], fill=0)

                # 7 checkboxes
                for i, completed in enumerate(habit['days'][:7]):
                    checkbox_x = checkbox_start_x + checkbox_spacing + i * (checkbox_size + checkbox_spacing)
                    self.draw_checkbox(draw, checkbox_x, habit_y - 2, checkbox_size, completed)

                habit_y += habit_row_height

            # Section 3: Key Events (full width)
            events_y = habit_y + 15
            draw.text((margin, events_y), "KEY EVENTS", font=fonts['medium'], fill=0)

            event_y = events_y + 26
            event_spacing = 22
            for event in planning_data['events'][:5]:
                event_text = f"{event['day']:3} {event['time']} - {event['title'][:45]}"
                draw.text((margin + 10, event_y), event_text, font=fonts['small'], fill=0)
                event_y += event_spacing

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
    """Main function to display weekly planning dashboard"""
    display = WeeklyPlanningDisplay()

    try:
        # Initialize display
        if not display.init_display():
            logging.error("Failed to initialize display, exiting...")
            return 1

        # Fetch real data
        logging.info("Fetching Metro Line 1 status...")
        metro_status = get_metro_line1_status()

        logging.info("Fetching weather forecast...")
        weather_data = get_weather_forecast()

        logging.info("Generating planning data...")
        planning_data = generate_mock_planning_data()

        # Log the data
        logging.info("Weekly planning data:")
        logging.info(f"  Week: {planning_data['week_start'].strftime('%b %d')} - {planning_data['week_end'].strftime('%b %d')}")
        logging.info(f"  Metro Line 1: {metro_status['slug']} - {metro_status['message'][:50]}")
        logging.info(f"  Weather days: {len(weather_data)}")
        logging.info(f"  Priorities: {len(planning_data['priorities'])}")
        logging.info(f"  Events: {len(planning_data['events'])}")
        logging.info(f"  Habits: {len(planning_data['habits'])}")

        # Draw the dashboard
        if not display.draw_dashboard(planning_data, weather_data, metro_status):
            logging.error("Failed to draw dashboard")
            return 1

        logging.info("Weekly planning dashboard displayed successfully!")
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
