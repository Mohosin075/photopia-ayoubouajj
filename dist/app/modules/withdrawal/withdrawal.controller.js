"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WithdrawalController = void 0;
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const withdrawal_service_1 = require("./withdrawal.service");
const createWithdrawal = (0, catchAsync_1.default)(async (req, res) => {
    const user = req.user;
    const payload = { ...req.body, userId: user.userId };
    const result = await withdrawal_service_1.WithdrawalService.createWithdrawal(payload);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.default.CREATED,
        success: true,
        message: 'Withdrawal requested successfully',
        data: result,
    });
});
const getMyWithdrawals = (0, catchAsync_1.default)(async (req, res) => {
    const user = req.user;
    const result = await withdrawal_service_1.WithdrawalService.getMyWithdrawals(user.userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: 'Withdrawals retrieved successfully',
        data: result,
    });
});
const getAllWithdrawals = (0, catchAsync_1.default)(async (req, res) => {
    const result = await withdrawal_service_1.WithdrawalService.getAllWithdrawals();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: 'All withdrawals retrieved successfully',
        data: result,
    });
});
const updateWithdrawalStatus = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const { status, transactionId } = req.body;
    const result = await withdrawal_service_1.WithdrawalService.updateWithdrawalStatus(id, status, transactionId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: 'Withdrawal status updated successfully',
        data: result,
    });
});
exports.WithdrawalController = {
    createWithdrawal,
    getMyWithdrawals,
    getAllWithdrawals,
    updateWithdrawalStatus
};
