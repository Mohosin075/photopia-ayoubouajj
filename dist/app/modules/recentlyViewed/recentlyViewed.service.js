"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecentlyViewedServices = void 0;
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const recentlyViewed_model_1 = require("./recentlyViewed.model");
const recordView = async (userId, serviceId) => {
    if (!serviceId) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Service ID is required');
    }
    const result = await recentlyViewed_model_1.RecentlyViewed.findOneAndUpdate({ userId, serviceId }, { viewedAt: new Date() }, { upsert: true, new: true });
    if (!result) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to record view');
    }
    return result;
};
const getRecentlyViewed = async (userId) => {
    const result = await recentlyViewed_model_1.RecentlyViewed.find({ userId })
        .populate({
        path: 'serviceId',
        populate: [
            { path: 'providerId', select: 'name fullName profile' },
            { path: 'category', select: 'name image icon' },
        ],
    })
        .sort({ viewedAt: -1 })
        .limit(10);
    return result;
};
exports.RecentlyViewedServices = {
    recordView,
    getRecentlyViewed,
};
