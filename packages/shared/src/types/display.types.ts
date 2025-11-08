import { z } from 'zod';

/**
 * Display settings entity
 */
export interface DisplaySettings {
  id: string;
  userId: string;
  refreshInterval: number; // in seconds
  brightness: number; // 0-100
  orientation: DisplayOrientation;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Display orientation
 */
export type DisplayOrientation = 'landscape' | 'portrait';

/**
 * Update display settings schema
 */
export const updateDisplaySettingsSchema = z.object({
  refreshInterval: z.number().min(60).max(86400).optional(), // 1 minute to 24 hours
  brightness: z.number().min(0).max(100).optional(),
  orientation: z.enum(['landscape', 'portrait']).optional(),
});

export type UpdateDisplaySettingsDto = z.infer<
  typeof updateDisplaySettingsSchema
>;

/**
 * Display image response
 */
export interface DisplayImageResponse {
  image: Buffer;
  contentType: string;
  width: number;
  height: number;
}
