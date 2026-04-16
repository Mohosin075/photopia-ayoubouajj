import { Model, Types } from 'mongoose'
import { SERVICE_TYPE } from '../../../enum/user'
import {
  SERVICE_LOCATION_TYPE,
  SERVICE_PRICING_TYPE,
  SERVICE_STATUS,
} from '../../../enum/service'

export interface ILocation {
  type: SERVICE_LOCATION_TYPE
  country: string
  city: string
  address?: string
  coordinates?: {
    lat: number
    lng: number
  }
  serviceRadiusKm?: number
}

export interface IServiceFilterables {
  searchTerm?: string
  title?: string
  category?: string
  subCategory?: string
  tags?: string[]
  equipment?: string[]
  pricingType?: SERVICE_PRICING_TYPE | string
  minPrice?: number
  maxPrice?: number
  'location.type'?: SERVICE_LOCATION_TYPE | string
  'location.country'?: string
  'location.city'?: string
  status?: SERVICE_STATUS
  isVerified?: boolean | string
  providerId?: string
  serviceType?: SERVICE_TYPE | string
  isActive?: boolean | string
  theme?: string
  isOnline?: boolean | string
  quickResponse?: boolean | string
  expressDelivery?: boolean | string
  thisWeekend?: boolean | string
  lastMinute?: boolean | string
  isOriginal?: boolean | string
}

export interface IService {
  _id: Types.ObjectId
  providerId: Types.ObjectId
  title: string
  description: string
  category: Types.ObjectId
  serviceType: SERVICE_TYPE
  subCategory?: Types.ObjectId
  tags?: string[]
  equipment?: string[]
  price: number
  currency: string
  pricingType: SERVICE_PRICING_TYPE
  // Extended pricing fields
  pricingModel?: {
    type: SERVICE_PRICING_TYPE
    weekdayHourlyRate?: number
    weekendHourlyRate?: number
    dailyRate?: number
    dailyHours?: number
    packages?: Array<{
      name: string
      price: number
      duration: number
      description?: string
      includes?: string[]
    }>
  }
  pricingRules?: Array<{
    ruleType: string
    condition: {
      startHour?: number
      endHour?: number
      daysOfWeek?: number[]
      specificDates?: Date[]
      startDate?: Date
      endDate?: Date
      minDuration?: number
      maxDuration?: number
    }
    modifierType: string
    modifierValue: number
    priority: number
  }>
  travelFeePerKm?: number
  allowOutsideRadius?: boolean
  maxTravelFee?: number
  depositPercentage?: number
  cancellationPolicy?: {
    freeCancellationHours: number
    partialRefundHours: number
    noRefundHours: number
  }
  duration: string
  location: ILocation
  coverMedia?: string
  gallery?: string[]
  status: SERVICE_STATUS
  isVerified: boolean
  isActive: boolean
  isOriginal: boolean
  createdAt: Date
  updatedAt: Date
}

export type ServiceModel = Model<IService, {}, {}>