"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCategorySchema = exports.createCategorySchema = void 0;
const zod_1 = require("zod");
const user_1 = require("../../../enum/user");
// Convert enum to array of values
const serviceTypeValues = Object.values(user_1.SERVICE_TYPE);
exports.createCategorySchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string({
            required_error: 'Category name is required',
        }),
        description: zod_1.z.string().optional(),
        image: zod_1.z.string().optional(),
        serviceType: zod_1.z.enum(serviceTypeValues, {
            required_error: 'Service type is required',
        }),
        isActive: zod_1.z.boolean().optional(),
    }),
});
exports.updateCategorySchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().optional(),
        description: zod_1.z.string().optional(),
        image: zod_1.z.string().optional(),
        serviceType: zod_1.z.enum(serviceTypeValues).optional(),
        isActive: zod_1.z.boolean().optional(),
    }),
});
