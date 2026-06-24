"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsValidation = void 0;
const zod_1 = require("zod");
const trackVisitZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        providerId: zod_1.z.string({
            required_error: 'Provider ID is required',
        }),
        serviceId: zod_1.z.string().optional(),
        type: zod_1.z.enum(['view', 'interaction'], {
            required_error: 'Type is required',
        }),
        interactionType: zod_1.z
            .enum([
            'booking_start',
            'contact_click',
            'share',
            'invoice_download',
            'profile_view',
            'service_view',
        ])
            .optional(),
    }),
});
exports.AnalyticsValidation = {
    trackVisitZodSchema,
};
