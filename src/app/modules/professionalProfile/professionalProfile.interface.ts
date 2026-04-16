import { Schema, Types } from 'mongoose'

export interface IProfessionalProfile {
    user: Types.ObjectId
    bio?: string
    coverPhoto?: string
    specialties?: string[]
    experience?: string
    portfolio?: string[]
    documents?: string[]
    language?: string[]
    socialLinks?: {
        instagram?: string
        twitter?: string
        linkedin?: string
    }
    isVerified: boolean
    rating: number
    reviewCount: number
    profileViews: number
    projects: number
    responseRate: number
    responseTime: number // in minutes
    deliveryRate: number // in percentage
    satisfactionRate: number // in percentage
    isSuperPro: boolean
    stripeAccountId?: string
    stripeOnboardingComplete?: boolean
}
