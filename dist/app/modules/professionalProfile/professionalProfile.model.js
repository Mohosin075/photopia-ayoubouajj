"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfessionalProfile = void 0;
const mongoose_1 = require("mongoose");
const ProfessionalProfileSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    bio: { type: String },
    coverPhoto: { type: String },
    specialties: { type: [String] },
    experience: { type: String },
    portfolio: { type: [String] },
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
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
exports.ProfessionalProfile = (0, mongoose_1.model)('ProfessionalProfile', ProfessionalProfileSchema);
