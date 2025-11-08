"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateDisplaySettingsSchema = void 0;
const zod_1 = require("zod");
exports.updateDisplaySettingsSchema = zod_1.z.object({
    refreshInterval: zod_1.z.number().min(60).max(86400).optional(),
    brightness: zod_1.z.number().min(0).max(100).optional(),
    orientation: zod_1.z.enum(['landscape', 'portrait']).optional(),
});
//# sourceMappingURL=display.types.js.map