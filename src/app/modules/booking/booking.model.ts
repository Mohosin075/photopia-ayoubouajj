import { Schema, model } from 'mongoose'
import { IBooking, BookingModel } from './booking.interface'

const bookingSchema = new Schema<IBooking, BookingModel>(
  {
    bookingNumber: {
      type: String,
      required: true,
      unique: true,
      default: () => `BK-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    providerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: 'Service',
      required: true
    },
    bookingDate: {
      type: Date,
      required: true
    },
    startTime: {
      type: String,
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    },
    endTime: {
      type: String,
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    },
    durationHours: {
      type: Number,
      required: true,
      min: 0.5
    },
    timezone: {
      type: String,
      default: 'Europe/Paris'
    },
    eventLocation: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      country: { type: String, required: true },
      coordinates: {
        lat: { type: Number, min: -90, max: 90 },
        lng: { type: Number, min: -180, max: 180 }
      },
      distanceFromProviderKm: { type: Number, required: true, min: 0 },
      notes: String
    },
    pricingDetails: {
      pricingType: { type: String, required: true },
      baseRate: { type: Number, required: true, min: 0 },
      isWeekend: { type: Boolean, default: false },
      travelFee: { type: Number, default: 0, min: 0 },
      subtotal: { type: Number, required: true, min: 0 },
      platformCommissionClient: { type: Number, default: 0.10 },
      platformCommissionProvider: { type: Number, default: 0.05 },
      clientTotal: { type: Number, required: true, min: 0 },
      providerEarnings: { type: Number, required: true, min: 0 },
      currency: { type: String, default: 'EUR' }
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'deposit_paid', 'fully_paid', 'refunded', 'cancelled'],
      default: 'pending'
    },
    depositAmount: { type: Number, default: 0, min: 0 },
    depositPercentage: { type: Number, default: 0.5 },
    balanceAmount: { type: Number, default: 0, min: 0 },
    stripePaymentId: String,
    stripeClientSecret: String,
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'],
      default: 'pending'
    },
    cancellationReason: String,
    cancellationFee: { type: Number, default: 0 },
    clientName: { type: String, required: true },
    clientEmail: { type: String, required: true },
    clientPhone: String,
    eventType: String,
    specialRequests: String,
    bookedAt: { type: Date, default: Date.now },
    confirmedAt: Date,
    cancelledAt: Date,
    completedAt: Date,
    review: {
      rating: Number,
      comment: String,
      createdAt: Date
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
)

bookingSchema.index({ clientId: 1, status: 1 })
bookingSchema.index({ providerId: 1, status: 1 })
bookingSchema.index({ bookingDate: 1, status: 1 })
bookingSchema.index({ bookingNumber: 1 }, { unique: true })

export const Booking = model<IBooking, BookingModel>('Booking', bookingSchema)
