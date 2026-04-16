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
        responseTime: { type: Number, default: 60 }, // default 60 minutes
        deliveryRate: { type: Number, default: 100 },
        satisfactionRate: { type: Number, default: 100 },
        isSuperPro: { type: Boolean, default: false },
        stripeAccountId: { type: String, default: null },
        stripeOnboardingComplete: { type: Boolean, default: false },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    },
)

ProfessionalProfileSchema.pre('save', function (next) {
    if (
        this.rating >= 4.5 &&
        this.responseRate > 90 &&
        this.responseTime <= 120 && // 2 hours in minutes
        this.deliveryRate >= 95 &&
        this.projects >= 10 &&
        this.satisfactionRate > 98
    ) {
        this.isSuperPro = true
    } else {
        this.isSuperPro = false
    }
    next()
})

export const ProfessionalProfile = model<IProfessionalProfile>(
    'ProfessionalProfile',
    ProfessionalProfileSchema,
)
