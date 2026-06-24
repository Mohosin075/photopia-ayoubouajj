import { Document, Model, Types } from 'mongoose'

export interface IBooking extends Document {
  bookingNumber: string
  clientId: Types.ObjectId
  providerId: Types.ObjectId
  serviceId: Types.ObjectId

  // Booking Details
  bookingDate: Date
  startTime: string
  endTime: string
  durationHours: number
  timezone: string
  packageName?: string
  customOptions?: {
    name: string
    price: number
  }[]

  // Location
  eventLocation: {
    address: string
    city: string
    country: string
    coordinates?: {
      lat: number
      lng: number
    }
    distanceFromProviderKm: number
    notes?: string
  }

  // Pricing & Payment
  pricingDetails: {
    pricingType: string
    baseRate: number
    isWeekend: boolean
    travelFee?: number
    subtotal: number
    platformCommissionClient: number
    platformCommissionProvider: number
    clientTotal: number
    providerEarnings: number
    currency: string
  }

  // Payment Status
  paymentStatus:
    | 'pending'
    | 'deposit_paid'
    | 'fully_paid'
    | 'refunded'
    | 'cancelled'
  depositAmount: number
  depositPercentage: number
  balanceAmount: number
  stripePaymentId?: string
  stripeClientSecret?: string
  stripeTransferId?: string
  stripeTransferStatus?: 'pending' | 'succeeded' | 'failed'

  // Status
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  cancellationReason?: string
  cancellationFee?: number

  // Client Details
  clientName: string
  clientEmail: string
  clientPhone?: string
  eventType?: string
  specialRequests?: string

  // Timestamps
  bookedAt: Date
  confirmedAt?: Date
  cancelledAt?: Date
  completedAt?: Date

  // Reviews
  review?: {
    rating: number
    comment: string
    createdAt: Date
  }
}

export type BookingModel = Model<IBooking>
