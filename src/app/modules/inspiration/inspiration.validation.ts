import { z } from 'zod'

export const createInspirationSchema = z.object({
    body: z.object({
        title: z.string({
            required_error: 'Title is required',
        }),
        description: z.string({
            required_error: 'Description is required',
        }),
        link: z.string({
            required_error: 'Link is required',
        }),
        icon: z.string().optional(),
    }),
})

export const updateInspirationSchema = z.object({
    body: z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        link: z.string().optional(),
        icon: z.string().optional(),
    }),
})
