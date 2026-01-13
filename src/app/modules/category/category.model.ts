import { Schema, model } from 'mongoose'
import { ICategory, CategoryModel } from './category.interface'
import { CATEGORY_TAG } from '../../../enum/user'

const categorySchema = new Schema<ICategory, CategoryModel>(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        image: {
            type: String,
        },
        tags: {
            type: [String],
            enum: CATEGORY_TAG,
            default: [],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    },
)

categorySchema.index({ name: 1 })
categorySchema.index({ tags: 1 })

export const Category = model<ICategory, CategoryModel>('Category', categorySchema)
