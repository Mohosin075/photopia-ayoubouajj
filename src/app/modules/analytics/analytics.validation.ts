import { z } from 'zod'

const trackVisitZodSchema = z.object({
  body: z.object({
    providerId: z.string({
      required_error: 'Provider ID is required',
    }),
    serviceId: z.string().optional(),
    type: z.enum(['view', 'interaction'], {
      required_error: 'Type is required',
    }),
    interactionType: z
      .enum([
        'booking_start',
        'contact_click',
        'share',
        'invoice_download',
        'profile_view',
        'service_view',
      ])
      .optional(),
  }),
})

export const AnalyticsValidation = {
  trackVisitZodSchema,
}
