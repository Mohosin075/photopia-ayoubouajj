import { Model, Types } from 'mongoose'
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
  status?: SERVICE_STATUS | string
  isVerified?: boolean | string
  providerId?: string
  serviceType?: string
  isActive?: boolean | string
}

export interface IService {
  _id: Types.ObjectId
  providerId: Types.ObjectId
  title: string
  description: string
  category: Types.ObjectId
  subCategory?: string
  tags?: string[]
  equipment?: string[]
  price: number
  currency: string
  pricingType: SERVICE_PRICING_TYPE
  duration: string
  location: ILocation
  coverMedia?: string
  gallery?: string[]
  status: SERVICE_STATUS
  isVerified: boolean
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export type ServiceModel = Model<IService, {}, {}>