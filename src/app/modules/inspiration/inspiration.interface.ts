import { Model, Types } from 'mongoose'

export interface IInspirationFilterables {
    searchTerm?: string
}

export interface IInspiration {
    _id: Types.ObjectId
    title: string
    description: string
    link: string
    icon: string
    createdAt: Date
    updatedAt: Date
}

export type InspirationModel = Model<IInspiration, {}, {}>
