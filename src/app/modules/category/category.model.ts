import { Schema, model } from 'mongoose'
import { ICategory, CategoryModel } from './category.interface'

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
        icon: {
            type: String,
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

export const Category = model<ICategory, CategoryModel>('Category', categorySchema)
