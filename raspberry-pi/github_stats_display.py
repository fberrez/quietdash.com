#!/usr/bin/python3
# -*- coding:utf-8 -*-
"""
GitHub Stats Dashboard for Waveshare 7.5" e-Paper
Displays PR/issue counts, contribution graph, and recent activity
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
    Generate mock GitHub stats data

    Returns:
        dict with PRs, issues, contributions, and activity data
    """
    # Stats
    stats = {
        'prs_opened': random.randint(8, 45),
        'prs_merged': random.randint(20, 60),
        'issues_closed': random.randint(15, 50),
        'total_commits': random.randint(100, 500),
    }

    # 7-day contribution graph
    contributions = []
    today = datetime.now()
    for i in range(6, -1, -1):
        date = today - timedelta(days=i)
        commits = random.randint(0, 25)
        contributions.append((date, commits))

    # Recent activity
    activity_types = [
        ("Merged PR", "fix: resolve authentication bug", "vitrine.io"),
        ("Opened Issue", "Add dark mode support", "ui-library"),
        ("Pushed commits", "3 commits to main", "api-service"),
        ("Closed PR", "feat: implement caching layer", "backend"),
        ("Starred repo", "awesome-python", "community"),
        ("Created repo", "new-side-project", "personal"),
        ("Commented", "Great work on the refactor!", "team-project"),
        ("Reviewed PR", "Code review: optimization changes", "frontend"),
    ]

    recent_activity = random.sample(activity_types, 4)

    data = {
        'stats': stats,
        'contributions': contributions,
        'activity': recent_activity,
        'username': 'fberrez',
        'generated_at': datetime.now(),
    }

    logging.info(f"Generated GitHub stats: {stats['total_commits']} commits, {stats['prs_merged']} PRs merged")
    return data


class GitHubStatsDisplay:
    """Manages the GitHub stats e-ink display"""

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
        # Try monospace fonts first for GitHub aesthetic
        font_paths = [
            '/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf',
            '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf',
            '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
            '/usr/share/fonts/truetype/liberation/LiberationMono-Bold.ttf',
            '/System/Library/Fonts/Courier.ttc',
        ]

        fonts = {}

        for font_path in font_paths:
            if os.path.exists(font_path):
                try:
                    fonts['huge'] = ImageFont.truetype(font_path, 80)
                    fonts['title'] = ImageFont.truetype(font_path, 40)
                    fonts['large'] = ImageFont.truetype(font_path, 28)
                    fonts['medium'] = ImageFont.truetype(font_path, 22)
                    fonts['small'] = ImageFont.truetype(font_path, 16)
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
        Draw GitHub stats dashboard on the e-Paper display

        Args:
            data: Dictionary with GitHub stats data
        """
        if not self.epd:
            logging.error("Display not initialized")
            return False

        try:
            logging.info("Creating GitHub stats dashboard...")

            # Create a new 1-bit image (255 = white background)
            image = Image.new('1', (self.display_width, self.display_height), 255)
            draw = ImageDraw.Draw(image)

            # Load fonts
            fonts = self.load_fonts()

            margin = 20

            # Header (minimal)
            header_text = f"@{data['username']}"
            draw.text((margin, margin), header_text, font=fonts['large'], fill=0)

            # Separator line
            draw.line((margin, 60, self.display_width - margin, 60), fill=0, width=2)

            # Stats section (top, 4 boxes)
            stats_y = 90
            stats = data['stats']

            stat_items = [
                ("PRs", stats['prs_opened']),
                ("Merged", stats['prs_merged']),
                ("Issues", stats['issues_closed']),
                ("Commits", stats['total_commits']),
            ]

            box_width = (self.display_width - 2 * margin - 30) // 4
            box_height = 100

            for i, (label, value) in enumerate(stat_items):
                x = margin + i * (box_width + 10)

                # Draw box
                draw.rectangle(
                    [(x, stats_y), (x + box_width, stats_y + box_height)],
                    outline=0,
                    width=2
                )

                # Draw value (medium number, not huge)
                value_text = str(value)
                try:
                    bbox = draw.textbbox((0, 0), value_text, font=fonts['title'])
                    value_width = bbox[2] - bbox[0]
                except AttributeError:
                    value_width, _ = draw.textsize(value_text, font=fonts['title'])

                value_x = x + (box_width - value_width) // 2
                draw.text((value_x, stats_y + 20), value_text, font=fonts['title'], fill=0)

                # Draw label
                try:
                    bbox = draw.textbbox((0, 0), label, font=fonts['small'])
                    label_width = bbox[2] - bbox[0]
                except AttributeError:
                    label_width, _ = draw.textsize(label, font=fonts['small'])

                label_x = x + (box_width - label_width) // 2
                draw.text((label_x, stats_y + box_height - 25), label, font=fonts['small'], fill=0)

            # Contribution graph section (no header)
            graph_y = stats_y + box_height + 20

            # Chart area
            chart_top = graph_y + 10
            chart_bottom = chart_top + 120
            chart_left = margin + 40
            chart_right = self.display_width - margin - 40
            chart_height = chart_bottom - chart_top
            chart_width = chart_right - chart_left

            # Calculate bar width and spacing
            contributions = data['contributions']
            num_bars = len(contributions)
            bar_spacing = 12
            bar_width = (chart_width - (num_bars - 1) * bar_spacing) // num_bars

            # Find max commits for scaling
            max_commits = max(commits for _, commits in contributions) if contributions else 1
            if max_commits == 0:
                max_commits = 1

            # Draw bars
            for i, (date, commits) in enumerate(contributions):
                x = chart_left + i * (bar_width + bar_spacing)

                # Calculate bar height
                if commits > 0:
                    bar_height = max(5, int((commits / max_commits) * chart_height))
                else:
                    bar_height = 0

                y_top = chart_bottom - bar_height

                # Draw bar
                if bar_height > 0:
                    draw.rectangle(
                        [(x, y_top), (x + bar_width, chart_bottom)],
                        fill=0,
                        outline=0
                    )

                # Draw commit count above bar
                count_text = str(commits)
                try:
                    bbox = draw.textbbox((0, 0), count_text, font=fonts['small'])
                    count_width = bbox[2] - bbox[0]
                except AttributeError:
                    count_width, _ = draw.textsize(count_text, font=fonts['small'])

                count_x = x + (bar_width - count_width) // 2
                count_y = y_top - 20 if bar_height > 0 else chart_bottom - 20
                draw.text((count_x, count_y), count_text, font=fonts['small'], fill=0)

                # Draw day label
                day_name = date.strftime('%a')
                try:
                    bbox = draw.textbbox((0, 0), day_name, font=fonts['small'])
                    day_width = bbox[2] - bbox[0]
                except AttributeError:
                    day_width, _ = draw.textsize(day_name, font=fonts['small'])

                day_x = x + (bar_width - day_width) // 2
                draw.text((day_x, chart_bottom + 5), day_name, font=fonts['small'], fill=0)

            # Draw axis
            draw.line((chart_left, chart_bottom, chart_right, chart_bottom), fill=0, width=2)

            # Recent activity (no header, no repo names, more spacing)
            activity_y = chart_bottom + 30

            # Activity list
            list_y = activity_y
            line_height = 25

            for i, (action, description, repo) in enumerate(data['activity']):
                y = list_y + (i * line_height)

                # Bullet point
                draw.text((margin, y), "•", font=fonts['small'], fill=0)

                # Description only (no action label, very short)
                activity_text = description[:45] + ".." if len(description) > 45 else description
                draw.text((margin + 20, y), activity_text, font=fonts['small'], fill=0)

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
    """Main function to display GitHub stats dashboard"""
    display = GitHubStatsDisplay()

    try:
        # Initialize display
        if not display.init_display():
            logging.error("Failed to initialize display, exiting...")
            return 1

        # Generate mock data
        data = generate_mock_data()

        # Log the data
        logging.info("GitHub stats data:")
        logging.info(f"  PRs merged: {data['stats']['prs_merged']}")
        logging.info(f"  Issues closed: {data['stats']['issues_closed']}")
        logging.info(f"  Total commits: {data['stats']['total_commits']}")
        logging.info(f"  Recent activity items: {len(data['activity'])}")

        # Draw the dashboard
        if not display.draw_dashboard(data):
            logging.error("Failed to draw dashboard")
            return 1

        logging.info("GitHub stats dashboard displayed successfully!")
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
