"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateWidgetConfigSchema = exports.createWidgetConfigSchema = void 0;
const zod_1 = require("zod");
const constants_1 = require("../constants");
exports.createWidgetConfigSchema = zod_1.z.object({
    type: zod_1.z.enum([
        constants_1.WIDGET_TYPES.WEATHER,
        constants_1.WIDGET_TYPES.CALENDAR,
        constants_1.WIDGET_TYPES.TIME_DATE,
        constants_1.WIDGET_TYPES.NEWS_RSS,
    ]),
    enabled: zod_1.z.boolean().default(true),
    position: zod_1.z.object({
        x: zod_1.z.number().min(0).max(800),
        y: zod_1.z.number().min(0).max(480),
        width: zod_1.z.number().min(1).max(800),
        height: zod_1.z.number().min(1).max(480),
    }),
    settings: zod_1.z.record(zod_1.z.any()).default({}),
});
exports.updateWidgetConfigSchema = zod_1.z.object({
    enabled: zod_1.z.boolean().optional(),
    position: zod_1.z
        .object({
        x: zod_1.z.number().min(0).max(800),
        y: zod_1.z.number().min(0).max(480),
        width: zod_1.z.number().min(1).max(800),
        height: zod_1.z.number().min(1).max(480),
    })
        .optional(),
    settings: zod_1.z.record(zod_1.z.any()).optional(),
});
//# sourceMappingURL=widget.types.js.map