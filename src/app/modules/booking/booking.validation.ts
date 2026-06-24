import { z } from 'zod'

const timeStringSchema = z
  .string()
  .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)')

export const createBookingValidationSchema = z.object({
  body: z.object({
    providerId: z.string({ required_error: 'Provider ID is required' }),
    serviceId: z.string({ required_error: 'Service ID is required' }),
    bookingDate: z
      .string()
      .or(z.date())
      .transform(val => new Date(val)),
    startTime: timeStringSchema,
    endTime: timeStringSchema,
    packageName: z.string().optional(),
    eventLocation: z.object({
      address: z.string({ required_error: 'Address is required' }),
      city: z.string({ required_error: 'City is required' }),
      country: z.string({ required_error: 'Country is required' }),
      coordinates: z
        .object({
          lat: z.number(),
          lng: z.number(),
        })
        .optional(),
      distanceFromProviderKm: z
        .number()
        .min(0, { message: 'Distance must be a positive number' })
        .optional(),
      notes: z.string().optional(),
    }),
    clientName: z.string({ required_error: 'Client name is required' }),
    clientEmail: z.string().email().optional(),
    clientPhone: z.string().optional(),
    eventType: z.string().optional(),
    specialRequests: z.string().optional(),
    paymentMode: z.enum(['intent', 'checkout']).optional(),
    paymentMethodId: z.string().optional(),
    customOptions: z
      .array(
        z.object({
          name: z.string(),
          price: z.number().min(0),
        }),
      )
      .optional(),
  }),
})

export const updateBookingStatusSchema = z.object({
  body: z.object({
    status: z.enum([
      'pending',
      'confirmed',
      'in_progress',
      'completed',
      'cancelled',
    ]),
    cancellationReason: z.string().optional(),
  }),
})

export const modifyOfferValidationSchema = z.object({
  body: z.object({
    baseRate: z.number().min(0).optional(),
    packageName: z.string().optional(),
    customOptions: z
      .array(
        z.object({
          name: z.string(),
          price: z.number().min(0),
        }),
      )
      .optional(),
  }),
})
