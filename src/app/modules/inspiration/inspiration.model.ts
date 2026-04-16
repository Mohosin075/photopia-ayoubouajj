import { Schema, model } from 'mongoose'
import { IInspiration, InspirationModel } from './inspiration.interface'

const inspirationSchema = new Schema<IInspiration, InspirationModel>(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        link: {
            type: String,
            required: true,
            trim: true,
        },
        icon: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    },
)

export const Inspiration = model<IInspiration, InspirationModel>(
    'Inspiration',
    inspirationSchema,
)
