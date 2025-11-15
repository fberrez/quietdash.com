#!/usr/bin/python3
# -*- coding:utf-8 -*-
"""
Health Dashboard for Waveshare 7.5" e-Paper
Displays daily health metrics: steps, water, sleep, workouts, calories, mood
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


def generate_health_data():
    """
    Generate mock health data for dashboard

    Returns:
        dict with steps, water, sleep, workout, calories, and mood data
    """
    now = datetime.now()

    # Steps data
    daily_steps = random.randint(4500, 12000)
    steps_goal = 10000
    steps_percent = min(100, int((daily_steps / steps_goal) * 100))
    weekly_avg_steps = random.randint(7000, 9500)

    # Water intake (in glasses, 1 glass = 250ml)
    glasses_today = random.randint(4, 10)
    glasses_goal = 8
    water_liters = glasses_today * 0.25

    # Sleep data
    sleep_hours = round(random.uniform(5.5, 8.5), 1)
    weekly_avg_sleep = round(random.uniform(6.5, 7.5), 1)
    sleep_score = random.randint(65, 95)

    # Workout streak
    workout_streak = random.randint(0, 14)
    weekly_sessions = random.randint(3, 6)

    # Calories
    calories_intake = random.randint(1800, 2500)
    calories_goal = 2000
    calories_diff = calories_intake - calories_goal

    # Mood tracker (last 7 days: 1=bad, 5=great)
    mood_history = [random.randint(2, 5) for _ in range(7)]

    data = {
        'date': now.strftime('%A, %B %d'),
        'steps': {
            'today': daily_steps,
            'goal': steps_goal,
            'percent': steps_percent,
            'weekly_avg': weekly_avg_steps
        },
        'water': {
            'glasses': glasses_today,
            'goal': glasses_goal,
            'liters': water_liters
        },
        'sleep': {
            'hours': sleep_hours,
            'weekly_avg': weekly_avg_sleep,
            'score': sleep_score
        },
        'workout': {
            'streak': workout_streak,
            'weekly_sessions': weekly_sessions
        },
        'calories': {
            'intake': calories_intake,
            'goal': calories_goal,
            'diff': calories_diff
        },
        'mood': {
            'history': mood_history
        }
    }

    logging.info(f"Generated health data for {now.strftime('%Y-%m-%d')}")
    return data


class HealthDashboard:
    """Manages the health dashboard e-ink display"""

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
                    fonts['huge'] = ImageFont.truetype(font_path, 60)
                    fonts['title'] = ImageFont.truetype(font_path, 28)
                    fonts['large'] = ImageFont.truetype(font_path, 36)
                    fonts['medium'] = ImageFont.truetype(font_path, 22)
                    fonts['small'] = ImageFont.truetype(font_path, 16)
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

    def draw_progress_bar(self, draw, x, y, width, height, percent, filled=True):
        """
        Draw a progress bar

        Args:
            draw: ImageDraw object
            x, y: top-left position
            width, height: dimensions
            percent: percentage filled (0-100)
            filled: if True, fill the bar; if False, just outline
        """
        # Outer rectangle
        draw.rectangle([(x, y), (x + width, y + height)], outline=0, width=2)

        # Fill based on percentage
        if percent > 0:
            fill_width = int((width - 4) * (percent / 100))
            draw.rectangle([(x + 2, y + 2), (x + 2 + fill_width, y + height - 2)], fill=0)

    def draw_water_glass(self, draw, x, y, size, filled):
        """
        Draw a simple water glass icon

        Args:
            draw: ImageDraw object
            x, y: top-left position
            size: size of the icon
            filled: if True, fill the glass
        """
        # Glass outline (trapezoid-ish)
        points = [
            (x + size * 0.2, y),
            (x + size * 0.8, y),
            (x + size, y + size),
            (x, y + size)
        ]

        if filled:
            draw.polygon(points, outline=0, fill=0)
        else:
            draw.polygon(points, outline=0, width=2)

    def draw_flame_icon(self, draw, x, y, size):
        """
        Draw a simple flame icon for workout streak

        Args:
            draw: ImageDraw object
            x, y: top-left position
            size: size of the icon
        """
        # Simple flame shape
        points = [
            (x + size * 0.5, y),
            (x + size * 0.7, y + size * 0.3),
            (x + size, y + size * 0.6),
            (x + size * 0.5, y + size),
            (x, y + size * 0.6),
            (x + size * 0.3, y + size * 0.3)
        ]
        draw.polygon(points, fill=0)

    def draw_mood_emoji(self, draw, x, y, size, mood_level):
        """
        Draw a simple mood emoji (1=bad, 5=great)

        Args:
            draw: ImageDraw object
            x, y: center position
            size: size of the emoji
            mood_level: 1-5 mood rating
        """
        radius = size // 2

        # Face circle
        draw.ellipse([(x - radius, y - radius), (x + radius, y + radius)], outline=0, width=2)

        # Eyes
        eye_y = y - radius // 3
        eye_radius = radius // 6
        draw.ellipse(
            [(x - radius // 2 - eye_radius, eye_y - eye_radius),
             (x - radius // 2 + eye_radius, eye_y + eye_radius)],
            fill=0
        )
        draw.ellipse(
            [(x + radius // 2 - eye_radius, eye_y - eye_radius),
             (x + radius // 2 + eye_radius, eye_y + eye_radius)],
            fill=0
        )

        # Mouth (varies by mood)
        mouth_y = y + radius // 3
        mouth_width = radius

        if mood_level >= 4:  # Happy
            draw.arc(
                [(x - mouth_width, mouth_y - radius // 3),
                 (x + mouth_width, mouth_y + radius // 2)],
                start=0, end=180, fill=0, width=2
            )
        elif mood_level == 3:  # Neutral
            draw.line([(x - mouth_width, mouth_y), (x + mouth_width, mouth_y)], fill=0, width=2)
        else:  # Sad
            draw.arc(
                [(x - mouth_width, mouth_y - radius // 2),
                 (x + mouth_width, mouth_y + radius // 3)],
                start=180, end=360, fill=0, width=2
            )

    def draw_metric_box(self, draw, fonts, x, y, width, height, title, main_value, sub_values, custom_draw=None):
        """
        Draw a metric box with title, main value, and sub-values

        Args:
            draw: ImageDraw object
            fonts: dictionary of fonts
            x, y: top-left position
            width, height: dimensions
            title: title text
            main_value: main value text
            sub_values: list of sub-value texts
            custom_draw: optional function to draw custom elements
        """
        # Box outline
        draw.rectangle([(x, y), (x + width, y + height)], outline=0, width=3)

        # Title
        padding = 10
        draw.text((x + padding, y + padding), title, font=fonts['medium'], fill=0)

        # Main value (centered, large)
        try:
            bbox = draw.textbbox((0, 0), main_value, font=fonts['huge'])
            value_width = bbox[2] - bbox[0]
        except AttributeError:
            value_width, _ = draw.textsize(main_value, font=fonts['huge'])

        value_x = x + (width - value_width) // 2
        value_y = y + 50
        draw.text((value_x, value_y), main_value, font=fonts['huge'], fill=0)

        # Custom drawing area
        if custom_draw:
            custom_draw(draw, x, y, width, height)

        # Sub-values at bottom
        sub_y = y + height - 35
        for i, sub_text in enumerate(sub_values):
            draw.text((x + padding, sub_y + (i * 18)), sub_text, font=fonts['tiny'], fill=0)

    def draw_dashboard(self, data):
        """
        Draw health dashboard on the e-Paper display

        Args:
            data: Dictionary with health metrics
        """
        if not self.epd:
            logging.error("Display not initialized")
            return False

        try:
            logging.info("Creating health dashboard...")

            # Create a new 1-bit image (255 = white background)
            image = Image.new('1', (self.display_width, self.display_height), 255)
            draw = ImageDraw.Draw(image)

            # Load fonts
            fonts = self.load_fonts()

            # Header
            margin = 15
            header_text = "HEALTH DASHBOARD"
            date_text = data['date']

            draw.text((margin, margin), header_text, font=fonts['title'], fill=0)

            try:
                bbox = draw.textbbox((0, 0), date_text, font=fonts['small'])
                date_width = bbox[2] - bbox[0]
            except AttributeError:
                date_width, _ = draw.textsize(date_text, font=fonts['small'])

            date_x = self.display_width - date_width - margin
            draw.text((date_x, margin + 5), date_text, font=fonts['small'], fill=0)

            # Separator line
            separator_y = 55
            draw.line([(margin, separator_y), (self.display_width - margin, separator_y)], fill=0, width=2)

            # Grid layout: 2 rows × 3 columns
            content_top = separator_y + 15
            box_margin = 10
            box_width = (self.display_width - 2 * margin - 2 * box_margin) // 3
            box_height = (self.display_height - content_top - margin - box_margin) // 2

            # Row 1, Col 1: Steps
            steps_x = margin
            steps_y = content_top

            def draw_steps_custom(d, x, y, w, h):
                # Progress bar
                bar_y = y + 125
                self.draw_progress_bar(d, x + 20, bar_y, w - 40, 20, data['steps']['percent'])

            self.draw_metric_box(
                draw, fonts,
                steps_x, steps_y, box_width, box_height,
                "STEPS",
                f"{data['steps']['today']:,}",
                [
                    f"Goal: {data['steps']['goal']:,} ({data['steps']['percent']}%)",
                    f"Weekly avg: {data['steps']['weekly_avg']:,}"
                ],
                draw_steps_custom
            )

            # Row 1, Col 2: Water
            water_x = steps_x + box_width + box_margin
            water_y = content_top

            self.draw_metric_box(
                draw, fonts,
                water_x, water_y, box_width, box_height,
                "WATER",
                f"{data['water']['glasses']}/{data['water']['goal']}",
                [
                    f"{data['water']['liters']:.1f}L today"
                ],
                None
            )

            # Row 1, Col 3: Sleep
            sleep_x = water_x + box_width + box_margin
            sleep_y = content_top

            self.draw_metric_box(
                draw, fonts,
                sleep_x, sleep_y, box_width, box_height,
                "SLEEP",
                f"{data['sleep']['hours']}h",
                [
                    f"Score: {data['sleep']['score']}/100",
                    f"Weekly avg: {data['sleep']['weekly_avg']}h"
                ],
                None
            )

            # Row 2, Col 1: Workout Streak
            workout_x = margin
            workout_y = steps_y + box_height + box_margin

            self.draw_metric_box(
                draw, fonts,
                workout_x, workout_y, box_width, box_height,
                "WORKOUT",
                f"{data['workout']['streak']} days",
                [
                    f"This week: {data['workout']['weekly_sessions']} sessions"
                ],
                None
            )

            # Row 2, Col 2: Calories
            calories_x = workout_x + box_width + box_margin
            calories_y = workout_y

            def draw_calories_custom(d, x, y, w, h):
                # Draw +/- indicator
                diff = data['calories']['diff']
                sign = "+" if diff > 0 else ""
                diff_text = f"{sign}{diff} cal"

                try:
                    bbox = d.textbbox((0, 0), diff_text, font=fonts['medium'])
                    text_width = bbox[2] - bbox[0]
                except AttributeError:
                    text_width, _ = d.textsize(diff_text, font=fonts['medium'])

                text_x = x + (w - text_width) // 2
                text_y = y + 125
                d.text((text_x, text_y), diff_text, font=fonts['medium'], fill=0)

            surplus_deficit = "surplus" if data['calories']['diff'] > 0 else "deficit"

            self.draw_metric_box(
                draw, fonts,
                calories_x, calories_y, box_width, box_height,
                "CALORIES",
                f"{data['calories']['intake']:,}",
                [
                    f"Goal: {data['calories']['goal']:,}",
                    f"{abs(data['calories']['diff'])} cal {surplus_deficit}"
                ],
                draw_calories_custom
            )

            # Row 2, Col 3: Mood Tracker
            mood_x = calories_x + box_width + box_margin
            mood_y = workout_y

            # Calculate average mood
            avg_mood = sum(data['mood']['history']) / len(data['mood']['history'])
            mood_text = "Great" if avg_mood >= 4 else "Good" if avg_mood >= 3 else "OK"

            self.draw_metric_box(
                draw, fonts,
                mood_x, mood_y, box_width, box_height,
                "MOOD",
                mood_text,
                [],
                None
            )

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
    """Main function to display health dashboard"""
    display = HealthDashboard()

    try:
        # Initialize display
        if not display.init_display():
            logging.error("Failed to initialize display, exiting...")
            return 1

        # Generate health data
        data = generate_health_data()

        # Log the data
        logging.info("Health dashboard data:")
        logging.info(f"  Steps: {data['steps']['today']:,} ({data['steps']['percent']}%)")
        logging.info(f"  Water: {data['water']['glasses']}/{data['water']['goal']} glasses")
        logging.info(f"  Sleep: {data['sleep']['hours']}h (score: {data['sleep']['score']})")
        logging.info(f"  Workout streak: {data['workout']['streak']} days")
        logging.info(f"  Calories: {data['calories']['intake']:,} ({data['calories']['diff']:+,})")
        logging.info(f"  Mood: {data['mood']['history']}")

        # Draw the dashboard
        if not display.draw_dashboard(data):
            logging.error("Failed to draw dashboard")
            return 1

        logging.info("Health dashboard displayed successfully!")
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
