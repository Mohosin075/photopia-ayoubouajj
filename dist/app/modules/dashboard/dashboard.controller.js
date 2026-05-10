"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const http_status_codes_1 = require("http-status-codes");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const dashboard_service_1 = require("./dashboard.service");
const getUserManagementStats = (0, catchAsync_1.default)(async (req, res) => {
    const { country, city } = req.query;
    const result = await dashboard_service_1.DashboardService.getUserManagementStats(country, city);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'User management stats retrieved successfully',
        data: result,
    });
});
const getUserDetailsStats = (0, catchAsync_1.default)(async (req, res) => {
    const { userId } = req.params;
    const result = await dashboard_service_1.DashboardService.getUserDetailsStats(userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'User details stats retrieved successfully',
        data: result,
    });
});
const warnUser = (0, catchAsync_1.default)(async (req, res) => {
    const { userId, message } = req.body;
    const result = await dashboard_service_1.DashboardService.warnUser(userId, message);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Warning sent successfully',
        data: result,
    });
});
const getContentModerationStats = (0, catchAsync_1.default)(async (req, res) => {
    const result = await dashboard_service_1.DashboardService.getContentModerationStats();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Content moderation stats retrieved successfully',
        data: result,
    });
});
const getModerationReports = (0, catchAsync_1.default)(async (req, res) => {
    const result = await dashboard_service_1.DashboardService.getModerationReports();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Moderation reports retrieved successfully',
        data: result,
    });
});
const getModerationReportDetails = (0, catchAsync_1.default)(async (req, res) => {
    const { reportId } = req.params;
    const result = await dashboard_service_1.DashboardService.getModerationReportDetails(reportId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Moderation report details retrieved successfully',
        data: result,
    });
});
const handleModerationAction = (0, catchAsync_1.default)(async (req, res) => {
    const { reportId } = req.params;
    const { action, details } = req.body;
    const admin = req.user;
    const result = await dashboard_service_1.DashboardService.handleModerationAction(reportId, admin.userId, action, details || '');
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Moderation action performed successfully',
        data: result,
    });
});
const getPaymentAndCommissionStats = (0, catchAsync_1.default)(async (req, res) => {
    const { country, city } = req.query;
    const result = await dashboard_service_1.DashboardService.getPaymentAndCommissionStats(country, city);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Payment and commission stats retrieved successfully',
        data: result,
    });
});
const getRecentTransactions = (0, catchAsync_1.default)(async (req, res) => {
    const result = await dashboard_service_1.DashboardService.getRecentTransactions();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Recent transactions retrieved successfully',
        data: result,
    });
});
const getTransactionDetails = (0, catchAsync_1.default)(async (req, res) => {
    const { transactionId } = req.params;
    const result = await dashboard_service_1.DashboardService.getTransactionDetails(transactionId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Transaction details retrieved successfully',
        data: result,
    });
});
const getSubscriptionManagementStats = (0, catchAsync_1.default)(async (req, res) => {
    const result = await dashboard_service_1.DashboardService.getSubscriptionManagementStats();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Subscription management stats retrieved successfully',
        data: result,
    });
});
const getSubscriberList = (0, catchAsync_1.default)(async (req, res) => {
    const result = await dashboard_service_1.DashboardService.getSubscriberList();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Subscriber list retrieved successfully',
        data: result,
    });
});
const getAdvancedAnalyticsStats = (0, catchAsync_1.default)(async (req, res) => {
    const result = await dashboard_service_1.DashboardService.getAdvancedAnalyticsStats();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Advanced analytics stats retrieved successfully',
        data: result,
    });
});
const toggleUserStatus = (0, catchAsync_1.default)(async (req, res) => {
    const { userId } = req.params;
    const result = await dashboard_service_1.DashboardService.toggleUserStatus(userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'User status updated successfully',
        data: result,
    });
});
const exportUsers = (0, catchAsync_1.default)(async (req, res) => {
    const result = await dashboard_service_1.DashboardService.exportUsers();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=' + 'users.xlsx');
    res.send(result);
});
const exportPayments = (0, catchAsync_1.default)(async (req, res) => {
    const result = await dashboard_service_1.DashboardService.exportPayments();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=' + 'payments.xlsx');
    res.send(result);
});
const getLocationList = (0, catchAsync_1.default)(async (req, res) => {
    const result = await dashboard_service_1.DashboardService.getLocationList();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Location list retrieved successfully',
        data: result,
    });
});
const getDetailedStats = (0, catchAsync_1.default)(async (req, res) => {
    const { country, city } = req.query;
    const result = await dashboard_service_1.DashboardService.getDetailedStats(country, city);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Detailed dashboard stats retrieved successfully',
        data: result,
    });
});
const getCategoryStats = (0, catchAsync_1.default)(async (req, res) => {
    const result = await dashboard_service_1.DashboardService.getCategoryStats();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Category stats retrieved successfully',
        data: result,
    });
});
exports.DashboardController = {
    getUserManagementStats,
    getUserDetailsStats,
    warnUser,
    getContentModerationStats,
    getModerationReports,
    getModerationReportDetails,
    handleModerationAction,
    getPaymentAndCommissionStats,
    getRecentTransactions,
    getTransactionDetails,
    getSubscriptionManagementStats,
    getSubscriberList,
    getAdvancedAnalyticsStats,
    toggleUserStatus,
    exportUsers,
    exportPayments,
    getLocationList,
    getDetailedStats,
    getCategoryStats,
};
