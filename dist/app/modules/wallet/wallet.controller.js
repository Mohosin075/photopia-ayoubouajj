"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletController = void 0;
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const wallet_service_1 = require("./wallet.service");
const getMyWallet = (0, catchAsync_1.default)(async (req, res) => {
    const user = req.user;
    const result = await wallet_service_1.WalletService.getWalletByUserId(user.userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: 'Wallet retrieved successfully',
        data: result,
    });
});
exports.WalletController = {
    getMyWallet,
};
