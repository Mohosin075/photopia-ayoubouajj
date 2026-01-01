import { Model } from 'mongoose'
import { Types } from 'mongoose'

// TypeScript interface for document methods
export interface IPromotion extends Document {
  code: string
  description?: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  validUntil: Date
  usageLimit?: number
  usedCount: number
  isActive: boolean
  isSingleUse: boolean
  usedBy: Types.ObjectId[]
  createdBy: string
  createdAt: Date
  updatedAt: Date

  // Virtual methods
  isValid(): boolean
  isExhausted(): boolean
  canUse(userId: string): boolean
  markAsUsed(userId: string): Promise<IPromotion>
}

// TypeScript interface for static methods
export interface IPromotionModel extends Model<IPromotion> {
  findByCode(code: string): Promise<IPromotion | null>
  findActivePromotions(): Promise<IPromotion[]>
  findPromotionsByUser(userId: string): Promise<IPromotion[]>
}
