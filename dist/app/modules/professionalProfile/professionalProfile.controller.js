"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfessionalProfileController = void 0;
const http_status_codes_1 = require("http-status-codes");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const professionalProfile_service_1 = require("./professionalProfile.service");
const createProfile = (0, catchAsync_1.default)(async (req, res) => {
    const { userId } = req.user;
    const result = await professionalProfile_service_1.ProfessionalProfileServices.createProfile(userId, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.CREATED,
        success: true,
        message: 'Professional profile created successfully',
        data: result,
    });
});
const getProfile = (0, catchAsync_1.default)(async (req, res) => {
    const { userId } = req.user;
    const result = await professionalProfile_service_1.ProfessionalProfileServices.getProfile(userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Professional profile retrieved successfully',
        data: result,
    });
});
const updateProfile = (0, catchAsync_1.default)(async (req, res) => {
    const { userId } = req.user;
    const result = await professionalProfile_service_1.ProfessionalProfileServices.updateProfile(userId, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Professional profile updated successfully',
        data: result,
    });
});
const removeItem = (0, catchAsync_1.default)(async (req, res) => {
    const { userId } = req.user;
    const result = await professionalProfile_service_1.ProfessionalProfileServices.removeItem(userId, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Item removed successfully',
        data: result,
    });
});
const stripeConnectOnboarding = (0, catchAsync_1.default)(async (req, res) => {
    const { userId } = req.user;
    const result = await professionalProfile_service_1.ProfessionalProfileServices.stripeConnectOnboarding(userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Stripe onboarding URL generated successfully',
        data: result,
    });
});
const checkStripeAccountStatus = (0, catchAsync_1.default)(async (req, res) => {
    const { userId } = req.user;
    const result = await professionalProfile_service_1.ProfessionalProfileServices.checkStripeAccountStatus(userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Stripe account status retrieved successfully',
        data: result,
    });
});
const getDetailedStatistics = (0, catchAsync_1.default)(async (req, res) => {
    const { userId } = req.user;
    const result = await professionalProfile_service_1.ProfessionalProfileServices.getDetailedStatistics(userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Detailed statistics retrieved successfully',
        data: result,
    });
});
const exportStatisticsReport = (0, catchAsync_1.default)(async (req, res) => {
    const { userId } = req.user;
    const result = await professionalProfile_service_1.ProfessionalProfileServices.exportStatisticsReport(userId);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=' + 'statistics-report.xlsx');
    res.send(result);
});
exports.ProfessionalProfileController = {
    createProfile,
    getProfile,
    updateProfile,
    removeItem,
    stripeConnectOnboarding,
    checkStripeAccountStatus,
    getDetailedStatistics,
    exportStatisticsReport,
};
