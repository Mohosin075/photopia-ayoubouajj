import { Model, Types } from 'mongoose'

export interface ICategoryFilterables {
    searchTerm?: string
    name?: string
    isActive?: boolean
}

export interface ICategory {
    _id: Types.ObjectId
    name: string
    description?: string
    icon?: string
    isActive: boolean
    createdAt: Date
    updatedAt: Date
}

export type CategoryModel = Model<ICategory, {}, {}>
