"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.modifyOfferValidationSchema = exports.updateBookingStatusSchema = exports.createBookingValidationSchema = void 0;
const zod_1 = require("zod");
const timeStringSchema = zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)");
exports.createBookingValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        providerId: zod_1.z.string({ required_error: 'Provider ID is required' }),
        serviceId: zod_1.z.string({ required_error: 'Service ID is required' }),
        bookingDate: zod_1.z.string().or(zod_1.z.date()).transform(val => new Date(val)),
        startTime: timeStringSchema,
        endTime: timeStringSchema,
        packageName: zod_1.z.string().optional(),
        eventLocation: zod_1.z.object({
            address: zod_1.z.string({ required_error: 'Address is required' }),
            city: zod_1.z.string({ required_error: 'City is required' }),
            country: zod_1.z.string({ required_error: 'Country is required' }),
            coordinates: zod_1.z.object({
                lat: zod_1.z.number(),
                lng: zod_1.z.number()
            }).optional(),
            distanceFromProviderKm: zod_1.z.number().min(0, { message: 'Distance must be a positive number' }).optional(),
            notes: zod_1.z.string().optional()
        }),
        clientName: zod_1.z.string({ required_error: 'Client name is required' }),
        clientEmail: zod_1.z.string({ required_error: 'Client email is required' }).email(),
        clientPhone: zod_1.z.string().optional(),
        eventType: zod_1.z.string().optional(),
        specialRequests: zod_1.z.string().optional()
    })
});
exports.updateBookingStatusSchema = zod_1.z.object({
    body: zod_1.z.object({
        status: zod_1.z.enum(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled']),
        cancellationReason: zod_1.z.string().optional()
    })
});
exports.modifyOfferValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        baseRate: zod_1.z.number().min(0).optional(),
        packageName: zod_1.z.string().optional(),
        customOptions: zod_1.z.array(zod_1.z.object({
            name: zod_1.z.string(),
            price: zod_1.z.number().min(0)
        })).optional()
    })
});
