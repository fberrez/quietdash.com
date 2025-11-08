import { z } from 'zod';
import { WIDGET_TYPES } from '../constants';

/**
 * Widget type
 */
export type WidgetType = (typeof WIDGET_TYPES)[keyof typeof WIDGET_TYPES];

/**
 * Widget configuration entity
 */
export interface WidgetConfig {
  id: string;
  userId: string;
  type: WidgetType;
  enabled: boolean;
  position: WidgetPosition;
  settings: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Widget position on display
 */
export interface WidgetPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Create widget config schema
 */
export const createWidgetConfigSchema = z.object({
  type: z.enum([
    WIDGET_TYPES.WEATHER,
    WIDGET_TYPES.CALENDAR,
    WIDGET_TYPES.TIME_DATE,
    WIDGET_TYPES.NEWS_RSS,
  ]),
  enabled: z.boolean().default(true),
  position: z.object({
    x: z.number().min(0).max(800),
    y: z.number().min(0).max(480),
    width: z.number().min(1).max(800),
    height: z.number().min(1).max(480),
  }),
  settings: z.record(z.any()).default({}),
});

export type CreateWidgetConfigDto = z.infer<typeof createWidgetConfigSchema>;

/**
 * Update widget config schema
 */
export const updateWidgetConfigSchema = z.object({
  enabled: z.boolean().optional(),
  position: z
    .object({
      x: z.number().min(0).max(800),
      y: z.number().min(0).max(480),
      width: z.number().min(1).max(800),
      height: z.number().min(1).max(480),
    })
    .optional(),
  settings: z.record(z.any()).optional(),
});

export type UpdateWidgetConfigDto = z.infer<typeof updateWidgetConfigSchema>;

/**
 * Weather widget data
 */
export interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  location: string;
  icon: string;
}

/**
 * Calendar event
 */
export interface CalendarEvent {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  location?: string;
}

/**
 * RSS news item
 */
export interface NewsItem {
  title: string;
  description: string;
  link: string;
  pubDate: Date;
}
