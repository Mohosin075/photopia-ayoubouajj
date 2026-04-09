"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterServiceSchema = exports.toggleServiceStatusSchema = exports.updateServiceSchema = exports.createServiceSchema = void 0;
const zod_1 = require("zod");
const service_constants_1 = require("./service.constants");
const user_1 = require("../../../enum/user");
const service_1 = require("../../../enum/service");
// Convert enums to arrays for Zod
const serviceTypeValues = Object.values(user_1.SERVICE_TYPE);
const pricingTypeValues = Object.values(service_1.SERVICE_PRICING_TYPE);
const locationTypeValues = Object.values(service_1.SERVICE_LOCATION_TYPE);
const statusValues = Object.values(service_1.SERVICE_STATUS);
const locationSchema = zod_1.z.object({
    type: zod_1.z.enum(locationTypeValues),
    country: zod_1.z.string().min(2).max(100),
    city: zod_1.z.string().min(2).max(100),
    address: zod_1.z.string().optional(),
    coordinates: zod_1.z.object({
        lat: zod_1.z.number().min(-90).max(90).optional(),
        lng: zod_1.z.number().min(-180).max(180).optional(),
    }).optional(),
    serviceRadiusKm: zod_1.z.number()
        .min(service_constants_1.SERVICE_CONSTANTS.VALIDATION.SERVICE_RADIUS_MIN)
        .max(service_constants_1.SERVICE_CONSTANTS.VALIDATION.SERVICE_RADIUS_MAX)
        .optional(),
});
const pricingModelSchema = zod_1.z.object({
    type: zod_1.z.enum(pricingTypeValues),
    weekdayHourlyRate: zod_1.z.number().min(0).optional(),
    weekendHourlyRate: zod_1.z.number().min(0).optional(),
    dailyRate: zod_1.z.number().min(0).optional(),
    dailyHours: zod_1.z.number().min(1).optional(),
    packages: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string().min(1),
        price: zod_1.z.number().min(0),
        duration: zod_1.z.number().min(1),
        description: zod_1.z.string().optional(),
        includes: zod_1.z.array(zod_1.z.string()).optional(),
    })).optional(),
});
exports.createServiceSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string()
            .min(service_constants_1.SERVICE_CONSTANTS.VALIDATION.TITLE_MIN_LENGTH)
            .max(service_constants_1.SERVICE_CONSTANTS.VALIDATION.TITLE_MAX_LENGTH),
        description: zod_1.z.string()
            .min(service_constants_1.SERVICE_CONSTANTS.VALIDATION.DESCRIPTION_MIN_LENGTH)
            .max(service_constants_1.SERVICE_CONSTANTS.VALIDATION.DESCRIPTION_MAX_LENGTH),
        category: zod_1.z.string().min(2).max(50),
        serviceType: zod_1.z.enum(serviceTypeValues, {
            required_error: 'Service type is required',
        }),
        subCategory: zod_1.z.string().optional(),
        tags: zod_1.z.array(zod_1.z.string().min(1).max(30)).optional(),
        equipment: zod_1.z.array(zod_1.z.string().min(1).max(50)).optional(),
        price: zod_1.z.number()
            .min(service_constants_1.SERVICE_CONSTANTS.VALIDATION.PRICE_MIN)
            .max(service_constants_1.SERVICE_CONSTANTS.VALIDATION.PRICE_MAX),
        currency: zod_1.z.string().length(3).default('EUR'),
        pricingType: zod_1.z.enum(pricingTypeValues),
        pricingModel: pricingModelSchema.optional(),
        duration: zod_1.z.string().min(1).max(100),
        location: locationSchema,
        // coverMedia: z.string().url().optional(),
        gallery: zod_1.z.array(zod_1.z.string().url()).optional(),
        status: zod_1.z.enum(statusValues).default(service_1.SERVICE_STATUS.ACTIVE),
    }).superRefine((data, ctx) => {
        var _a, _b;
        if (data.pricingType === service_1.SERVICE_PRICING_TYPE.DAILY) {
            if (!((_a = data.pricingModel) === null || _a === void 0 ? void 0 : _a.dailyRate)) {
                ctx.addIssue({
                    code: zod_1.z.ZodIssueCode.custom,
                    message: 'Daily rate is required for DAILY pricing type',
                    path: ['pricingModel', 'dailyRate'],
                });
            }
        }
        if (data.pricingType === service_1.SERVICE_PRICING_TYPE.PACKAGE) {
            if (!((_b = data.pricingModel) === null || _b === void 0 ? void 0 : _b.packages) || data.pricingModel.packages.length === 0) {
                ctx.addIssue({
                    code: zod_1.z.ZodIssueCode.custom,
                    message: 'At least one package is required for PACKAGE pricing type',
                    path: ['pricingModel', 'packages'],
                });
            }
        }
    }),
});
exports.updateServiceSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string()
            .min(service_constants_1.SERVICE_CONSTANTS.VALIDATION.TITLE_MIN_LENGTH)
            .max(service_constants_1.SERVICE_CONSTANTS.VALIDATION.TITLE_MAX_LENGTH)
            .optional(),
        description: zod_1.z.string()
            .min(service_constants_1.SERVICE_CONSTANTS.VALIDATION.DESCRIPTION_MIN_LENGTH)
            .max(service_constants_1.SERVICE_CONSTANTS.VALIDATION.DESCRIPTION_MAX_LENGTH)
            .optional(),
        category: zod_1.z.string().min(2).max(50).optional(),
        serviceType: zod_1.z.enum(serviceTypeValues).optional(),
        subCategory: zod_1.z.string().optional(),
        tags: zod_1.z.array(zod_1.z.string().min(1).max(30)).optional(),
        equipment: zod_1.z.array(zod_1.z.string().min(1).max(50)).optional(),
        price: zod_1.z.number()
            .min(service_constants_1.SERVICE_CONSTANTS.VALIDATION.PRICE_MIN)
            .max(service_constants_1.SERVICE_CONSTANTS.VALIDATION.PRICE_MAX)
            .optional(),
        currency: zod_1.z.string().length(3).optional(),
        pricingType: zod_1.z.enum(pricingTypeValues).optional(),
        pricingModel: pricingModelSchema.partial().optional(),
        duration: zod_1.z.string().min(1).max(100).optional(),
        location: locationSchema.partial().optional(),
        coverMedia: zod_1.z.string().url().optional(),
        gallery: zod_1.z.array(zod_1.z.string().url()).optional(),
        status: zod_1.z.enum(statusValues).optional(),
        isVerified: zod_1.z.boolean().optional(),
        isActive: zod_1.z.boolean().optional(),
    }).superRefine((data, ctx) => {
        if (data.pricingType === service_1.SERVICE_PRICING_TYPE.DAILY) {
            if (data.pricingModel && !data.pricingModel.dailyRate) {
                ctx.addIssue({
                    code: zod_1.z.ZodIssueCode.custom,
                    message: 'Daily rate is required when changing to DAILY pricing type',
                    path: ['pricingModel', 'dailyRate'],
                });
            }
        }
        if (data.pricingType === service_1.SERVICE_PRICING_TYPE.PACKAGE) {
            if (data.pricingModel && (!data.pricingModel.packages || data.pricingModel.packages.length === 0)) {
                ctx.addIssue({
                    code: zod_1.z.ZodIssueCode.custom,
                    message: 'At least one package is required when changing to PACKAGE pricing type',
                    path: ['pricingModel', 'packages'],
                });
            }
        }
    }),
});
exports.toggleServiceStatusSchema = zod_1.z.object({
    body: zod_1.z.object({
        status: zod_1.z.enum(statusValues),
    }),
});
exports.filterServiceSchema = zod_1.z.object({
    query: zod_1.z.object({
        searchTerm: zod_1.z.string().optional(),
        category: zod_1.z.string().optional(),
        subCategory: zod_1.z.string().optional(),
        tags: zod_1.z.string().optional(),
        pricingType: zod_1.z.enum(pricingTypeValues).optional(),
        minPrice: zod_1.z.string().optional(),
        maxPrice: zod_1.z.string().optional(),
        'location.type': zod_1.z.enum(locationTypeValues).optional(),
        'location.country': zod_1.z.string().optional(),
        'location.city': zod_1.z.string().optional(),
        status: zod_1.z.enum(statusValues).optional(),
        isVerified: zod_1.z.enum(['true', 'false']).optional(),
        providerId: zod_1.z.string().optional(),
        serviceType: zod_1.z.enum(serviceTypeValues).optional(),
        isActive: zod_1.z.enum(['true', 'false']).optional(),
    }),
});
