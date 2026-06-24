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
const areaOfInterventionSchema = zod_1.z.object({
    mainCity: zod_1.z.string().optional(),
    department: zod_1.z.string().optional(),
    radius: zod_1.z.string().optional(),
    availableForTravel: zod_1.z.boolean().optional(),
});
const experienceDetailsSchema = zod_1.z.object({
    yearsOfExperience: zod_1.z.string().optional(),
    projectsCompleted: zod_1.z.string().optional(),
    education: zod_1.z.string().optional(),
});
const notificationPreferencesSchema = zod_1.z.object({
    emailNewRequests: zod_1.z.boolean({
        required_error: 'Email preference is required',
    }),
    smsUrgentRequests: zod_1.z.boolean({
        required_error: 'SMS preference is required',
    }),
    newsletterPros: zod_1.z.boolean({
        required_error: 'Newsletter preference is required',
    }),
    customerReviewReminder: zod_1.z.boolean({
        required_error: 'Review reminder preference is required',
    }),
});
const legalNoticeSchema = zod_1.z.object({
    acceptedTerms: zod_1.z
        .boolean()
        .refine(val => val === true, {
        message: 'You must accept the Terms of Use',
    }),
    privacyPolicy: zod_1.z
        .boolean()
        .refine(val => val === true, {
        message: 'You must accept the Privacy Policy',
    }),
    gdprAuthorization: zod_1.z
        .boolean()
        .refine(val => val === true, {
        message: 'You must accept GDPR Authorization',
    }),
});
exports.createProfessionalProfileSchema = zod_1.z.object({
    body: zod_1.z.object({
        dateOfBirth: zod_1.z.string({ required_error: 'Date of birth is required' }),
        primaryDomain: zod_1.z
            .array(zod_1.z.enum(['Photography', 'Videography', 'Editing']))
            .min(1, 'At least one primary domain is required'),
        categories: zod_1.z.array(zod_1.z.string()).optional(),
        areaOfIntervention: areaOfInterventionSchema.optional(),
        experienceDetails: experienceDetailsSchema.optional(),
        notificationPreferences: notificationPreferencesSchema,
        legalNotice: legalNoticeSchema,
        miniBio: zod_1.z.string().max(500).optional(),
        externalPortfolioLink: zod_1.z.string().url().optional(),
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
        dateOfBirth: zod_1.z.string().optional(),
        primaryDomain: zod_1.z
            .array(zod_1.z.enum(['Photography', 'Videography', 'Editing']))
            .optional(),
        categories: zod_1.z.array(zod_1.z.string()).optional(),
        areaOfIntervention: areaOfInterventionSchema.optional(),
        experienceDetails: experienceDetailsSchema.optional(),
        notificationPreferences: notificationPreferencesSchema.optional(),
        legalNotice: legalNoticeSchema.optional(),
        miniBio: zod_1.z.string().max(500).optional(),
        externalPortfolioLink: zod_1.z.string().url().optional(),
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
        field: zod_1.z.enum([
            'portfolio',
            'specialties',
            'language',
            'documents',
            'categories',
            'primaryDomain',
        ]),
        values: zod_1.z.array(zod_1.z.string()).min(1, 'At least one value is required'),
    }),
});
exports.ProfessionalProfileValidation = {
    createProfessionalProfileSchema: exports.createProfessionalProfileSchema,
    updateProfessionalProfileSchema: exports.updateProfessionalProfileSchema,
    removeItemSchema: exports.removeItemSchema,
};
