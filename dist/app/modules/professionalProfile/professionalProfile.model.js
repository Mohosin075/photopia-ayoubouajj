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
    dateOfBirth: {
        type: Date,
        required: true
    },
    primaryDomain: {
        type: [String],
        enum: ['Photography', 'Videography', 'Editing'],
        required: true
    },
    categories: {
        type: [mongoose_1.Schema.Types.ObjectId],
        ref: 'Category'
    },
    areaOfIntervention: {
        mainCity: { type: String },
        department: { type: String },
        radius: { type: String },
        availableForTravel: { type: Boolean, default: false }
    },
    experienceDetails: {
        yearsOfExperience: { type: String },
        projectsCompleted: { type: String },
        education: { type: String }
    },
    notificationPreferences: {
        emailNewRequests: { type: Boolean, default: true, required: true },
        smsUrgentRequests: { type: Boolean, default: true, required: true },
        newsletterPros: { type: Boolean, default: true, required: true },
        customerReviewReminder: { type: Boolean, default: true, required: true }
    },
    legalNotice: {
        acceptedTerms: { type: Boolean, default: false, required: true },
        privacyPolicy: { type: Boolean, default: false, required: true },
        gdprAuthorization: { type: Boolean, default: false, required: true }
    },
    miniBio: { type: String, maxlength: 500 },
    externalPortfolioLink: { type: String },
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
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
exports.ProfessionalProfile = (0, mongoose_1.model)('ProfessionalProfile', ProfessionalProfileSchema);
