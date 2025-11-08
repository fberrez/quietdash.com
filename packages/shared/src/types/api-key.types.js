"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateApiKeySchema = exports.createApiKeySchema = void 0;
const zod_1 = require("zod");
const constants_1 = require("../constants");
exports.createApiKeySchema = zod_1.z.object({
    provider: zod_1.z.enum([
        constants_1.SERVICE_PROVIDERS.OPEN_WEATHER_MAP,
        constants_1.SERVICE_PROVIDERS.GOOGLE_CALENDAR,
    ]),
    apiKey: zod_1.z.string().min(1, 'API key is required'),
});
exports.updateApiKeySchema = zod_1.z.object({
    apiKey: zod_1.z.string().min(1, 'API key is required'),
});
//# sourceMappingURL=api-key.types.js.map