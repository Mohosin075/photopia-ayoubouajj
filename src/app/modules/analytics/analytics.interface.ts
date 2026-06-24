import { Model, Types } from 'mongoose'

export type IInteractionType =
  | 'booking_start'
  | 'contact_click'
  | 'share'
  | 'invoice_download'
  | 'profile_view'
  | 'service_view'

export interface IAnalytics {
  _id: Types.ObjectId
  providerId: Types.ObjectId
  serviceId?: Types.ObjectId
  visitorId: string
  type: 'view' | 'interaction'
  interactionType?: IInteractionType
  timestamp: Date
  duration?: number
}

export type AnalyticsModel = Model<IAnalytics>

export interface IPremiumAnalytics {
  mostViewedProject: {
    serviceId: string
    title: string
    views: number
  } | null
  conversionRate: number
  bounceRate: number
  avgRevenueVsCategory: {
    userAvg: number
    categoryAvg: number
    categoryName: string
  }
  averageOrderValue: number
  repeatRate: number
  avgConversionTime: number // in hours
}
