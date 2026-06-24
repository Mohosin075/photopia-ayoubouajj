import { Schema, Types } from 'mongoose'

export interface IProfessionalProfile {
  user: Types.ObjectId
  dateOfBirth: Date // Required
  primaryDomain: ('Photography' | 'Videography' | 'Editing')[] // Required
  categories?: Types.ObjectId[] // Optional, ref Category
  areaOfIntervention?: {
    mainCity?: string
    department?: string
    radius?: string
    availableForTravel?: boolean
  }
  experienceDetails?: {
    yearsOfExperience?: string
    projectsCompleted?: string
    education?: string
  }
  notificationPreferences: {
    // Required
    emailNewRequests: boolean
    smsUrgentRequests: boolean
    newsletterPros: boolean
    customerReviewReminder: boolean
  }
  legalNotice: {
    // Required
    acceptedTerms: boolean
    privacyPolicy: boolean
    gdprAuthorization: boolean
  }
  miniBio?: string
  externalPortfolioLink?: string
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
  responseTime: number
  deliveryRate: number
  satisfactionRate: number
  isSuperPro: boolean
  stripeAccountId?: string
  stripeOnboardingComplete?: boolean
}
