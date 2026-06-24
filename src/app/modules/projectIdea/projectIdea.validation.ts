import { z } from 'zod'

export const createProjectIdeaSchema = z.object({
  body: z.object({
    title: z.string({
      required_error: 'Title is required',
    }),
    linkText: z.string({
      required_error: 'Link text is required',
    }),
    subCategoryId: z.string({
      required_error: 'Subcategory ID is required',
    }),
    order: z.number().optional(),
  }),
})

export const updateProjectIdeaSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    linkText: z.string().optional(),
    subCategoryId: z.string().optional(),
    order: z.number().optional(),
  }),
})
