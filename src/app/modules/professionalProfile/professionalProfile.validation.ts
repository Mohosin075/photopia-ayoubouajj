import { z } from 'zod'

const socialLinksSchema = z.object({
    instagram: z.string().url().optional(),
    twitter: z.string().url().optional(),
    linkedin: z.string().url().optional(),
    website: z.string().url().optional(),
})

const areaOfInterventionSchema = z.object({
    mainCity: z.string().optional(),
    department: z.string().optional(),
    radius: z.string().optional(),
    availableForTravel: z.boolean().optional(),
})

const experienceDetailsSchema = z.object({
    yearsOfExperience: z.string().optional(),
    projectsCompleted: z.string().optional(),
    education: z.string().optional(),
})

const notificationPreferencesSchema = z.object({
    emailNewRequests: z.boolean({ required_error: 'Email preference is required' }),
    smsUrgentRequests: z.boolean({ required_error: 'SMS preference is required' }),
    newsletterPros: z.boolean({ required_error: 'Newsletter preference is required' }),
    customerReviewReminder: z.boolean({ required_error: 'Review reminder preference is required' }),
})

const legalNoticeSchema = z.object({
    acceptedTerms: z.boolean().refine(val => val === true, { message: 'You must accept the Terms of Use' }),
    privacyPolicy: z.boolean().refine(val => val === true, { message: 'You must accept the Privacy Policy' }),
    gdprAuthorization: z.boolean().refine(val => val === true, { message: 'You must accept GDPR Authorization' }),
})

export const createProfessionalProfileSchema = z.object({
    body: z.object({
        dateOfBirth: z.string({ required_error: 'Date of birth is required' }),
        primaryDomain: z.array(z.enum(['Photography', 'Videography', 'Editing'])).min(1, 'At least one primary domain is required'),
        categories: z.array(z.string()).optional(),
        areaOfIntervention: areaOfInterventionSchema.optional(),
        experienceDetails: experienceDetailsSchema.optional(),
        notificationPreferences: notificationPreferencesSchema,
        legalNotice: legalNoticeSchema,
        miniBio: z.string().max(500).optional(),
        externalPortfolioLink: z.string().url().optional(),
        bio: z.string().optional(),
        coverPhoto: z.string().optional(),
        specialties: z.array(z.string()).optional(),
        experience: z.string().optional(),
        portfolio: z.array(z.string()).optional(),
        documents: z.array(z.string()).optional(),
        language: z.array(z.string()).optional(),
        socialLinks: socialLinksSchema.optional(),
    }),
})

export const updateProfessionalProfileSchema = z.object({
    body: z.object({
        dateOfBirth: z.string().optional(),
        primaryDomain: z.array(z.enum(['Photography', 'Videography', 'Editing'])).optional(),
        categories: z.array(z.string()).optional(),
        areaOfIntervention: areaOfInterventionSchema.optional(),
        experienceDetails: experienceDetailsSchema.optional(),
        notificationPreferences: notificationPreferencesSchema.optional(),
        legalNotice: legalNoticeSchema.optional(),
        miniBio: z.string().max(500).optional(),
        externalPortfolioLink: z.string().url().optional(),
        bio: z.string().optional(),
        coverPhoto: z.string().optional(),
        specialties: z.array(z.string()).optional(),
        experience: z.string().optional(),
        portfolio: z.array(z.string()).optional(),
        documents: z.array(z.string()).optional(),
        language: z.array(z.string()).optional(),
        socialLinks: socialLinksSchema.optional(),
    }),
})

export const removeItemSchema = z.object({
    body: z.object({
        field: z.enum(['portfolio', 'specialties', 'language', 'documents', 'categories', 'primaryDomain']),
        values: z.array(z.string()).min(1, 'At least one value is required'),
    }),
})

export const ProfessionalProfileValidation = {
    createProfessionalProfileSchema,
    updateProfessionalProfileSchema,
    removeItemSchema,
}
