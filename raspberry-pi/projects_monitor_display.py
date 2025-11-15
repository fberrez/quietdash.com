#!/usr/bin/python3
# -*- coding:utf-8 -*-
"""
Side Projects Monitor Dashboard for Waveshare 7.5" e-Paper
Displays status, uptime, deployments, and metrics for side projects
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
    Generate mock side projects monitoring data

    Returns:
        dict with project status, uptime, deployments, and metrics
    """
    project_names = [
        ("quietdash.io", "E-ink dashboard platform"),
        ("api-monitor", "API uptime tracker"),
        ("notion-sync", "Notion automation tool"),
        ("meal-planner", "Weekly meal planning app"),
        ("budget-tracker", "Personal finance SaaS"),
        ("link-shortener", "URL shortening service"),
    ]

    projects = []

    for i in range(6):
        name, description = project_names[i]

        # Random status
        status_options = ["operational", "operational", "operational", "degraded", "down"]
        status = random.choice(status_options)

        # Status icon (text-based for B&W display)
        if status == "operational":
            status_icon = "●"  # Filled circle
            status_text = "Up"
        elif status == "degraded":
            status_icon = "◐"  # Half circle
            status_text = "Slow"
        else:
            status_icon = "○"  # Empty circle
            status_text = "Down"

        # Uptime percentage
        if status == "operational":
            uptime = random.uniform(99.5, 100.0)
        elif status == "degraded":
            uptime = random.uniform(95.0, 99.0)
        else:
            uptime = random.uniform(0, 80.0)

        # Last deployment
        days_ago = random.randint(0, 30)
        if days_ago == 0:
            last_deploy = "Today"
        elif days_ago == 1:
            last_deploy = "Yesterday"
        else:
            last_deploy = f"{days_ago}d ago"

        # Metrics (optional)
        has_revenue = random.choice([True, False])
        if has_revenue:
            revenue = random.uniform(0, 500)
            users = random.randint(10, 1000)
        else:
            revenue = 0
            users = random.randint(0, 100)

        projects.append({
            'name': name,
            'description': description,
            'status': status,
            'status_icon': status_icon,
            'status_text': status_text,
            'uptime': uptime,
            'last_deploy': last_deploy,
            'revenue': revenue,
            'users': users,
            'has_revenue': has_revenue,
        })

    data = {
        'projects': projects,
        'updated_at': datetime.now(),
        'total_projects': len(projects),
        'operational': sum(1 for p in projects if p['status'] == 'operational'),
    }

    logging.info(f"Generated project monitor data: {len(projects)} projects, {data['operational']} operational")
    return data


class ProjectsMonitorDisplay:
    """Manages the projects monitor e-ink display"""

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
                    fonts['title'] = ImageFont.truetype(font_path, 40)
                    fonts['large'] = ImageFont.truetype(font_path, 28)
                    fonts['medium'] = ImageFont.truetype(font_path, 22)
                    fonts['small'] = ImageFont.truetype(font_path, 18)
                    fonts['tiny'] = ImageFont.truetype(font_path, 14)
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
        Draw projects monitor dashboard on the e-Paper display

        Args:
            data: Dictionary with project monitoring data
        """
        if not self.epd:
            logging.error("Display not initialized")
            return False

        try:
            logging.info("Creating projects monitor dashboard...")

            # Create a new 1-bit image (255 = white background)
            image = Image.new('1', (self.display_width, self.display_height), 255)
            draw = ImageDraw.Draw(image)

            # Load fonts
            fonts = self.load_fonts()

            margin = 20

            # Header (minimal)
            summary_text = f"{data['operational']}/{data['total_projects']}"
            draw.text((margin, margin), summary_text, font=fonts['large'], fill=0)

            # Separator
            separator_y = 55
            draw.line((margin, separator_y, self.display_width - margin, separator_y), fill=0, width=2)

            # Project cards in grid (3x2)
            card_start_y = separator_y + 15
            card_margin = 10
            cards_per_row = 3
            card_width = (self.display_width - 2 * margin - 2 * card_margin) // cards_per_row
            card_height = 120

            projects = data['projects']

            for i, project in enumerate(projects):
                row = i // cards_per_row
                col = i % cards_per_row

                card_x = margin + col * (card_width + card_margin)
                card_y = card_start_y + row * (card_height + card_margin)

                # Draw card border
                draw.rectangle(
                    [(card_x, card_y), (card_x + card_width, card_y + card_height)],
                    outline=0,
                    width=2
                )

                # Card content
                content_x = card_x + 8
                content_y = card_y + 8

                # Project name (heavily truncated)
                name_text = project['name']
                if len(name_text) > 14:
                    name_text = name_text[:11] + ".."
                draw.text((content_x, content_y), name_text, font=fonts['tiny'], fill=0)

                # Status icon and text
                status_y = content_y + 20
                status_icon = project['status_icon']
                status_text = project['status_text']

                # Draw status icon (medium size)
                draw.text((content_x, status_y), status_icon, font=fonts['medium'], fill=0)

                # Draw status text
                draw.text((content_x + 25, status_y + 2), status_text, font=fonts['tiny'], fill=0)

                # Uptime percentage (shorter label)
                uptime_y = status_y + 25
                uptime_text = f"{project['uptime']:.1f}%"
                draw.text((content_x, uptime_y), uptime_text, font=fonts['tiny'], fill=0)

                # Last deployment (shorter label)
                deploy_y = uptime_y + 16
                deploy_text = project['last_deploy']
                draw.text((content_x, deploy_y), deploy_text, font=fonts['tiny'], fill=0)

                # Revenue/Users (if applicable, more compact)
                if project['has_revenue'] and project['revenue'] > 0:
                    metrics_y = deploy_y + 16
                    revenue_text = f"€{project['revenue']:.0f}"
                    draw.text((content_x, metrics_y), revenue_text, font=fonts['tiny'], fill=0)

                    users_text = f"{project['users']}u"
                    try:
                        bbox = draw.textbbox((0, 0), users_text, font=fonts['tiny'])
                        users_width = bbox[2] - bbox[0]
                    except AttributeError:
                        users_width, _ = draw.textsize(users_text, font=fonts['tiny'])

                    users_x = card_x + card_width - users_width - 8
                    draw.text((users_x, metrics_y), users_text, font=fonts['tiny'], fill=0)

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
    """Main function to display projects monitor dashboard"""
    display = ProjectsMonitorDisplay()

    try:
        # Initialize display
        if not display.init_display():
            logging.error("Failed to initialize display, exiting...")
            return 1

        # Generate mock data
        data = generate_mock_data()

        # Log the data
        logging.info("Projects monitor data:")
        logging.info(f"  Total projects: {data['total_projects']}")
        logging.info(f"  Operational: {data['operational']}")
        for project in data['projects']:
            logging.info(f"    {project['name']}: {project['status']} ({project['uptime']:.1f}% uptime)")

        # Draw the dashboard
        if not display.draw_dashboard(data):
            logging.error("Failed to draw dashboard")
            return 1

        logging.info("Projects monitor dashboard displayed successfully!")
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
