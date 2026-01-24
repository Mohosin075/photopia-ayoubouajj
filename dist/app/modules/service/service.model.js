"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Service = void 0;
const mongoose_1 = require("mongoose");
const service_constants_1 = require("./service.constants");
const service_1 = require("../../../enum/service");
const locationSchema = new mongoose_1.Schema({
    type: {
        type: String,
        enum: Object.values(service_1.SERVICE_LOCATION_TYPE),
        default: service_1.SERVICE_LOCATION_TYPE.ONSITE
    },
    country: {
        type: String,
        trim: true,
    },
    city: {
        type: String,
        required: true,
        trim: true,
    },
    address: {
        type: String,
        trim: true,
    },
    coordinates: {
        lat: {
            type: Number,
            min: -90,
            max: 90,
        },
        lng: {
            type: Number,
            min: -180,
            max: 180,
        },
    },
    serviceRadiusKm: {
        type: Number,
        min: service_constants_1.SERVICE_CONSTANTS.VALIDATION.SERVICE_RADIUS_MIN,
        max: service_constants_1.SERVICE_CONSTANTS.VALIDATION.SERVICE_RADIUS_MAX,
        default: service_constants_1.SERVICE_CONSTANTS.DEFAULT_VALUES.SERVICE_RADIUS_KM,
    },
});
const servicePricingSchema = new mongoose_1.Schema({
    type: {
        type: String,
        enum: Object.values(service_1.SERVICE_PRICING_TYPE)
    },
    weekdayHourlyRate: {
        type: Number,
        min: 0
    },
    weekendHourlyRate: {
        type: Number,
        min: 0
    },
    dailyRate: {
        type: Number,
        min: 0
    },
    dailyHours: {
        type: Number,
        default: 8,
        min: 1
    },
    packages: [{
            name: {
                type: String,
                required: true
            },
            price: {
                type: Number,
                required: true,
                min: 0
            },
            duration: {
                type: Number,
                required: true,
                min: 1
            },
            description: String,
            includes: [String]
        }]
});
const pricingRuleSchema = new mongoose_1.Schema({
    ruleType: {
        type: String,
        required: true
    },
    condition: {
        startHour: Number,
        endHour: Number,
        daysOfWeek: [Number],
        specificDates: [Date],
        startDate: Date,
        endDate: Date,
        minDuration: Number,
        maxDuration: Number
    },
    modifierType: {
        type: String,
        required: true
    },
    modifierValue: {
        type: Number,
        required: true
    },
    priority: {
        type: Number,
        default: 10
    }
});
const serviceSchema = new mongoose_1.Schema({
    providerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
        minlength: service_constants_1.SERVICE_CONSTANTS.VALIDATION.TITLE_MIN_LENGTH,
        maxlength: service_constants_1.SERVICE_CONSTANTS.VALIDATION.TITLE_MAX_LENGTH,
    },
    description: {
        type: String,
        required: true,
        trim: true,
        minlength: service_constants_1.SERVICE_CONSTANTS.VALIDATION.DESCRIPTION_MIN_LENGTH,
        maxlength: service_constants_1.SERVICE_CONSTANTS.VALIDATION.DESCRIPTION_MAX_LENGTH,
    },
    category: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
    },
    subCategory: {
        type: String,
        trim: true,
    },
    tags: {
        type: [String],
        default: [],
    },
    equipment: {
        type: [String],
        default: [],
    },
    price: {
        type: Number,
        required: true,
        min: service_constants_1.SERVICE_CONSTANTS.VALIDATION.PRICE_MIN,
        max: service_constants_1.SERVICE_CONSTANTS.VALIDATION.PRICE_MAX,
    },
    currency: {
        type: String,
        required: true,
        default: 'EUR',
        uppercase: true,
    },
    pricingType: {
        type: String,
        enum: Object.values(service_1.SERVICE_PRICING_TYPE),
        required: true,
    },
    pricingModel: {
        type: servicePricingSchema
    },
    pricingRules: {
        type: [pricingRuleSchema],
        default: []
    },
    travelFeePerKm: {
        type: Number,
        default: 1.5,
        min: 0
    },
    allowOutsideRadius: {
        type: Boolean,
        default: true
    },
    maxTravelFee: {
        type: Number,
        default: 100,
        min: 0
    },
    depositPercentage: {
        type: Number,
        default: 0.5,
        min: 0,
        max: 1
    },
    cancellationPolicy: {
        freeCancellationHours: {
            type: Number,
            default: 24
        },
        partialRefundHours: {
            type: Number,
            default: 12
        },
        noRefundHours: {
            type: Number,
            default: 2
        }
    },
    duration: {
        type: String,
        required: true,
    },
    location: {
        type: locationSchema,
        required: true,
    },
    coverMedia: {
        type: String,
    },
    gallery: {
        type: [String],
        default: [],
    },
    status: {
        type: String,
        enum: Object.values(service_1.SERVICE_STATUS),
        required: true,
        default: service_1.SERVICE_STATUS.ACTIVE,
    },
    isVerified: {
        type: Boolean,
        default: service_constants_1.SERVICE_CONSTANTS.DEFAULT_VALUES.IS_VERIFIED,
    },
    isActive: {
        type: Boolean,
        default: service_constants_1.SERVICE_CONSTANTS.DEFAULT_VALUES.IS_ACTIVE,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
// Indexes for better query performance
serviceSchema.index({ providerId: 1 });
serviceSchema.index({ category: 1 });
serviceSchema.index({ subCategory: 1 });
serviceSchema.index({ tags: 1 });
serviceSchema.index({ 'location.type': 1 });
serviceSchema.index({ 'location.city': 1, 'location.country': 1 });
serviceSchema.index({ status: 1 });
serviceSchema.index({ isActive: 1 });
serviceSchema.index({ isDeleted: 1 });
serviceSchema.index({ price: 1 });
serviceSchema.index({ title: 'text', description: 'text', tags: 'text' });
exports.Service = (0, mongoose_1.model)('Service', serviceSchema);
