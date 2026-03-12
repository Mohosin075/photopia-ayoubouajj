import { z } from 'zod'
import { SERVICE_CONSTANTS } from './service.constants'
import { SERVICE_TYPE } from '../../../enum/user'
import {
  SERVICE_LOCATION_TYPE,
  SERVICE_PRICING_TYPE,
  SERVICE_STATUS,
} from '../../../enum/service'

// Convert enums to arrays for Zod
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

export const createServiceSchema = z.object({
  body: z.object({
    title: z.string()
      .min(SERVICE_CONSTANTS.VALIDATION.TITLE_MIN_LENGTH)
      .max(SERVICE_CONSTANTS.VALIDATION.TITLE_MAX_LENGTH),
    description: z.string()
      .min(SERVICE_CONSTANTS.VALIDATION.DESCRIPTION_MIN_LENGTH)
      .max(SERVICE_CONSTANTS.VALIDATION.DESCRIPTION_MAX_LENGTH),
    category: z.string().min(2).max(50),
    subCategory: z.string().optional(),
    tags: z.array(z.string().min(1).max(30)).optional(),
    equipment: z.array(z.string().min(1).max(50)).optional(),
    price: z.number()
      .min(SERVICE_CONSTANTS.VALIDATION.PRICE_MIN)
      .max(SERVICE_CONSTANTS.VALIDATION.PRICE_MAX),
    currency: z.string().length(3).default('EUR'),
    pricingType: z.enum(pricingTypeValues),
    duration: z.string().min(1).max(100),
    location: locationSchema,
    // coverMedia: z.string().url().optional(),
    gallery: z.array(z.string().url()).optional(),
    status: z.enum(statusValues).default(SERVICE_STATUS.ACTIVE),
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
    subCategory: z.string().optional(),
    tags: z.array(z.string().min(1).max(30)).optional(),
    equipment: z.array(z.string().min(1).max(50)).optional(),
    price: z.number()
      .min(SERVICE_CONSTANTS.VALIDATION.PRICE_MIN)
      .max(SERVICE_CONSTANTS.VALIDATION.PRICE_MAX)
      .optional(),
    currency: z.string().length(3).optional(),
    pricingType: z.enum(pricingTypeValues).optional(),
    duration: z.string().min(1).max(100).optional(),
    location: locationSchema.partial().optional(),
    coverMedia: z.string().url().optional(),
    gallery: z.array(z.string().url()).optional(),
    status: z.enum(statusValues).optional(),
    isVerified: z.boolean().optional(),
    isActive: z.boolean().optional(),
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
    isActive: z.enum(['true', 'false']).optional(),
  }),
})