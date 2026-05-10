"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HomeController = void 0;
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const home_service_1 = require("./home.service");
const getHomeData = (0, catchAsync_1.default)(async (req, res) => {
    const user = req.user;
    const userId = user === null || user === void 0 ? void 0 : user.userId;
    const result = await home_service_1.HomeServices.getHomeData(userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Home data retrieved successfully',
        data: result,
    });
});
exports.HomeController = {
    getHomeData
};
