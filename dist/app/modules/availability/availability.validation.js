"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAvailabilityValidationSchema = exports.createAvailabilityValidationSchema = void 0;
const zod_1 = require("zod");
const timeStringSchema = zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)");
const defaultScheduleSchema = zod_1.z.object({
    start: timeStringSchema,
    end: timeStringSchema,
    isActive: zod_1.z.boolean().optional(),
    maxBookings: zod_1.z.number().min(1).optional()
});
const customDateSchema = zod_1.z.object({
    date: zod_1.z.string().or(zod_1.z.date()).transform(val => new Date(val)),
    type: zod_1.z.enum(['blocked', 'special_hours', 'unavailable']),
    start: timeStringSchema.optional(),
    end: timeStringSchema.optional(),
    maxBookings: zod_1.z.number().min(1).optional(),
    note: zod_1.z.string().optional(),
    rateMultiplier: zod_1.z.number().min(0.5).max(3).optional()
});
const recurringRuleSchema = zod_1.z.object({
    type: zod_1.z.enum(['block_weekly', 'block_monthly', 'special_hours_weekly']),
    dayOfWeek: zod_1.z.number().min(0).max(6).optional(),
    weekOfMonth: zod_1.z.number().min(1).max(5).optional(),
    start: timeStringSchema.optional(),
    end: timeStringSchema.optional(),
    maxBookings: zod_1.z.number().min(1).optional(),
    active: zod_1.z.boolean().optional()
});
exports.createAvailabilityValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        serviceId: zod_1.z.string().optional(),
        defaultSchedule: zod_1.z.object({
            monday: defaultScheduleSchema.optional(),
            tuesday: defaultScheduleSchema.optional(),
            wednesday: defaultScheduleSchema.optional(),
            thursday: defaultScheduleSchema.optional(),
            friday: defaultScheduleSchema.optional(),
            saturday: defaultScheduleSchema.optional(),
            sunday: defaultScheduleSchema.optional()
        }).optional(),
        customDates: zod_1.z.array(customDateSchema).optional(),
        recurringRules: zod_1.z.array(recurringRuleSchema).optional(),
        bufferMinutes: zod_1.z.number().min(0).max(120).optional(),
        advanceNoticeHours: zod_1.z.number().min(1).max(720).optional(),
        maxBookingsPerDay: zod_1.z.number().min(1).optional(),
        maxBookingsPerWeek: zod_1.z.number().min(1).optional(),
        autoBlockAfterBooking: zod_1.z.boolean().optional(),
        autoBlockDuration: zod_1.z.number().min(0).max(240).optional()
    })
});
exports.updateAvailabilityValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        serviceId: zod_1.z.string().optional(),
        defaultSchedule: zod_1.z.object({
            monday: defaultScheduleSchema.optional(),
            tuesday: defaultScheduleSchema.optional(),
            wednesday: defaultScheduleSchema.optional(),
            thursday: defaultScheduleSchema.optional(),
            friday: defaultScheduleSchema.optional(),
            saturday: defaultScheduleSchema.optional(),
            sunday: defaultScheduleSchema.optional()
        }).optional(),
        customDates: zod_1.z.array(customDateSchema).optional(),
        recurringRules: zod_1.z.array(recurringRuleSchema).optional(),
        bufferMinutes: zod_1.z.number().min(0).max(120).optional(),
        advanceNoticeHours: zod_1.z.number().min(1).max(720).optional(),
        maxBookingsPerDay: zod_1.z.number().min(1).optional(),
        maxBookingsPerWeek: zod_1.z.number().min(1).optional(),
        autoBlockAfterBooking: zod_1.z.boolean().optional(),
        autoBlockDuration: zod_1.z.number().min(0).max(240).optional()
    })
});
