import { z } from 'zod'

const createPromotionZodSchema = z.object({
  body: z.object({
    code: z
      .string()
      .min(2)
      .max(50)
      .regex(/^[A-Z0-9_]+$/i),
    description: z.string().optional(),
    discountType: z.enum(['percentage', 'fixed']),
    discountValue: z.number().min(0),
    validUntil: z.string().datetime(),
    usageLimit: z.number().int().min(0).optional(),
    isSingleUse: z.boolean().default(false),
  }),
})

const updatePromotionZodSchema = z.object({
  body: z.object({
    code: z
      .string()
      .min(2)
      .max(50)
      .regex(/^[A-Z0-9_]+$/i)
      .optional(),
    description: z.string().optional(),
    discountType: z.enum(['percentage', 'fixed']).optional(),
    discountValue: z.number().min(0).optional(),
    validUntil: z.string().datetime().optional(),
    usageLimit: z.number().int().min(0).optional(),
    isSingleUse: z.boolean().optional(),
    isActive: z.boolean().optional(),
  }),
})

const validatePromotionZodSchema = z.object({
  body: z.object({
    code: z.string().min(1, 'Promotion code is required'),
  }),
})

const applyPromotionZodSchema = z.object({
  body: z.object({
    code: z.string().min(1, 'Promotion code is required'),
    amount: z.number().min(0, 'Amount must be greater than 0'),
  }),
})

export const PromotionValidation = {
  createPromotionZodSchema,
  updatePromotionZodSchema,
  validatePromotionZodSchema,
  applyPromotionZodSchema,
}
