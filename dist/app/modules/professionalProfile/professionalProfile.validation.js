"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfessionalProfileValidation = exports.removeItemSchema = exports.updateProfessionalProfileSchema = exports.createProfessionalProfileSchema = void 0;
const zod_1 = require("zod");
const socialLinksSchema = zod_1.z.object({
    instagram: zod_1.z.string().url().optional(),
    twitter: zod_1.z.string().url().optional(),
    linkedin: zod_1.z.string().url().optional(),
    website: zod_1.z.string().url().optional(),
});
exports.createProfessionalProfileSchema = zod_1.z.object({
    body: zod_1.z.object({
        bio: zod_1.z.string().optional(),
        coverPhoto: zod_1.z.string().optional(),
        specialties: zod_1.z.array(zod_1.z.string()).optional(),
        experience: zod_1.z.string().optional(),
        portfolio: zod_1.z.array(zod_1.z.string()).optional(),
        documents: zod_1.z.array(zod_1.z.string()).optional(),
        language: zod_1.z.array(zod_1.z.string()).optional(),
        socialLinks: socialLinksSchema.optional(),
    }),
});
exports.updateProfessionalProfileSchema = zod_1.z.object({
    body: zod_1.z.object({
        bio: zod_1.z.string().optional(),
        coverPhoto: zod_1.z.string().optional(),
        specialties: zod_1.z.array(zod_1.z.string()).optional(),
        experience: zod_1.z.string().optional(),
        portfolio: zod_1.z.array(zod_1.z.string()).optional(),
        documents: zod_1.z.array(zod_1.z.string()).optional(),
        language: zod_1.z.array(zod_1.z.string()).optional(),
        socialLinks: socialLinksSchema.optional(),
    }),
});
exports.removeItemSchema = zod_1.z.object({
    body: zod_1.z.object({
        field: zod_1.z.enum(['portfolio', 'specialties', 'language', 'documents']),
        values: zod_1.z.array(zod_1.z.string()).min(1, 'At least one value is required'),
    }),
});
exports.ProfessionalProfileValidation = {
    createProfessionalProfileSchema: exports.createProfessionalProfileSchema,
    updateProfessionalProfileSchema: exports.updateProfessionalProfileSchema,
    removeItemSchema: exports.removeItemSchema,
};
