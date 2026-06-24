import { Schema, model } from 'mongoose'
import { IProjectIdea, ProjectIdeaModel } from './projectIdea.interface'

const projectIdeaSchema = new Schema<IProjectIdea, ProjectIdeaModel>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    linkText: {
      type: String,
      required: true,
      trim: true,
    },
    subCategoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    order: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

projectIdeaSchema.index({ order: 1 })
projectIdeaSchema.index({ subCategoryId: 1 })

export const ProjectIdea = model<IProjectIdea, ProjectIdeaModel>(
  'ProjectIdea',
  projectIdeaSchema,
)
