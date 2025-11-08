import { z } from 'zod';
import { WIDGET_TYPES } from '../constants';
export type WidgetType = (typeof WIDGET_TYPES)[keyof typeof WIDGET_TYPES];
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
export interface WidgetPosition {
    x: number;
    y: number;
    width: number;
    height: number;
}
export declare const createWidgetConfigSchema: z.ZodObject<{
    type: z.ZodEnum<["weather", "calendar", "time_date", "news_rss"]>;
    enabled: z.ZodDefault<z.ZodBoolean>;
    position: z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        width: z.ZodNumber;
        height: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x?: number;
        y?: number;
        width?: number;
        height?: number;
    }, {
        x?: number;
        y?: number;
        width?: number;
        height?: number;
    }>;
    settings: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    type?: "weather" | "calendar" | "time_date" | "news_rss";
    enabled?: boolean;
    position?: {
        x?: number;
        y?: number;
        width?: number;
        height?: number;
    };
    settings?: Record<string, any>;
}, {
    type?: "weather" | "calendar" | "time_date" | "news_rss";
    enabled?: boolean;
    position?: {
        x?: number;
        y?: number;
        width?: number;
        height?: number;
    };
    settings?: Record<string, any>;
}>;
export type CreateWidgetConfigDto = z.infer<typeof createWidgetConfigSchema>;
export declare const updateWidgetConfigSchema: z.ZodObject<{
    enabled: z.ZodOptional<z.ZodBoolean>;
    position: z.ZodOptional<z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        width: z.ZodNumber;
        height: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x?: number;
        y?: number;
        width?: number;
        height?: number;
    }, {
        x?: number;
        y?: number;
        width?: number;
        height?: number;
    }>>;
    settings: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    enabled?: boolean;
    position?: {
        x?: number;
        y?: number;
        width?: number;
        height?: number;
    };
    settings?: Record<string, any>;
}, {
    enabled?: boolean;
    position?: {
        x?: number;
        y?: number;
        width?: number;
        height?: number;
    };
    settings?: Record<string, any>;
}>;
export type UpdateWidgetConfigDto = z.infer<typeof updateWidgetConfigSchema>;
export interface WeatherData {
    temperature: number;
    condition: string;
    humidity: number;
    windSpeed: number;
    location: string;
    icon: string;
}
export interface CalendarEvent {
    id: string;
    title: string;
    startTime: Date;
    endTime: Date;
    location?: string;
}
export interface NewsItem {
    title: string;
    description: string;
    link: string;
    pubDate: Date;
}
//# sourceMappingURL=widget.types.d.ts.map