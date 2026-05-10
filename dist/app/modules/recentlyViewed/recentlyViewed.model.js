"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecentlyViewed = void 0;
const mongoose_1 = require("mongoose");
const recentlyViewedSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    serviceId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Service',
        required: true,
    },
    viewedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
recentlyViewedSchema.index({ userId: 1, serviceId: 1 }, { unique: true });
recentlyViewedSchema.index({ userId: 1, viewedAt: -1 });
exports.RecentlyViewed = (0, mongoose_1.model)('RecentlyViewed', recentlyViewedSchema);
