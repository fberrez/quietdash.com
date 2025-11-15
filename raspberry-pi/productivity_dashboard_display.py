#!/usr/bin/python3
# -*- coding:utf-8 -*-
"""
Productivity Dashboard for Waveshare 7.5" e-Paper
Displays Pomodoro timer, daily goals, unread messages, deep work, and priority todos
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


def generate_productivity_data():
    """
    Generate mock productivity data for dashboard

    Returns:
        dict with pomodoro, goals, messages, deep work, and todo data
    """
    now = datetime.now()

    # Pomodoro timer
    pomodoro_states = ['work', 'break', 'idle']
    pomodoro_state = random.choice(pomodoro_states)

    if pomodoro_state == 'work':
        time_remaining = random.randint(5, 25)  # minutes
        state_text = "WORK"
    elif pomodoro_state == 'break':
        time_remaining = random.randint(1, 5)
        state_text = "BREAK"
    else:
        time_remaining = 0
        state_text = "IDLE"

    sessions_today = random.randint(0, 8)

    # Daily goals
    goals_total = random.randint(4, 8)
    goals_completed = random.randint(0, goals_total)
    goals_percent = int((goals_completed / goals_total) * 100) if goals_total > 0 else 0

    # Email/Slack unread
    email_unread = random.randint(5, 45)
    slack_unread = random.randint(2, 20)
    email_yesterday = random.randint(10, 50)
    slack_yesterday = random.randint(5, 25)
    email_trend = email_unread - email_yesterday
    slack_trend = slack_unread - slack_yesterday

    # Deep work timer
    deep_work_hours_week = round(random.uniform(8.5, 24.5), 1)
    deep_work_streak = random.randint(0, 12)
    deep_work_today = round(random.uniform(0, 4.5), 1)

    # Priority todo list (top 3)
    todo_statuses = ['pending', 'in_progress', 'done']
    todos = [
        {
            'title': 'Review API',
            'status': random.choice(todo_statuses)
        },
        {
            'title': 'Prepare presentation',
            'status': random.choice(todo_statuses)
        },
        {
            'title': 'Fix authentication',
            'status': random.choice(todo_statuses)
        }
    ]

    data = {
        'date': now.strftime('%A, %B %d'),
        'time': now.strftime('%H:%M'),
        'pomodoro': {
            'state': state_text,
            'time_remaining': time_remaining,
            'sessions_today': sessions_today
        },
        'goals': {
            'completed': goals_completed,
            'total': goals_total,
            'percent': goals_percent
        },
        'messages': {
            'email': email_unread,
            'slack': slack_unread,
            'email_trend': email_trend,
            'slack_trend': slack_trend
        },
        'deep_work': {
            'hours_week': deep_work_hours_week,
            'streak': deep_work_streak,
            'today': deep_work_today
        },
        'todos': todos
    }

    logging.info(f"Generated productivity data for {now.strftime('%Y-%m-%d %H:%M')}")
    return data


class ProductivityDashboard:
    """Manages the productivity dashboard e-ink display"""

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

    def draw_progress_bar(self, draw, x, y, width, height, percent):
        """Draw a progress bar"""
        # Outer rectangle
        draw.rectangle([(x, y), (x + width, y + height)], outline=0, width=2)

        # Fill based on percentage
        if percent > 0:
            fill_width = int((width - 4) * (percent / 100))
            draw.rectangle([(x + 2, y + 2), (x + 2 + fill_width, y + height - 2)], fill=0)

    def draw_checkbox(self, draw, x, y, size, status):
        """
        Draw a checkbox with status

        Args:
            status: 'pending', 'in_progress', 'done'
        """
        # Box outline
        draw.rectangle([(x, y), (x + size, y + size)], outline=0, width=2)

        if status == 'done':
            # Checkmark
            check_offset = size // 4
            draw.line(
                [(x + check_offset, y + size // 2),
                 (x + size // 2 - 2, y + size - check_offset)],
                fill=0, width=3
            )
            draw.line(
                [(x + size // 2 - 2, y + size - check_offset),
                 (x + size - check_offset, y + check_offset)],
                fill=0, width=3
            )
        elif status == 'in_progress':
            # Partial fill
            inner_margin = size // 4
            draw.rectangle(
                [(x + inner_margin, y + inner_margin),
                 (x + size - inner_margin, y + size - inner_margin)],
                fill=0
            )

    def draw_metric_box(self, draw, fonts, x, y, width, height, title, main_value, sub_values, custom_draw=None):
        """Draw a metric box with title, main value, and sub-values"""
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
        Draw productivity dashboard on the e-Paper display

        Args:
            data: Dictionary with productivity metrics
        """
        if not self.epd:
            logging.error("Display not initialized")
            return False

        try:
            logging.info("Creating productivity dashboard...")

            # Create a new 1-bit image (255 = white background)
            image = Image.new('1', (self.display_width, self.display_height), 255)
            draw = ImageDraw.Draw(image)

            # Load fonts
            fonts = self.load_fonts()

            # Header
            margin = 15
            header_text = "PRODUCTIVITY DASHBOARD"
            date_text = data['date']
            time_text = data['time']

            draw.text((margin, margin), header_text, font=fonts['title'], fill=0)

            try:
                bbox = draw.textbbox((0, 0), f"{date_text} - {time_text}", font=fonts['small'])
                date_width = bbox[2] - bbox[0]
            except AttributeError:
                date_width, _ = draw.textsize(f"{date_text} - {time_text}", font=fonts['small'])

            date_x = self.display_width - date_width - margin
            draw.text((date_x, margin + 5), f"{date_text} - {time_text}", font=fonts['small'], fill=0)

            # Separator line
            separator_y = 55
            draw.line([(margin, separator_y), (self.display_width - margin, separator_y)], fill=0, width=2)

            # Layout: Left side (2/3) has grid of 4 boxes, Right side (1/3) has todo list
            content_top = separator_y + 15
            left_width = int(self.display_width * 0.65)
            right_width = self.display_width - left_width - margin * 3

            box_margin = 10
            box_width = (left_width - margin - box_margin) // 2
            box_height = (self.display_height - content_top - margin - box_margin) // 2

            # Left side: 2x2 grid

            # Row 1, Col 1: Pomodoro Timer
            pomodoro_x = margin
            pomodoro_y = content_top

            def draw_pomodoro_custom(d, x, y, w, h):
                # Draw state text
                state_text = data['pomodoro']['state']
                try:
                    bbox = d.textbbox((0, 0), state_text, font=fonts['medium'])
                    state_width = bbox[2] - bbox[0]
                except AttributeError:
                    state_width, _ = d.textsize(state_text, font=fonts['medium'])

                state_x = x + (w - state_width) // 2
                state_y = y + 125
                d.text((state_x, state_y), state_text, font=fonts['medium'], fill=0)

            time_display = f"{data['pomodoro']['time_remaining']}m" if data['pomodoro']['time_remaining'] > 0 else "--"

            self.draw_metric_box(
                draw, fonts,
                pomodoro_x, pomodoro_y, box_width, box_height,
                "POMODORO",
                time_display,
                [
                    f"Sessions today: {data['pomodoro']['sessions_today']}"
                ],
                draw_pomodoro_custom
            )

            # Row 1, Col 2: Daily Goals
            goals_x = pomodoro_x + box_width + box_margin
            goals_y = content_top

            def draw_goals_custom(d, x, y, w, h):
                # Progress bar
                bar_y = y + 125
                self.draw_progress_bar(d, x + 20, bar_y, w - 40, 20, data['goals']['percent'])

            self.draw_metric_box(
                draw, fonts,
                goals_x, goals_y, box_width, box_height,
                "DAILY GOALS",
                f"{data['goals']['completed']}/{data['goals']['total']}",
                [
                    f"Progress: {data['goals']['percent']}%"
                ],
                draw_goals_custom
            )

            # Row 2, Col 1: Email/Slack Unread
            messages_x = margin
            messages_y = pomodoro_y + box_height + box_margin

            def draw_messages_custom(d, x, y, w, h):
                # Email trend
                email_trend_text = f"Email: {data['messages']['email_trend']:+d} vs yesterday"
                slack_trend_text = f"Slack: {data['messages']['slack_trend']:+d} vs yesterday"

                d.text((x + 15, y + 120), email_trend_text, font=fonts['tiny'], fill=0)
                d.text((x + 15, y + 138), slack_trend_text, font=fonts['tiny'], fill=0)

            total_unread = data['messages']['email'] + data['messages']['slack']

            self.draw_metric_box(
                draw, fonts,
                messages_x, messages_y, box_width, box_height,
                "UNREAD",
                str(total_unread),
                [
                    f"Email: {data['messages']['email']} | Slack: {data['messages']['slack']}"
                ],
                draw_messages_custom
            )

            # Row 2, Col 2: Deep Work
            deepwork_x = goals_x
            deepwork_y = messages_y

            def draw_deepwork_custom(d, x, y, w, h):
                # Today's hours
                today_text = f"Today: {data['deep_work']['today']}h"
                try:
                    bbox = d.textbbox((0, 0), today_text, font=fonts['medium'])
                    text_width = bbox[2] - bbox[0]
                except AttributeError:
                    text_width, _ = d.textsize(today_text, font=fonts['medium'])

                text_x = x + (w - text_width) // 2
                text_y = y + 125
                d.text((text_x, text_y), today_text, font=fonts['medium'], fill=0)

            self.draw_metric_box(
                draw, fonts,
                deepwork_x, deepwork_y, box_width, box_height,
                "DEEP WORK",
                f"{data['deep_work']['hours_week']}h",
                [
                    f"This week | Streak: {data['deep_work']['streak']} days"
                ],
                draw_deepwork_custom
            )

            # Right side: Priority Todo List
            todo_x = left_width + margin
            todo_y = content_top
            todo_height = self.display_height - content_top - margin

            # Todo box outline
            draw.rectangle([(todo_x, todo_y), (todo_x + right_width, todo_y + todo_height)], outline=0, width=3)

            # Title
            padding = 10
            draw.text((todo_x + padding, todo_y + padding), "PRIORITY TODO", font=fonts['medium'], fill=0)

            # Draw todo items
            item_y = todo_y + 50
            item_height = 90
            checkbox_size = 20

            for i, todo in enumerate(data['todos']):
                if i >= 3:  # Only show top 3
                    break

                current_y = item_y + (i * item_height)

                # Checkbox
                self.draw_checkbox(draw, todo_x + padding, current_y, checkbox_size, todo['status'])

                # Todo text
                text_x = todo_x + padding + checkbox_size + 10

                # Title
                draw.text((text_x, current_y), todo['title'], font=fonts['small'], fill=0)

                # Status text
                status_display = {
                    'pending': 'Pending',
                    'in_progress': 'In Progress',
                    'done': 'Done'
                }
                status_text = status_display.get(todo['status'], 'Unknown')
                draw.text((text_x, current_y + 22), status_text, font=fonts['tiny'], fill=0)

                # Separator line (except for last item)
                if i < 2:
                    line_y = current_y + item_height - 20
                    draw.line(
                        [(todo_x + padding, line_y), (todo_x + right_width - padding, line_y)],
                        fill=0, width=1
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
    """Main function to display productivity dashboard"""
    display = ProductivityDashboard()

    try:
        # Initialize display
        if not display.init_display():
            logging.error("Failed to initialize display, exiting...")
            return 1

        # Generate productivity data
        data = generate_productivity_data()

        # Log the data
        logging.info("Productivity dashboard data:")
        logging.info(f"  Pomodoro: {data['pomodoro']['state']} - {data['pomodoro']['time_remaining']}m")
        logging.info(f"  Goals: {data['goals']['completed']}/{data['goals']['total']} ({data['goals']['percent']}%)")
        logging.info(f"  Messages: Email {data['messages']['email']} ({data['messages']['email_trend']:+d}), Slack {data['messages']['slack']} ({data['messages']['slack_trend']:+d})")
        logging.info(f"  Deep work: {data['deep_work']['hours_week']}h this week, {data['deep_work']['streak']} day streak")
        logging.info(f"  Todos: {len(data['todos'])} items")

        # Draw the dashboard
        if not display.draw_dashboard(data):
            logging.error("Failed to draw dashboard")
            return 1

        logging.info("Productivity dashboard displayed successfully!")
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
