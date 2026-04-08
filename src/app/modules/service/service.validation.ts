import { z } from 'zod'
import { SERVICE_CONSTANTS } from './service.constants'
import { SERVICE_TYPE } from '../../../enum/user'
import {
  SERVICE_LOCATION_TYPE,
  SERVICE_PRICING_TYPE,
  SERVICE_STATUS,
} from '../../../enum/service'

// Convert enums to arrays for Zod
const serviceTypeValues = Object.values(SERVICE_TYPE) as [string, ...string[]]
const pricingTypeValues = Object.values(SERVICE_PRICING_TYPE) as [string, ...string[]]
const locationTypeValues = Object.values(SERVICE_LOCATION_TYPE) as [string, ...string[]]
const statusValues = Object.values(SERVICE_STATUS) as [string, ...string[]]

const locationSchema = z.object({
  type: z.enum(locationTypeValues),
  country: z.string().min(2).max(100),
  city: z.string().min(2).max(100),
  address: z.string().optional(),
  coordinates: z.object({
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
  }).optional(),
  serviceRadiusKm: z.number()
    .min(SERVICE_CONSTANTS.VALIDATION.SERVICE_RADIUS_MIN)
    .max(SERVICE_CONSTANTS.VALIDATION.SERVICE_RADIUS_MAX)
    .optional(),
})

const pricingModelSchema = z.object({
  type: z.enum(pricingTypeValues),
  weekdayHourlyRate: z.number().min(0).optional(),
  weekendHourlyRate: z.number().min(0).optional(),
  dailyRate: z.number().min(0).optional(),
  dailyHours: z.number().min(1).optional(),
  packages: z.array(z.object({
    name: z.string().min(1),
    price: z.number().min(0),
    duration: z.number().min(1),
    description: z.string().optional(),
    includes: z.array(z.string()).optional(),
  })).optional(),
})

export const createServiceSchema = z.object({
  body: z.object({
    title: z.string()
      .min(SERVICE_CONSTANTS.VALIDATION.TITLE_MIN_LENGTH)
      .max(SERVICE_CONSTANTS.VALIDATION.TITLE_MAX_LENGTH),
    description: z.string()
      .min(SERVICE_CONSTANTS.VALIDATION.DESCRIPTION_MIN_LENGTH)
      .max(SERVICE_CONSTANTS.VALIDATION.DESCRIPTION_MAX_LENGTH),
    category: z.string().min(2).max(50),
    serviceType: z.enum(serviceTypeValues, {
      required_error: 'Service type is required',
    }),
    subCategory: z.string().optional(),
    tags: z.array(z.string().min(1).max(30)).optional(),
    equipment: z.array(z.string().min(1).max(50)).optional(),
    price: z.number()
      .min(SERVICE_CONSTANTS.VALIDATION.PRICE_MIN)
      .max(SERVICE_CONSTANTS.VALIDATION.PRICE_MAX),
    currency: z.string().length(3).default('EUR'),
    pricingType: z.enum(pricingTypeValues),
    pricingModel: pricingModelSchema.optional(),
    duration: z.string().min(1).max(100),
    location: locationSchema,
    // coverMedia: z.string().url().optional(),
    gallery: z.array(z.string().url()).optional(),
    status: z.enum(statusValues).default(SERVICE_STATUS.ACTIVE),
  }).superRefine((data, ctx) => {
    if (data.pricingType === SERVICE_PRICING_TYPE.DAILY) {
      if (!data.pricingModel?.dailyRate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Daily rate is required for DAILY pricing type',
          path: ['pricingModel', 'dailyRate'],
        })
      }
    }
    
    if (data.pricingType === SERVICE_PRICING_TYPE.PACKAGE) {
      if (!data.pricingModel?.packages || data.pricingModel.packages.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'At least one package is required for PACKAGE pricing type',
          path: ['pricingModel', 'packages'],
        })
      }
    }
  }),
})

export const updateServiceSchema = z.object({
  body: z.object({
    title: z.string()
      .min(SERVICE_CONSTANTS.VALIDATION.TITLE_MIN_LENGTH)
      .max(SERVICE_CONSTANTS.VALIDATION.TITLE_MAX_LENGTH)
      .optional(),
    description: z.string()
      .min(SERVICE_CONSTANTS.VALIDATION.DESCRIPTION_MIN_LENGTH)
      .max(SERVICE_CONSTANTS.VALIDATION.DESCRIPTION_MAX_LENGTH)
      .optional(),
    category: z.string().min(2).max(50).optional(),
    serviceType: z.enum(serviceTypeValues).optional(),
    subCategory: z.string().optional(),
    tags: z.array(z.string().min(1).max(30)).optional(),
    equipment: z.array(z.string().min(1).max(50)).optional(),
    price: z.number()
      .min(SERVICE_CONSTANTS.VALIDATION.PRICE_MIN)
      .max(SERVICE_CONSTANTS.VALIDATION.PRICE_MAX)
      .optional(),
    currency: z.string().length(3).optional(),
    pricingType: z.enum(pricingTypeValues).optional(),
    pricingModel: pricingModelSchema.partial().optional(),
    duration: z.string().min(1).max(100).optional(),
    location: locationSchema.partial().optional(),
    coverMedia: z.string().url().optional(),
    gallery: z.array(z.string().url()).optional(),
    status: z.enum(statusValues).optional(),
    isVerified: z.boolean().optional(),
    isActive: z.boolean().optional(),
  }).superRefine((data, ctx) => {
    if (data.pricingType === SERVICE_PRICING_TYPE.DAILY) {
      if (data.pricingModel && !data.pricingModel.dailyRate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Daily rate is required when changing to DAILY pricing type',
          path: ['pricingModel', 'dailyRate'],
        })
      }
    }
    
    if (data.pricingType === SERVICE_PRICING_TYPE.PACKAGE) {
      if (data.pricingModel && (!data.pricingModel.packages || data.pricingModel.packages.length === 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'At least one package is required when changing to PACKAGE pricing type',
          path: ['pricingModel', 'packages'],
        })
      }
    }
  }),
})

export const toggleServiceStatusSchema = z.object({
  body: z.object({
    status: z.enum(statusValues),
  }),
})

export const filterServiceSchema = z.object({
  query: z.object({
    searchTerm: z.string().optional(),
    category: z.string().optional(),
    subCategory: z.string().optional(),
    tags: z.string().optional(),
    pricingType: z.enum(pricingTypeValues).optional(),
    minPrice: z.string().optional(),
    maxPrice: z.string().optional(),
    'location.type': z.enum(locationTypeValues).optional(),
    'location.country': z.string().optional(),
    'location.city': z.string().optional(),
    status: z.enum(statusValues).optional(),
    isVerified: z.enum(['true', 'false']).optional(),
    providerId: z.string().optional(),
    serviceType: z.enum(serviceTypeValues).optional(),
    isActive: z.enum(['true', 'false']).optional(),
  }),
})