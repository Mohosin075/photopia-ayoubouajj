import { z } from 'zod'

export const createCategorySchema = z.object({
    body: z.object({
        name: z.string({
            required_error: 'Category name is required',
        }),
        description: z.string().optional(),
        icon: z.string().optional(),
        isActive: z.boolean().optional(),
    }),
})

export const updateCategorySchema = z.object({
    body: z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        icon: z.string().optional(),
        isActive: z.boolean().optional(),
    }),
})
