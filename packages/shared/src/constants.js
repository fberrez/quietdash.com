"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENCRYPTION = exports.SERVICE_PROVIDERS = exports.WIDGET_TYPES = exports.DISPLAY = void 0;
exports.DISPLAY = {
    WIDTH: 800,
    HEIGHT: 480,
    COLOR_MODE: 'BW',
    FORMAT: 'PNG',
};
exports.WIDGET_TYPES = {
    WEATHER: 'weather',
    CALENDAR: 'calendar',
    TIME_DATE: 'time_date',
    NEWS_RSS: 'news_rss',
};
exports.SERVICE_PROVIDERS = {
    OPEN_WEATHER_MAP: 'openweathermap',
    GOOGLE_CALENDAR: 'google_calendar',
};
exports.ENCRYPTION = {
    ALGORITHM: 'aes-256-gcm',
    KEY_LENGTH: 32,
    IV_LENGTH: 16,
    AUTH_TAG_LENGTH: 16,
};
//# sourceMappingURL=constants.js.map