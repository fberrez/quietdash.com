/**
 * Display constants for Waveshare 7.5" e-ink display (model B075R4QY3L)
 */
export const DISPLAY = {
  WIDTH: 800,
  HEIGHT: 480,
  COLOR_MODE: 'BW', // Black and White (1-bit)
  FORMAT: 'PNG',
} as const;

/**
 * Widget types available in the system
 */
export const WIDGET_TYPES = {
  WEATHER: 'weather',
  CALENDAR: 'calendar',
  TIME_DATE: 'time_date',
  NEWS_RSS: 'news_rss',
} as const;

/**
 * External service providers
 */
export const SERVICE_PROVIDERS = {
  OPEN_WEATHER_MAP: 'openweathermap',
  GOOGLE_CALENDAR: 'google_calendar',
} as const;

/**
 * API key encryption settings
 */
export const ENCRYPTION = {
  ALGORITHM: 'aes-256-gcm',
  KEY_LENGTH: 32,
  IV_LENGTH: 16,
  AUTH_TAG_LENGTH: 16,
} as const;
