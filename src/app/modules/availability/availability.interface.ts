import { Document, Model, Types } from 'mongoose'

export interface IAvailability extends Document {
  providerId: Types.ObjectId
  serviceId?: Types.ObjectId
  defaultSchedule: {
    [day: string]: {
      start: string
      end: string
      isActive: boolean
      maxBookings?: number
    }
  }
  customDates: Array<{
    date: Date
    type: 'blocked' | 'special_hours' | 'unavailable'
    start?: string
    end?: string
    maxBookings?: number
    note?: string
    rateMultiplier?: number
  }>
  recurringRules: Array<{
    type: 'block_weekly' | 'block_monthly' | 'special_hours_weekly'
    dayOfWeek?: number
    weekOfMonth?: number
    start?: string
    end?: string
    maxBookings?: number
    active: boolean
  }>
  bufferMinutes: number
  advanceNoticeHours: number
  maxBookingsPerDay: number
  maxBookingsPerWeek: number
  autoBlockAfterBooking: boolean
  autoBlockDuration: number
  googleCalendarSync?: {
    calendarId?: string
    lastSynced?: Date
    syncEnabled: boolean
  }
  updatedAt: Date
  createdAt: Date
}

export type AvailabilityModel = Model<IAvailability>
