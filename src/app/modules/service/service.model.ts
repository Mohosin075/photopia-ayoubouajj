import { Schema, model } from 'mongoose'
import { IService, ServiceModel } from './service.interface'
import { SERVICE_CONSTANTS } from './service.constants'
import { SERVICE_TYPE } from '../../../enum/user'
import {
  SERVICE_LOCATION_TYPE,
  SERVICE_PRICING_TYPE,
  SERVICE_STATUS,
  SERVICE_VISIBILITY_LEVEL,
} from '../../../enum/service'

const locationSchema = new Schema({
  type: {
    type: String,
    enum: Object.values(SERVICE_LOCATION_TYPE),
    required: true,
  },
  country: {
    type: String,
    required: true,
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
    min: SERVICE_CONSTANTS.VALIDATION.SERVICE_RADIUS_MIN,
    max: SERVICE_CONSTANTS.VALIDATION.SERVICE_RADIUS_MAX,
    default: SERVICE_CONSTANTS.DEFAULT_VALUES.SERVICE_RADIUS_KM,
  },
})

const serviceSchema = new Schema<IService, ServiceModel>(
  {
    providerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: SERVICE_CONSTANTS.VALIDATION.TITLE_MIN_LENGTH,
      maxlength: SERVICE_CONSTANTS.VALIDATION.TITLE_MAX_LENGTH,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: SERVICE_CONSTANTS.VALIDATION.DESCRIPTION_MIN_LENGTH,
      maxlength: SERVICE_CONSTANTS.VALIDATION.DESCRIPTION_MAX_LENGTH,
    },
    category: {
      type: String,
      required: true,
      trim: true,
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
      min: SERVICE_CONSTANTS.VALIDATION.PRICE_MIN,
      max: SERVICE_CONSTANTS.VALIDATION.PRICE_MAX,
    },
    currency: {
      type: String,
      required: true,
      default: 'EUR',
      uppercase: true,
    },
    pricingType: {
      type: String,
      enum: Object.values(SERVICE_PRICING_TYPE),
      required: true,
    },
    minDurationHours: {
      type: Number,
      min: SERVICE_CONSTANTS.VALIDATION.DURATION_MIN,
      max: SERVICE_CONSTANTS.VALIDATION.DURATION_MAX,
    },
    maxDurationHours: {
      type: Number,
      min: SERVICE_CONSTANTS.VALIDATION.DURATION_MIN,
      max: SERVICE_CONSTANTS.VALIDATION.DURATION_MAX,
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
    visibilityLevel: {
      type: String,
      enum: Object.values(SERVICE_VISIBILITY_LEVEL),
      required: true,
      default: SERVICE_VISIBILITY_LEVEL.FREE,
    },
    status: {
      type: String,
      enum: Object.values(SERVICE_STATUS),
      required: true,
      default: SERVICE_STATUS.ACTIVE,
    },
    isVerified: {
      type: Boolean,
      default: SERVICE_CONSTANTS.DEFAULT_VALUES.IS_VERIFIED,
    },
    ratingAverage: {
      type: Number,
      min: SERVICE_CONSTANTS.VALIDATION.RATING_MIN,
      max: SERVICE_CONSTANTS.VALIDATION.RATING_MAX,
      default: SERVICE_CONSTANTS.DEFAULT_VALUES.RATING_AVERAGE,
    },
    ratingCount: {
      type: Number,
      min: 0,
      default: SERVICE_CONSTANTS.DEFAULT_VALUES.RATING_COUNT,
    },
    totalBookings: {
      type: Number,
      min: 0,
      default: SERVICE_CONSTANTS.DEFAULT_VALUES.TOTAL_BOOKINGS,
    },
    favoritesCount: {
      type: Number,
      min: 0,
      default: SERVICE_CONSTANTS.DEFAULT_VALUES.FAVORITES_COUNT,
    },
    viewsCount: {
      type: Number,
      min: 0,
      default: SERVICE_CONSTANTS.DEFAULT_VALUES.VIEWS_COUNT,
    },
    serviceType: {
      type: String,
      enum: Object.values(SERVICE_TYPE),
      required: true,
    },
    isActive: {
      type: Boolean,
      default: SERVICE_CONSTANTS.DEFAULT_VALUES.IS_ACTIVE,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

// Indexes for better query performance
serviceSchema.index({ providerId: 1 })
serviceSchema.index({ category: 1 })
serviceSchema.index({ subCategory: 1 })
serviceSchema.index({ tags: 1 })
serviceSchema.index({ 'location.type': 1 })
serviceSchema.index({ 'location.city': 1, 'location.country': 1 })
serviceSchema.index({ status: 1 })
serviceSchema.index({ isActive: 1 })
serviceSchema.index({ ratingAverage: -1 })
serviceSchema.index({ totalBookings: -1 })
serviceSchema.index({ price: 1 })
serviceSchema.index({ title: 'text', description: 'text', tags: 'text' })

// Virtual for provider information
serviceSchema.virtual('provider', {
  ref: 'User',
  localField: 'providerId',
  foreignField: '_id',
  justOne: true,
})

export const Service = model<IService, ServiceModel>('Service', serviceSchema)