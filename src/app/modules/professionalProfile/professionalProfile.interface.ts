import { Schema, Types } from 'mongoose'

export interface IProfessionalProfile {
    user: Types.ObjectId
    bio?: string
    specialties?: string[]
    experience?: string
    portfolio?: string[]
    language?: string[]
    socialLinks?: {
        instagram?: string
        twitter?: string
        linkedin?: string
    }
    isVerified: boolean
    rating: number
    reviewCount: number
    stripeAccountId?: string
    stripeOnboardingComplete?: boolean
}
