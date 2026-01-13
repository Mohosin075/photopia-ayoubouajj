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
    image?: string
    tags?: string[]
    isActive: boolean
    createdAt: Date
    updatedAt: Date
}

export type CategoryModel = Model<ICategory, {}, {}>
