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
exports.AvailabilityController = {
    createOrUpdateAvailability,
    getMyAvailability,
    getProviderAvailability,
};
