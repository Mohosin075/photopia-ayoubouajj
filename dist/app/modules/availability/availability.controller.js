"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvailabilityController = void 0;
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const availability_service_1 = require("./availability.service");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const createOrUpdateAvailability = (0, catchAsync_1.default)(async (req, res) => {
    const user = req.user;
    if (!user)
        throw new ApiError_1.default(http_status_codes_1.default.UNAUTHORIZED, 'User not found');
    const result = await availability_service_1.AvailabilityService.createOrUpdateAvailability(user.userId, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: 'Availability updated successfully',
        data: result,
    });
});
const getMyAvailability = (0, catchAsync_1.default)(async (req, res) => {
    const user = req.user;
    if (!user)
        throw new ApiError_1.default(http_status_codes_1.default.UNAUTHORIZED, 'User not found');
    const result = await availability_service_1.AvailabilityService.getProviderAvailability(user.userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: 'Availability retrieved successfully',
        data: result,
    });
});
const getProviderAvailability = (0, catchAsync_1.default)(async (req, res) => {
    const { providerId } = req.params;
    const result = await availability_service_1.AvailabilityService.getProviderAvailability(providerId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: 'Provider availability retrieved successfully',
        data: result,
    });
});
const checkDateAvailability = (0, catchAsync_1.default)(async (req, res) => {
    const { providerId } = req.params;
    const { date } = req.query;
    if (!date || typeof date !== 'string') {
        throw new ApiError_1.default(http_status_codes_1.default.BAD_REQUEST, 'Date query parameter is required');
    }
    const result = await availability_service_1.AvailabilityService.checkAvailabilityForDate(providerId, new Date(date));
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: 'Date availability checked successfully',
        data: result,
    });
});
const getTimeSlots = (0, catchAsync_1.default)(async (req, res) => {
    const { providerId } = req.params;
    const { date, duration } = req.query;
    if (!date || typeof date !== 'string') {
        throw new ApiError_1.default(http_status_codes_1.default.BAD_REQUEST, 'Date query parameter is required');
    }
    if (!duration || typeof duration !== 'string') {
        throw new ApiError_1.default(http_status_codes_1.default.BAD_REQUEST, 'Duration query parameter is required');
    }
    const serviceDuration = parseInt(duration, 10);
    if (isNaN(serviceDuration) || serviceDuration <= 0) {
        throw new ApiError_1.default(http_status_codes_1.default.BAD_REQUEST, 'Duration must be a positive number');
    }
    const result = await availability_service_1.AvailabilityService.getAvailableTimeSlots(providerId, new Date(date), serviceDuration);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: 'Available time slots retrieved successfully',
        data: { slots: result },
    });
});
const getMonthCalendar = (0, catchAsync_1.default)(async (req, res) => {
    const { providerId } = req.params;
    const { month, year } = req.query;
    if (!month || typeof month !== 'string') {
        throw new ApiError_1.default(http_status_codes_1.default.BAD_REQUEST, 'Month query parameter is required');
    }
    if (!year || typeof year !== 'string') {
        throw new ApiError_1.default(http_status_codes_1.default.BAD_REQUEST, 'Year query parameter is required');
    }
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);
    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        throw new ApiError_1.default(http_status_codes_1.default.BAD_REQUEST, 'Month must be between 1 and 12');
    }
    if (isNaN(yearNum) || yearNum < 2020 || yearNum > 2100) {
        throw new ApiError_1.default(http_status_codes_1.default.BAD_REQUEST, 'Year must be between 2020 and 2100');
    }
    const result = await availability_service_1.AvailabilityService.getMonthCalendar(providerId, monthNum, yearNum);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: 'Month calendar retrieved successfully',
        data: { calendar: result },
    });
});
exports.AvailabilityController = {
    createOrUpdateAvailability,
    getMyAvailability,
    getProviderAvailability,
    checkDateAvailability,
    getTimeSlots,
    getMonthCalendar,
};
