import { Model, Types } from 'mongoose'
import { SERVICE_TYPE } from '../../../enum/user'

export interface ICategoryFilterables {
    searchTerm?: string
    name?: string
    serviceType?: SERVICE_TYPE
    isActive?: boolean
}

export interface ICategory {
    _id: Types.ObjectId
    name: string
    description?: string
    image?: string
    serviceType: SERVICE_TYPE
    isActive: boolean
    createdAt: Date
    updatedAt: Date
}

export type CategoryModel = Model<ICategory, {}, {}>
