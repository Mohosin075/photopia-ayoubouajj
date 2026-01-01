import mongoose, { Schema, Document, Model, Types } from 'mongoose'
import { z } from 'zod'
import { IPromotion, IPromotionModel } from './promotion.interface'

// Zod schema for validation
// Mongoose schema
const PromotionSchema = new Schema<IPromotion, IPromotionModel>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    validUntil: {
      type: Date,
      required: true,
    },
    usageLimit: {
      type: Number,
      min: 0,
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isSingleUse: {
      type: Boolean,
      default: false,
    },
    usedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    createdBy: {
      type: String,
      required: true,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

// Indexes for better query performance
PromotionSchema.index({ code: 1, isActive: 1 })
PromotionSchema.index({ validUntil: 1 })
PromotionSchema.index({ isActive: 1, validUntil: 1 })
PromotionSchema.index({ usedBy: 1 })

// Virtual methods
PromotionSchema.methods.isValid = function (): boolean {
  const now = new Date()
  const valid = this.isActive && now <= this.validUntil && !this.isExhausted()
  return valid
}

PromotionSchema.methods.isExhausted = function (): boolean {
  return this.usageLimit ? this.usedCount >= this.usageLimit : false
}

PromotionSchema.methods.canUse = function (userId: string): boolean {
  if (this.isSingleUse) {
    const userIdObject = new Types.ObjectId(userId)
    return !this.usedBy.some((usedById: Types.ObjectId) =>
      usedById.equals(userIdObject),
    )
  }
  return this.isValid()
}

// Static methods
PromotionSchema.statics.findByCode = function (code: string) {
  return this.findOne({ code: code.toUpperCase().trim() })
}

PromotionSchema.statics.findActivePromotions = function () {
  const now = new Date()
  return this.find({
    isActive: true,
    validUntil: { $gte: now },
  })
}

PromotionSchema.statics.findPromotionsByUser = function (userId: string) {
  return this.find({
    $or: [{ createdBy: userId }, { usedBy: new Types.ObjectId(userId) }],
  })
}

// Pre-save middleware to validate discount value
PromotionSchema.pre('save', function (next) {
  if (this.discountType === 'percentage' && this.discountValue > 100) {
    next(new Error('Percentage discount cannot exceed 100%'))
  }
  next()
})

// Method to mark promotion as used by a user
PromotionSchema.methods.markAsUsed = function (
  userId: string,
): Promise<IPromotion> {
  const userIdObject = new Types.ObjectId(userId)

  if (
    !this.usedBy.some((usedById: Types.ObjectId) =>
      usedById.equals(userIdObject),
    )
  ) {
    this.usedBy.push(userIdObject)
    this.usedCount += 1
  }

  return this.save()
}

// Export the model with proper typing
export const Promotion: IPromotionModel = mongoose.model<
  IPromotion,
  IPromotionModel
>('Promotion', PromotionSchema)
export type PromotionDocument = mongoose.HydratedDocument<IPromotion>
