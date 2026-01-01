import { Model, Types } from 'mongoose'

export interface IActivity {
    action: string
    description?: string
    userId: Types.ObjectId
    role: string
    resourceId: Types.ObjectId
    resourceType: 'Event' | 'User' | 'Review' // extensible
    timestamp: Date
}

export type ActivityModel = Model<IActivity>
