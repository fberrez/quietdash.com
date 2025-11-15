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
