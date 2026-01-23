import { z } from 'zod'

const timeStringSchema = z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)")

const defaultScheduleSchema = z.object({
  start: timeStringSchema,
  end: timeStringSchema,
  isActive: z.boolean().optional(),
  maxBookings: z.number().min(1).optional()
})

const customDateSchema = z.object({
  date: z.string().or(z.date()).transform(val => new Date(val)),
  type: z.enum(['blocked', 'special_hours', 'unavailable']),
  start: timeStringSchema.optional(),
  end: timeStringSchema.optional(),
  maxBookings: z.number().min(1).optional(),
  note: z.string().optional(),
  rateMultiplier: z.number().min(0.5).max(3).optional(),
  priceOverride: z.number().min(0).optional()
})

const recurringRuleSchema = z.object({
  type: z.enum(['block_weekly', 'block_monthly', 'special_hours_weekly']),
  dayOfWeek: z.number().min(0).max(6).optional(),
  weekOfMonth: z.number().min(1).max(5).optional(),
  start: timeStringSchema.optional(),
  end: timeStringSchema.optional(),
  maxBookings: z.number().min(1).optional(),
  active: z.boolean().optional()
})

export const createAvailabilityValidationSchema = z.object({
  body: z.object({
    serviceId: z.string().optional(),
    defaultSchedule: z.object({
      monday: defaultScheduleSchema.optional(),
      tuesday: defaultScheduleSchema.optional(),
      wednesday: defaultScheduleSchema.optional(),
      thursday: defaultScheduleSchema.optional(),
      friday: defaultScheduleSchema.optional(),
      saturday: defaultScheduleSchema.optional(),
      sunday: defaultScheduleSchema.optional()
    }).optional(),
    customDates: z.array(customDateSchema).optional(),
    recurringRules: z.array(recurringRuleSchema).optional(),
    bufferMinutes: z.number().min(0).max(120).optional(),
    advanceNoticeHours: z.number().min(1).max(720).optional(),
    maxBookingsPerDay: z.number().min(1).optional(),
    maxBookingsPerWeek: z.number().min(1).optional(),
    autoBlockAfterBooking: z.boolean().optional(),
    autoBlockDuration: z.number().min(0).max(240).optional()
  })
})

export const updateAvailabilityValidationSchema = z.object({
  body: z.object({
    serviceId: z.string().optional(),
    defaultSchedule: z.object({
      monday: defaultScheduleSchema.optional(),
      tuesday: defaultScheduleSchema.optional(),
      wednesday: defaultScheduleSchema.optional(),
      thursday: defaultScheduleSchema.optional(),
      friday: defaultScheduleSchema.optional(),
      saturday: defaultScheduleSchema.optional(),
      sunday: defaultScheduleSchema.optional()
    }).optional(),
    customDates: z.array(customDateSchema).optional(),
    recurringRules: z.array(recurringRuleSchema).optional(),
    bufferMinutes: z.number().min(0).max(120).optional(),
    advanceNoticeHours: z.number().min(1).max(720).optional(),
    maxBookingsPerDay: z.number().min(1).optional(),
    maxBookingsPerWeek: z.number().min(1).optional(),
    autoBlockAfterBooking: z.boolean().optional(),
    autoBlockDuration: z.number().min(0).max(240).optional()
  })
})
