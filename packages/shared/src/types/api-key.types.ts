import { z } from 'zod';
import { SERVICE_PROVIDERS } from '../constants';

/**
 * API Key entity
 */
export interface ApiKey {
  id: string;
  userId: string;
  provider: ServiceProvider;
  encryptedKey: string;
  iv: string;
  authTag: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Service provider type
 */
export type ServiceProvider =
  (typeof SERVICE_PROVIDERS)[keyof typeof SERVICE_PROVIDERS];

/**
 * API Key without sensitive encryption details
 */
export type ApiKeySafe = Omit<ApiKey, 'encryptedKey' | 'iv' | 'authTag'>;

/**
 * Create API Key request schema
 */
export const createApiKeySchema = z.object({
  provider: z.enum([
    SERVICE_PROVIDERS.OPEN_WEATHER_MAP,
    SERVICE_PROVIDERS.GOOGLE_CALENDAR,
  ]),
  apiKey: z.string().min(1, 'API key is required'),
});

export type CreateApiKeyDto = z.infer<typeof createApiKeySchema>;

/**
 * Update API Key request schema
 */
export const updateApiKeySchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
});

export type UpdateApiKeyDto = z.infer<typeof updateApiKeySchema>;

/**
 * Decrypted API key (for internal use only)
 */
export interface DecryptedApiKey {
  id: string;
  provider: ServiceProvider;
  apiKey: string;
}
