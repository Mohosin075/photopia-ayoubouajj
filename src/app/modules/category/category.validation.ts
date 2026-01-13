import { z } from 'zod'
import { CATEGORY_TAG } from '../../../enum/user'

// Convert enum to array of values
const categoryTagValues = Object.values(CATEGORY_TAG) as [string, ...string[]]

export const createCategorySchema = z.object({
    body: z.object({
        name: z.string({
            required_error: 'Category name is required',
        }),
        description: z.string().optional(),
        image: z.string().optional(),
        tags: z.array(z.enum(categoryTagValues)).optional(),
        isActive: z.boolean().optional(),
    }),
})

export const updateCategorySchema = z.object({
    body: z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        image: z.string().optional(),
        tags: z.array(z.enum(categoryTagValues)).optional(),
        isActive: z.boolean().optional(),
    }),
})