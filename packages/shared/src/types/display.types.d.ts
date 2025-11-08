import { z } from 'zod';
export interface DisplaySettings {
    id: string;
    userId: string;
    refreshInterval: number;
    brightness: number;
    orientation: DisplayOrientation;
    createdAt: Date;
    updatedAt: Date;
}
export type DisplayOrientation = 'landscape' | 'portrait';
export declare const updateDisplaySettingsSchema: z.ZodObject<{
    refreshInterval: z.ZodOptional<z.ZodNumber>;
    brightness: z.ZodOptional<z.ZodNumber>;
    orientation: z.ZodOptional<z.ZodEnum<["landscape", "portrait"]>>;
}, "strip", z.ZodTypeAny, {
    refreshInterval?: number;
    brightness?: number;
    orientation?: "landscape" | "portrait";
}, {
    refreshInterval?: number;
    brightness?: number;
    orientation?: "landscape" | "portrait";
}>;
export type UpdateDisplaySettingsDto = z.infer<typeof updateDisplaySettingsSchema>;
export interface DisplayImageResponse {
    image: Buffer;
    contentType: string;
    width: number;
    height: number;
}
//# sourceMappingURL=display.types.d.ts.map