"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Promotion = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// Zod schema for validation
// Mongoose schema
const PromotionSchema = new mongoose_1.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true,
        index: true,
    },
    description: {
        type: String,
        trim: true,
    },
    discountType: {
        type: String,
        enum: ['percentage', 'fixed'],
        required: true,
    },
    discountValue: {
        type: Number,
        required: true,
        min: 0,
    },
    validUntil: {
        type: Date,
        required: true,
    },
    usageLimit: {
        type: Number,
        min: 0,
    },
    usedCount: {
        type: Number,
        default: 0,
        min: 0,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    isSingleUse: {
        type: Boolean,
        default: false,
    },
    usedBy: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User',
        },
    ],
    createdBy: {
        type: String,
        required: true,
        ref: 'User',
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
// Indexes for better query performance
PromotionSchema.index({ code: 1, isActive: 1 });
PromotionSchema.index({ validUntil: 1 });
PromotionSchema.index({ isActive: 1, validUntil: 1 });
PromotionSchema.index({ usedBy: 1 });
// Virtual methods
PromotionSchema.methods.isValid = function () {
    const now = new Date();
    const valid = this.isActive && now <= this.validUntil && !this.isExhausted();
    return valid;
};
PromotionSchema.methods.isExhausted = function () {
    return this.usageLimit ? this.usedCount >= this.usageLimit : false;
};
PromotionSchema.methods.canUse = function (userId) {
    if (this.isSingleUse) {
        const userIdObject = new mongoose_1.Types.ObjectId(userId);
        return !this.usedBy.some((usedById) => usedById.equals(userIdObject));
    }
    return this.isValid();
};
// Static methods
PromotionSchema.statics.findByCode = function (code) {
    return this.findOne({ code: code.toUpperCase().trim() });
};
PromotionSchema.statics.findActivePromotions = function () {
    const now = new Date();
    return this.find({
        isActive: true,
        validUntil: { $gte: now },
    });
};
PromotionSchema.statics.findPromotionsByUser = function (userId) {
    return this.find({
        $or: [{ createdBy: userId }, { usedBy: new mongoose_1.Types.ObjectId(userId) }],
    });
};
// Pre-save middleware to validate discount value
PromotionSchema.pre('save', function (next) {
    if (this.discountType === 'percentage' && this.discountValue > 100) {
        next(new Error('Percentage discount cannot exceed 100%'));
    }
    next();
});
// Method to mark promotion as used by a user
PromotionSchema.methods.markAsUsed = function (userId) {
    const userIdObject = new mongoose_1.Types.ObjectId(userId);
    if (!this.usedBy.some((usedById) => usedById.equals(userIdObject))) {
        this.usedBy.push(userIdObject);
        this.usedCount += 1;
    }
    return this.save();
};
// Export the model with proper typing
exports.Promotion = mongoose_1.default.model('Promotion', PromotionSchema);
