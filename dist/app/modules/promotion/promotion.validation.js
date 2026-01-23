"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromotionValidation = void 0;
const zod_1 = require("zod");
const createPromotionZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        code: zod_1.z
            .string()
            .min(2)
            .max(50)
            .regex(/^[A-Z0-9_]+$/i),
        description: zod_1.z.string().optional(),
        discountType: zod_1.z.enum(['percentage', 'fixed']),
        discountValue: zod_1.z.number().min(0),
        validUntil: zod_1.z.string().datetime(),
        usageLimit: zod_1.z.number().int().min(0).optional(),
        isSingleUse: zod_1.z.boolean().default(false),
    }),
});
const updatePromotionZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        code: zod_1.z
            .string()
            .min(2)
            .max(50)
            .regex(/^[A-Z0-9_]+$/i)
            .optional(),
        description: zod_1.z.string().optional(),
        discountType: zod_1.z.enum(['percentage', 'fixed']).optional(),
        discountValue: zod_1.z.number().min(0).optional(),
        validUntil: zod_1.z.string().datetime().optional(),
        usageLimit: zod_1.z.number().int().min(0).optional(),
        isSingleUse: zod_1.z.boolean().optional(),
        isActive: zod_1.z.boolean().optional(),
    }),
});
const validatePromotionZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        code: zod_1.z.string().min(1, 'Promotion code is required'),
    }),
});
const applyPromotionZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        code: zod_1.z.string().min(1, 'Promotion code is required'),
        amount: zod_1.z.number().min(0, 'Amount must be greater than 0'),
    }),
});
exports.PromotionValidation = {
    createPromotionZodSchema,
    updatePromotionZodSchema,
    validatePromotionZodSchema,
    applyPromotionZodSchema,
};
