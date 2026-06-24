import { Model, Types } from 'mongoose'
import { ICategory } from '../category/category.interface'

export interface IProjectIdeaFilterables {
  searchTerm?: string
}

export interface IProjectIdea {
  _id: Types.ObjectId
  title: string
  linkText: string
  subCategoryId: Types.ObjectId | ICategory
  order: number
  createdAt: Date
  updatedAt: Date
}

export type ProjectIdeaModel = Model<IProjectIdea, {}, {}>
