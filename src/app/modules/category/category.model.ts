import { Schema, model } from 'mongoose'
import { ICategory, CategoryModel } from './category.interface'
import { SERVICE_TYPE } from '../../../enum/user'

const categorySchema = new Schema<ICategory, CategoryModel>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        image: {
            type: String,
        },
        serviceType: {
            type: String,
            enum: Object.values(SERVICE_TYPE),
            required: true,
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
categorySchema.index({ serviceType: 1 })

export const Category = model<ICategory, CategoryModel>('Category', categorySchema)
