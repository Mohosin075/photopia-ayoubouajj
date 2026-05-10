"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecentlyViewedController = void 0;
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const recentlyViewed_service_1 = require("./recentlyViewed.service");
const recordView = (0, catchAsync_1.default)(async (req, res) => {
    const { userId } = req.user;
    const { serviceId } = req.body;
    const result = await recentlyViewed_service_1.RecentlyViewedServices.recordView(userId, serviceId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.CREATED,
        success: true,
        message: 'View recorded successfully',
        data: result,
    });
});
const getRecentlyViewed = (0, catchAsync_1.default)(async (req, res) => {
    const { userId } = req.user;
    const result = await recentlyViewed_service_1.RecentlyViewedServices.getRecentlyViewed(userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Recently viewed services retrieved successfully',
        data: result,
    });
});
exports.RecentlyViewedController = {
    recordView,
    getRecentlyViewed,
};
