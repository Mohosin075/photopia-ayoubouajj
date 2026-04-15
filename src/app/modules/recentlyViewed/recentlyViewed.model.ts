import { Schema, model } from 'mongoose'
import { IRecentlyViewed, RecentlyViewedModel } from './recentlyViewed.interface'

const recentlyViewedSchema = new Schema<IRecentlyViewed, RecentlyViewedModel>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        serviceId: {
            type: Schema.Types.ObjectId,
            ref: 'Service',
            required: true,
        },
        viewedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    },
)

recentlyViewedSchema.index({ userId: 1, serviceId: 1 }, { unique: true })
recentlyViewedSchema.index({ userId: 1, viewedAt: -1 })

export const RecentlyViewed = model<IRecentlyViewed, RecentlyViewedModel>(
    'RecentlyViewed',
    recentlyViewedSchema,
)
