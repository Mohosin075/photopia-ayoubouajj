import { Schema, model } from 'mongoose'
import { IProfessionalProfile } from './professionalProfile.interface'

const ProfessionalProfileSchema = new Schema<IProfessionalProfile>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
        },
        bio: { type: String },
        coverPhoto: { type: String },
        specialties: { type: [String] },
        experience: { type: String },
        portfolio: { type: [String] },
        documents: { type: [String] },
        language: { type: [String] },
        socialLinks: {
            instagram: String,
            twitter: String,
            linkedin: String,
        },
        isVerified: { type: Boolean, default: false },
        rating: { type: Number, default: 0 },
        reviewCount: { type: Number, default: 0 },
        profileViews: { type: Number, default: 0 },
        projects: { type: Number, default: 0 },
        responseRate: { type: Number, default: 95 },
        stripeAccountId: { type: String, default: null },
        stripeOnboardingComplete: { type: Boolean, default: false },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    },
)

export const ProfessionalProfile = model<IProfessionalProfile>(
    'ProfessionalProfile',
    ProfessionalProfileSchema,
)
