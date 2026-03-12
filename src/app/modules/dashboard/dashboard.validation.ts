import { z } from 'zod'

const objectIdRegex = /^[0-9a-fA-F]{24}$/

const getUserDetailsStatsZodSchema = z.object({
  params: z.object({
    userId: z
      .string({
        required_error: 'User ID is required',
      })
      .regex(objectIdRegex, 'Invalid user ID format'),
  }),
})

const warnUserZodSchema = z.object({
  body: z.object({
    userId: z
      .string({
        required_error: 'User ID is required',
      })
      .regex(objectIdRegex, 'Invalid user ID format'),
    message: z.string({
      required_error: 'Warning message is required',
    }),
  }),
})

const getModerationReportDetailsZodSchema = z.object({
  params: z.object({
    reportId: z
      .string({
        required_error: 'Report ID is required',
      })
      .regex(objectIdRegex, 'Invalid report ID format'),
  }),
})

const handleModerationActionZodSchema = z.object({
  params: z.object({
    reportId: z
      .string({
        required_error: 'Report ID is required',
      })
      .regex(objectIdRegex, 'Invalid report ID format'),
  }),
  body: z.object({
    action: z.enum(
      ['warning', 'block', 'remove', 'archive', 'refund', 'close'],
      {
        required_error: 'Action is required',
      },
    ),
    details: z.string().optional(),
  }),
})

const getTransactionDetailsZodSchema = z.object({
  params: z.object({
    transactionId: z
      .string({
        required_error: 'Transaction ID is required',
      })
      .regex(objectIdRegex, 'Invalid transaction ID format'),
  }),
})

export const DashboardValidation = {
  getUserDetailsStatsZodSchema,
  warnUserZodSchema,
  getModerationReportDetailsZodSchema,
  handleModerationActionZodSchema,
  getTransactionDetailsZodSchema,
}
