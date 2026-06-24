"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsController = void 0;
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const analytics_service_1 = require("./analytics.service");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const trackVisit = (0, catchAsync_1.default)(async (req, res) => {
    const visitorId = req.user
        ? req.user.userId
        : req.headers['x-visitor-id'] || req.ip;
    await analytics_service_1.AnalyticsService.trackVisit({
        ...req.body,
        visitorId,
    });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: 'Visit tracked successfully',
        data: null,
    });
});
const getPremiumAnalytics = (0, catchAsync_1.default)(async (req, res) => {
    const user = req.user;
    if (!user) {
        throw new ApiError_1.default(http_status_codes_1.default.UNAUTHORIZED, 'User not found');
    }
    const result = await analytics_service_1.AnalyticsService.getPremiumAnalytics(user.userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: 'Premium analytics retrieved successfully',
        data: result,
    });
});
exports.AnalyticsController = {
    trackVisit,
    getPremiumAnalytics,
};
