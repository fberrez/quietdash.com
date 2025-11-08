#!/usr/bin/python3
# -*- coding:utf-8 -*-
"""
Vitrine.io E-Ink Display Client for Raspberry Pi
Fetches dashboard image from Vitrine.io API and displays on Waveshare 7.5" e-Paper
"""

import sys
import os
import logging
import time
import requests
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont
import traceback
from dotenv import load_dotenv
from datetime import datetime

# Load .env file from the script's directory
script_dir = os.path.dirname(os.path.realpath(__file__))
env_path = os.path.join(script_dir, '.env')
if os.path.exists(env_path):
    load_dotenv(env_path)
    print(f"Loaded .env file from {env_path}")
else:
    print(f"No .env file found at {env_path}, using environment variables or defaults")

# Add Waveshare library path
libdir = os.path.join(os.path.dirname(os.path.dirname(os.path.realpath(__file__))), 'lib')
if os.path.exists(libdir):
    sys.path.append(libdir)

from waveshare_epd import epd7in5_V2

# Configure logging first
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# Configuration - load from environment variables (from .env file or system env)
API_BASE_URL = os.getenv('VITRINE_API_URL', 'http://localhost:3000')
API_EMAIL = os.getenv('VITRINE_EMAIL', 'test@example.com')
API_PASSWORD = os.getenv('VITRINE_PASSWORD', 'password123')
REFRESH_INTERVAL = int(os.getenv('VITRINE_REFRESH_INTERVAL', '300'))  # 5 minutes default

# Log loaded configuration (without password)
logging.info(f"Configuration loaded: API_URL={API_BASE_URL}, EMAIL={API_EMAIL}, REFRESH_INTERVAL={REFRESH_INTERVAL}s")

class VitrineDisplay:
    """Manages the Vitrine.io e-ink display"""

    def __init__(self):
        self.epd = None
        self.access_token = None
        self.session = requests.Session()
        self.display_width = None
        self.display_height = None

    def login(self):
        """Authenticate with the Vitrine.io API and get access token"""
        try:
            login_url = f'{API_BASE_URL}/auth/login'
            login_data = {
                'email': API_EMAIL,
                'password': API_PASSWORD
            }
            logging.info(f"Logging in to {login_url}")
            logging.info(f"Sending JSON body: {{'email': '{API_EMAIL}', 'password': '***'}}")
            
            # Explicitly set headers to ensure JSON content type
            headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
            
            response = self.session.post(
                login_url,
                json=login_data,
                headers=headers,
                timeout=10
            )
            
            # Log response details for debugging
            logging.debug(f"Response status: {response.status_code}")
            logging.debug(f"Response headers: {dict(response.headers)}")
            
            # Check for error status codes (4xx, 5xx)
            if response.status_code >= 400:
                try:
                    error_body = response.text
                    logging.error(f"Login failed with status {response.status_code}: {error_body}")
                except:
                    logging.error(f"Login failed with status {response.status_code}")
                response.raise_for_status()
                return False
            
            # For success status codes (2xx), continue processing
            data = response.json()
            self.access_token = data.get('accessToken')
            if not self.access_token:
                logging.error("No accessToken in response")
                logging.error(f"Response data: {data}")
                return False
            logging.info("Successfully authenticated")
            return True
        except requests.exceptions.RequestException as e:
            logging.error(f"Authentication failed: {e}")
            if hasattr(e, 'response') and e.response is not None:
                try:
                    logging.error(f"Error response body: {e.response.text}")
                except:
                    pass
            return False

    def fetch_image(self):
        """Fetch the dashboard image from the API"""
        if not self.access_token:
            logging.warning("No access token, attempting to login...")
            if not self.login():
                return None

        try:
            logging.info(f"Fetching display image from {API_BASE_URL}/display/image")
            response = self.session.get(
                f'{API_BASE_URL}/display/image',
                headers={
                    'Authorization': f'Bearer {self.access_token}'
                },
                timeout=30
            )

            # If unauthorized, try to re-login once
            if response.status_code == 401:
                logging.warning("Token expired, re-authenticating...")
                if self.login():
                    response = self.session.get(
                        f'{API_BASE_URL}/display/image',
                        headers={
                            'Authorization': f'Bearer {self.access_token}'
                        },
                        timeout=30
                    )
                else:
                    return None

            response.raise_for_status()

            # Load image from response
            image = Image.open(BytesIO(response.content))
            logging.info(f"Successfully fetched image: {image.size} {image.mode}")
            return image

        except requests.exceptions.RequestException as e:
            logging.error(f"Failed to fetch image: {e}")
            return None
        except Exception as e:
            logging.error(f"Failed to process image: {e}")
            return None

    def init_display(self):
        """Initialize the e-Paper display"""
        try:
            logging.info("Initializing 7.5inch e-Paper V2 display")
            self.epd = epd7in5_V2.EPD()
            logging.info("init and Clear")
            self.epd.init()
            
            # Get display dimensions from the EPD object (as per Waveshare example)
            # The example uses epd.width and epd.height directly
            self.display_width = self.epd.width
            self.display_height = self.epd.height
            
            logging.info(f"Display dimensions: {self.display_width}x{self.display_height}")
            
            # Skip initial clear - epd.Clear() can hang in some cases
            # The first image will overwrite whatever is on the display anyway
            logging.info("Skipping initial clear - first image will clear/overwrite the display")
            
            logging.info("Display initialized successfully")
            return True
        except Exception as e:
            logging.error(f"Failed to initialize display: {e}")
            logging.error(traceback.format_exc())
            return False

    def draw_dashboard(self):
        """Draw dashboard directly on the e-Paper display"""
        if not self.epd:
            logging.error("Display not initialized")
            return False

        try:
            logging.info("Drawing on the Horizontal image...")
            self.epd.init_fast()
            
            # Clear display first to remove any previous content/borders
            logging.info("Clearing display...")
            try:
                self.epd.Clear()
            except Exception as e:
                logging.warning(f"Could not clear display: {e}, continuing anyway...")
            
            # Create a new 1-bit image (255 = white background) - ensure exact dimensions
            Himage = Image.new('1', (self.display_width, self.display_height), 255)
            draw = ImageDraw.Draw(Himage)
            
            # Try to load fonts, fallback to default if not available
            try:
                # Try to find a font file (common locations)
                font_paths = [
                    '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
                    '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
                    '/System/Library/Fonts/Helvetica.ttc',
                ]
                font_large = None
                font_medium = None
                font_small = None
                
                for font_path in font_paths:
                    if os.path.exists(font_path):
                        try:
                            font_large = ImageFont.truetype(font_path, 35)
                            font_medium = ImageFont.truetype(font_path, 24)
                            font_small = ImageFont.truetype(font_path, 18)
                            break
                        except:
                            continue
                
                if font_large is None:
                    # Use default font if no font file found
                    font_large = ImageFont.load_default()
                    font_medium = ImageFont.load_default()
                    font_small = ImageFont.load_default()
            except Exception as e:
                logging.warning(f"Could not load custom fonts, using default: {e}")
                font_large = ImageFont.load_default()
                font_medium = ImageFont.load_default()
                font_small = ImageFont.load_default()
            
            # Get current time and date
            now = datetime.now()
            time_str = now.strftime('%H:%M:%S')
            date_str = now.strftime('%A, %B %d')
            
            # Draw title
            draw.text((10, 0), 'Vitrine.io Dashboard', font=font_medium, fill=0)
            
            # Draw time and date
            draw.text((10, 30), time_str, font=font_large, fill=0)
            draw.text((10, 70), date_str, font=font_medium, fill=0)
            
            # Draw separator line
            draw.line((10, 110, self.display_width - 10, 110), fill=0)
            
            # Draw widget boxes and content
            y_start = 120
            padding = 10
            
            # Time/Date widget box
            draw.rectangle((padding, y_start, self.display_width // 2 - padding, y_start + 100), outline=0)
            draw.text((padding + 5, y_start + 5), 'Time & Date', font=font_small, fill=0)
            draw.text((padding + 5, y_start + 30), time_str, font=font_medium, fill=0)
            draw.text((padding + 5, y_start + 60), date_str, font=font_small, fill=0)
            
            # Weather widget box (placeholder)
            draw.rectangle((self.display_width // 2 + padding, y_start, self.display_width - padding, y_start + 100), outline=0)
            draw.text((self.display_width // 2 + padding + 5, y_start + 5), 'Weather', font=font_small, fill=0)
            draw.text((self.display_width // 2 + padding + 5, y_start + 30), 'Configure API key', font=font_small, fill=0)
            draw.text((self.display_width // 2 + padding + 5, y_start + 50), 'to see weather', font=font_small, fill=0)
            
            # Calendar widget box (placeholder)
            draw.rectangle((padding, y_start + 110, self.display_width // 2 - padding, y_start + 200), outline=0)
            draw.text((padding + 5, y_start + 115), 'Calendar', font=font_small, fill=0)
            draw.text((padding + 5, y_start + 140), 'Configure Google', font=font_small, fill=0)
            draw.text((padding + 5, y_start + 160), 'Calendar API', font=font_small, fill=0)
            
            # News widget box (placeholder)
            draw.rectangle((self.display_width // 2 + padding, y_start + 110, self.display_width - padding, y_start + 200), outline=0)
            draw.text((self.display_width // 2 + padding + 5, y_start + 115), 'News', font=font_small, fill=0)
            draw.text((self.display_width // 2 + padding + 5, y_start + 140), 'Configure RSS', font=font_small, fill=0)
            draw.text((self.display_width // 2 + padding + 5, y_start + 160), 'feed URL', font=font_small, fill=0)
            
            # Draw some decorative lines
            draw.line((20, y_start + 220, 70, y_start + 250), fill=0)
            draw.line((70, y_start + 220, 20, y_start + 250), fill=0)
            draw.rectangle((20, y_start + 220, 70, y_start + 250), outline=0)
            
            # Verify image dimensions match display
            if Himage.size != (self.display_width, self.display_height):
                logging.warning(f"Image size {Himage.size} doesn't match display ({self.display_width}, {self.display_height}), resizing...")
                Himage = Himage.resize((self.display_width, self.display_height), Image.Resampling.LANCZOS)
            
            # Display the image
            logging.info(f"Displaying dashboard on e-Paper (image size: {Himage.size}, mode: {Himage.mode})...")
            buffer = self.epd.getbuffer(Himage)
            self.epd.display(buffer)
            logging.info("Dashboard displayed successfully")
            return True

        except Exception as e:
            logging.error(f"Failed to draw dashboard: {e}")
            logging.error(traceback.format_exc())
            return False

    def display_api_image(self):
        """Fetch image from API and display it on the e-Paper"""
        if not self.epd:
            logging.error("Display not initialized")
            return False

        try:
            # Fetch image from API
            image = self.fetch_image()
            if image is None:
                logging.error("Failed to fetch image from API")
                return False

            logging.info(f"Fetched image from API: {image.size} {image.mode}")

            # Initialize display
            logging.info("Initializing display for image update...")
            self.epd.init()

            # Ensure image is the correct size (800x480)
            if image.size != (self.display_width, self.display_height):
                logging.warning(f"Image size {image.size} doesn't match display ({self.display_width}, {self.display_height}), resizing...")
                image = image.resize((self.display_width, self.display_height), Image.Resampling.LANCZOS)

            # Convert to 1-bit black and white mode for e-Paper
            # The e-Paper expects 1-bit mode (black and white only)
            if image.mode != '1':
                logging.info(f"Converting image from {image.mode} to 1-bit B&W...")
                # First convert to grayscale if needed
                if image.mode not in ('L', '1'):
                    image = image.convert('L')
                # Then convert to 1-bit using dithering for better quality
                image = image.convert('1', dither=Image.Dither.FLOYDSTEINBERG)

            logging.info(f"Displaying image on e-Paper (size: {image.size}, mode: {image.mode})...")
            buffer = self.epd.getbuffer(image)
            self.epd.display(buffer)
            logging.info("Image displayed successfully")
            return True

        except Exception as e:
            logging.error(f"Failed to display API image: {e}")
            logging.error(traceback.format_exc())
            return False

    def clear_display(self):
        """Clear the display by showing a white image (following Waveshare example pattern)"""
        if not self.epd:
            logging.error("Display not initialized")
            return False
        
        try:
            # First try epd.Clear() as shown in Waveshare example
            # This may work better than displaying a white image
            logging.info("Attempting to clear display using epd.Clear()...")
            try:
                self.epd.Clear()
                logging.info("Display cleared using epd.Clear() (took a few seconds)")
                return True
            except Exception as clear_error:
                logging.warning(f"epd.Clear() failed: {clear_error}, trying white image method...")
                # Fallback: Create a white image following the Waveshare example pattern
                # Image.new('1', (width, height), 255) where 255 = white in 1-bit mode
                logging.info("Creating white image buffer...")
                white_image = Image.new('1', (self.display_width, self.display_height), 255)
                logging.info("Converting image to display buffer...")
                buffer = self.epd.getbuffer(white_image)
                logging.info("Sending buffer to display (this may take 2-5 seconds - please wait)...")
                # E-Paper displays can take several seconds to update - this is normal!
                # The display() call blocks until the update is complete
                self.epd.display(buffer)
                logging.info("Display cleared successfully (update complete)")
                return True
        except Exception as e:
            logging.error(f"Failed to clear display: {e}")
            logging.error(traceback.format_exc())
            return False

    def display_error_message(self, message):
        """Display an error message on the e-Paper"""
        try:
            logging.info(f"Displaying error message: {message}")
            # For now, just clear the display (white screen)
            # Note: For actual text, you'd need to add PIL ImageDraw and ImageFont
            self.clear_display()
        except Exception as e:
            logging.error(f"Failed to display error message: {e}")

    def display_shutdown_message(self):
        """Display a shutdown message on white screen"""
        if not self.epd:
            logging.error("Display not initialized")
            return False

        try:
            logging.info("Displaying shutdown message...")

            # Initialize display
            self.epd.init()

            # Create a white image
            image = Image.new('1', (self.display_width, self.display_height), 255)  # 255 = white
            draw = ImageDraw.Draw(image)

            # Try to load a nice font for the message
            try:
                font_paths = [
                    '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
                    '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
                    '/System/Library/Fonts/Helvetica.ttc',
                ]
                font = None
                for font_path in font_paths:
                    if os.path.exists(font_path):
                        try:
                            font = ImageFont.truetype(font_path, 32)
                            break
                        except:
                            continue

                if font is None:
                    font = ImageFont.load_default()
            except Exception as e:
                logging.warning(f"Could not load custom font, using default: {e}")
                font = ImageFont.load_default()

            # Draw centered text
            message = "vitrine is closed, come back later..."

            # Get text bounding box to center it
            try:
                # For newer Pillow versions
                bbox = draw.textbbox((0, 0), message, font=font)
                text_width = bbox[2] - bbox[0]
                text_height = bbox[3] - bbox[1]
            except AttributeError:
                # Fallback for older Pillow versions
                text_width, text_height = draw.textsize(message, font=font)

            # Calculate centered position
            x = (self.display_width - text_width) // 2
            y = (self.display_height - text_height) // 2

            # Draw the text in black on white background
            draw.text((x, y), message, font=font, fill=0)  # 0 = black

            # Display the shutdown message
            logging.info("Showing shutdown message on e-Paper...")
            buffer = self.epd.getbuffer(image)
            self.epd.display(buffer)
            logging.info("Shutdown message displayed")
            return True

        except Exception as e:
            logging.error(f"Failed to display shutdown message: {e}")
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
        # Display shutdown message before sleep
        self.display_shutdown_message()
        self.sleep()
        self.session.close()
        logging.info("Cleanup complete")

def main():
    """Main function to run the display update loop"""
    display = VitrineDisplay()

    try:
        # Initialize display
        if not display.init_display():
            logging.error("Failed to initialize display, exiting...")
            return 1

        # Login to API
        if not display.login():
            logging.error("Failed to authenticate, exiting...")
            display.cleanup()
            return 1

        # Main loop
        logging.info(f"Starting display update loop (refresh every {REFRESH_INTERVAL} seconds)")

        while True:
            # Fetch and display image from API
            if not display.display_api_image():
                logging.error("Failed to display API image, trying local fallback...")
                # Fallback to local dashboard drawing if API fetch fails
                if not display.draw_dashboard():
                    logging.error("Failed to draw fallback dashboard, will retry on next cycle")

            # Wait for next refresh
            logging.info(f"Sleeping for {REFRESH_INTERVAL} seconds...")
            time.sleep(REFRESH_INTERVAL)

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
