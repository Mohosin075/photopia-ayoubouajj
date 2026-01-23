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
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
exports.ProfessionalProfile = (0, mongoose_1.model)('ProfessionalProfile', ProfessionalProfileSchema);
