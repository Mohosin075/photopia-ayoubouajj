"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Analytics = void 0;
const mongoose_1 = require("mongoose");
const analyticsSchema = new mongoose_1.Schema({
    providerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    serviceId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Service',
    },
    visitorId: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ['view', 'interaction'],
        required: true,
    },
    interactionType: {
        type: String,
        enum: ['booking_start', 'contact_click', 'share', 'invoice_download', 'profile_view', 'service_view'],
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
    duration: {
        type: Number,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
// Indexes for efficient aggregation
analyticsSchema.index({ providerId: 1, timestamp: -1 });
analyticsSchema.index({ serviceId: 1, timestamp: -1 });
analyticsSchema.index({ visitorId: 1, providerId: 1 });
analyticsSchema.index({ type: 1, interactionType: 1 });
exports.Analytics = (0, mongoose_1.model)('Analytics', analyticsSchema);
