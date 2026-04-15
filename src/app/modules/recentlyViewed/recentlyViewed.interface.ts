import { Model, Types } from 'mongoose'
import { IService } from '../service/service.interface'
import { IUser } from '../user/user.interface'

export interface IRecentlyViewed {
    _id: Types.ObjectId
    userId: Types.ObjectId | IUser
    serviceId: Types.ObjectId | IService
    viewedAt: Date
    createdAt: Date
    updatedAt: Date
}

export type RecentlyViewedModel = Model<IRecentlyViewed, {}, {}>
