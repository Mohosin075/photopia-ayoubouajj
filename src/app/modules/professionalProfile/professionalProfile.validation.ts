import { z } from 'zod'

const socialLinksSchema = z.object({
    instagram: z.string().url().optional(),
    twitter: z.string().url().optional(),
    linkedin: z.string().url().optional(),
    website: z.string().url().optional(),
})

export const createProfessionalProfileSchema = z.object({
    body: z.object({
        bio: z.string().optional(),
        coverPhoto: z.string().optional(),
        specialties: z.array(z.string()).optional(),
        experience: z.string().optional(),
        portfolio: z.array(z.string()).optional(),
        language: z.array(z.string()).optional(),
        socialLinks: socialLinksSchema.optional(),
    }),
})

export const updateProfessionalProfileSchema = z.object({
    body: z.object({
        bio: z.string().optional(),
        coverPhoto: z.string().optional(),
        specialties: z.array(z.string()).optional(),
        experience: z.string().optional(),
        portfolio: z.array(z.string()).optional(),
        language: z.array(z.string()).optional(),
        socialLinks: socialLinksSchema.optional(),
    }),
})

export const removeItemSchema = z.object({
    body: z.object({
        field: z.enum(['portfolio', 'specialties', 'language']),
        values: z.array(z.string()).min(1, 'At least one value is required'),
    }),
})

export const ProfessionalProfileValidation = {
    createProfessionalProfileSchema,
    updateProfessionalProfileSchema,
    removeItemSchema,
}
