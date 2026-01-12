import { Schema, Types } from 'mongoose'

export interface IProfessionalProfile {
    user: Types.ObjectId
    bio?: string
    specialties?: string[]
    experience?: string
    portfolio?: string[]
    socialLinks?: {
        instagram?: string
        twitter?: string
        linkedin?: string
    }
    isVerified: boolean
    rating: number
    reviewCount: number
}
