"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Availability = void 0;
const mongoose_1 = require("mongoose");
const customDateSchema = new mongoose_1.Schema({
    date: {
        type: Date,
        required: true,
    },
    type: {
        type: String,
        enum: ['blocked', 'special_hours', 'unavailable'],
        required: true,
    },
    start: {
        type: String,
        match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    },
    end: {
        type: String,
        match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    },
    maxBookings: {
        type: Number,
        min: 1,
    },
    note: {
        type: String,
    },
    rateMultiplier: {
        type: Number,
        min: 0.5,
        max: 3,
    },
    priceOverride: {
        type: Number,
        min: 0,
    },
});
const availabilityPeriodSchema = new mongoose_1.Schema({
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    startTime: {
        type: String,
        required: true,
        match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    },
    endTime: {
        type: String,
        required: true,
        match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    },
    maxBookings: {
        type: Number,
        min: 1,
    },
    rateMultiplier: {
        type: Number,
        min: 0.5,
        max: 3,
    },
    priceOverride: {
        type: Number,
        min: 0,
    },
});
const blockedDateRangeSchema = new mongoose_1.Schema({
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    note: {
        type: String,
    },
});
const recurringRuleSchema = new mongoose_1.Schema({
    type: {
        type: String,
        enum: ['block_weekly', 'block_monthly', 'special_hours_weekly'],
        required: true,
    },
    dayOfWeek: {
        type: Number,
        min: 0,
        max: 6,
    },
    weekOfMonth: {
        type: Number,
        min: 1,
        max: 5,
    },
    start: {
        type: String,
        match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    },
    end: {
        type: String,
        match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    },
    maxBookings: {
        type: Number,
        min: 1,
    },
    active: {
        type: Boolean,
        default: true,
    },
});
const defaultScheduleSchema = new mongoose_1.Schema({
    start: {
        type: String,
        required: true,
        match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    },
    end: {
        type: String,
        required: true,
        match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    maxBookings: {
        type: Number,
        default: 1,
        min: 1,
    },
});
const availabilitySchema = new mongoose_1.Schema({
    providerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    serviceId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Service',
        index: true,
    },
    defaultSchedule: {
        monday: {
            type: defaultScheduleSchema,
            default: {
                start: '09:00',
                end: '18:00',
                isActive: true,
                maxBookings: 1,
            },
        },
        tuesday: {
            type: defaultScheduleSchema,
            default: {
                start: '09:00',
                end: '18:00',
                isActive: true,
                maxBookings: 1,
            },
        },
        wednesday: {
            type: defaultScheduleSchema,
            default: {
                start: '09:00',
                end: '18:00',
                isActive: true,
                maxBookings: 1,
            },
        },
        thursday: {
            type: defaultScheduleSchema,
            default: {
                start: '09:00',
                end: '18:00',
                isActive: true,
                maxBookings: 1,
            },
        },
        friday: {
            type: defaultScheduleSchema,
            default: {
                start: '09:00',
                end: '18:00',
                isActive: true,
                maxBookings: 1,
            },
        },
        saturday: {
            type: defaultScheduleSchema,
            default: {
                start: '10:00',
                end: '16:00',
                isActive: true,
                maxBookings: 1,
            },
        },
        sunday: {
            type: defaultScheduleSchema,
            default: {
                start: '10:00',
                end: '16:00',
                isActive: false,
                maxBookings: 1,
            },
        },
    },
    customDates: {
        type: [customDateSchema],
        default: [],
    },
    recurringRules: {
        type: [recurringRuleSchema],
        default: [],
    },
    availabilityPeriods: {
        type: [availabilityPeriodSchema],
        default: [],
    },
    blockedDateRanges: {
        type: [blockedDateRangeSchema],
        default: [],
    },
    bufferMinutes: {
        type: Number,
        default: 15,
        min: 0,
        max: 120,
    },
    advanceNoticeHours: {
        type: Number,
        default: 24,
        min: 1,
        max: 720,
    },
    maxBookingsPerDay: {
        type: Number,
        default: 3,
        min: 1,
    },
    maxBookingsPerWeek: {
        type: Number,
        default: 10,
        min: 1,
    },
    autoBlockAfterBooking: {
        type: Boolean,
        default: true,
    },
    autoBlockDuration: {
        type: Number,
        default: 30,
        min: 0,
        max: 240,
    },
    googleCalendarSync: {
        calendarId: String,
        lastSynced: Date,
        syncEnabled: {
            type: Boolean,
            default: false,
        },
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
availabilitySchema.index({ providerId: 1, serviceId: 1 });
availabilitySchema.index({ 'customDates.date': 1 });
availabilitySchema.index({ providerId: 1, 'customDates.date': 1 });
exports.Availability = (0, mongoose_1.model)('Availability', availabilitySchema);
