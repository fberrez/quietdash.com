import { z } from 'zod';
import { SERVICE_PROVIDERS } from '../constants';
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
export type ServiceProvider = (typeof SERVICE_PROVIDERS)[keyof typeof SERVICE_PROVIDERS];
export type ApiKeySafe = Omit<ApiKey, 'encryptedKey' | 'iv' | 'authTag'>;
export declare const createApiKeySchema: z.ZodObject<{
    provider: z.ZodEnum<["openweathermap", "google_calendar"]>;
    apiKey: z.ZodString;
}, "strip", z.ZodTypeAny, {
    apiKey?: string;
    provider?: "openweathermap" | "google_calendar";
}, {
    apiKey?: string;
    provider?: "openweathermap" | "google_calendar";
}>;
export type CreateApiKeyDto = z.infer<typeof createApiKeySchema>;
export declare const updateApiKeySchema: z.ZodObject<{
    apiKey: z.ZodString;
}, "strip", z.ZodTypeAny, {
    apiKey?: string;
}, {
    apiKey?: string;
}>;
export type UpdateApiKeyDto = z.infer<typeof updateApiKeySchema>;
export interface DecryptedApiKey {
    id: string;
    provider: ServiceProvider;
    apiKey: string;
}
//# sourceMappingURL=api-key.types.d.ts.map