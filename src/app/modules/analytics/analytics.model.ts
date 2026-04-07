import { Schema, model } from 'mongoose'
import { AnalyticsModel, IAnalytics } from './analytics.interface'

const analyticsSchema = new Schema<IAnalytics, AnalyticsModel>(
  {
    providerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: 'Service',
    },
    visitorId: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['view', 'interaction'],
      required: true,
    },
    interactionType: {
      type: String,
      enum: ['booking_start', 'contact_click', 'share', 'invoice_download', 'profile_view', 'service_view'],
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    duration: {
      type: Number,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

// Indexes for efficient aggregation
analyticsSchema.index({ providerId: 1, timestamp: -1 })
analyticsSchema.index({ serviceId: 1, timestamp: -1 })
analyticsSchema.index({ visitorId: 1, providerId: 1 })
analyticsSchema.index({ type: 1, interactionType: 1 })

export const Analytics = model<IAnalytics, AnalyticsModel>('Analytics', analyticsSchema)
