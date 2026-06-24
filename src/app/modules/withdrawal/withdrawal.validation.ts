import { z } from 'zod'

const createWithdrawalZodSchema = z.object({
  body: z.object({
    amount: z
      .number({
        required_error: 'Amount is required',
      })
      .positive('Amount must be positive'),
    currency: z.string().optional(),
    bankAccountDetails: z
      .object({
        accountHolderName: z.string({
          required_error: 'Account holder name is required',
        }),
        bankName: z.string({
          required_error: 'Bank name is required',
        }),
        iban: z.string({
          required_error: 'IBAN is required',
        }),
        swiftCode: z.string().optional(),
      })
      .optional(),
  }),
})

const updateWithdrawalStatusZodSchema = z.object({
  body: z.object({
    status: z.enum(['completed', 'failed', 'cancelled'], {
      required_error: 'Status is required',
    }),
    transactionId: z.string().optional(),
  }),
})

export const WithdrawalValidation = {
  createWithdrawalZodSchema,
  updateWithdrawalStatusZodSchema,
}
