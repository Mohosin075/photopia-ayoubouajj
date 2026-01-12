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
        specialties: { type: [String] },
        experience: { type: String },
        portfolio: { type: [String] },
        socialLinks: {
            instagram: String,
            twitter: String,
            linkedin: String,
        },
        isVerified: { type: Boolean, default: false },
        rating: { type: Number, default: 0 },
        reviewCount: { type: Number, default: 0 },
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
