import { Model, Types } from 'mongoose'
import { SERVICE_TYPE } from '../../../enum/user'

export interface ICategoryFilterables {
    searchTerm?: string
    name?: string
    theme?: string
    parent?: string
    type?: string
    isActive?: boolean
}

export interface ICategory {
    _id: Types.ObjectId
    name: string
    description?: string
    image?: string
    theme?: string
    parent?: Types.ObjectId | ICategory
    type?: 'category' | 'subcategory'
    isActive: boolean
    createdAt: Date
    updatedAt: Date
}

export type CategoryModel = Model<ICategory, {}, {}>
