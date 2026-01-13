import { z } from 'zod'
import { SERVICE_TYPE } from '../../../enum/user'

// Convert enum to array of values
const serviceTypeValues = Object.values(SERVICE_TYPE) as [string, ...string[]]

export const createCategorySchema = z.object({
    body: z.object({
        name: z.string({
            required_error: 'Category name is required',
        }),
        description: z.string().optional(),
        image: z.string().optional(),
        serviceType: z.enum(serviceTypeValues, {
            required_error: 'Service type is required',
        }),
        isActive: z.boolean().optional(),
    }),
})

export const updateCategorySchema = z.object({
    body: z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        image: z.string().optional(),
        serviceType: z.enum(serviceTypeValues).optional(),
        isActive: z.boolean().optional(),
    }),
})