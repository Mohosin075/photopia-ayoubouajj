import { z } from 'zod'

const getWalletByUserIdZodSchema = z.object({
  params: z.object({
    userId: z.string({
      required_error: 'User ID is required',
    }),
  }),
})

export const WalletValidation = {
  getWalletByUserIdZodSchema,
}
