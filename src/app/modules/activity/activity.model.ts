import { Schema, model } from 'mongoose'
import { IActivity, ActivityModel } from './activity.interface'

const activitySchema = new Schema<IActivity, ActivityModel>(
    {
        action: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        role: {
            type: String,
            required: true,
        },
        resourceId: {
            type: Schema.Types.ObjectId,
            required: true,
            refPath: 'resourceType', // Dynamic reference based on resourceType
        },
        resourceType: {
            type: String,
            required: true,
            enum: ['Event', 'User', 'Review'],
        },
        timestamp: {
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

// Index for efficient fetching of recent activities
activitySchema.index({ timestamp: -1 })
activitySchema.index({ userId: 1 })
activitySchema.index({ resourceId: 1 })

export const Activity = model<IActivity, ActivityModel>(
    'Activity',
    activitySchema,
)
