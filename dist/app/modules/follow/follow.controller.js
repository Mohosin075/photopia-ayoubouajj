"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FollowController = void 0;
const follow_service_1 = require("./follow.service");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const pagination_1 = require("../../../interfaces/pagination");
const pick_1 = __importDefault(require("../../../shared/pick"));
const followUser = (0, catchAsync_1.default)(async (req, res) => {
    const { userId } = req.params;
    const result = await follow_service_1.FollowServices.followUser(req.user, userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.CREATED,
        success: true,
        message: 'Follow request sent successfully',
        data: result,
    });
});
const unfollowUser = (0, catchAsync_1.default)(async (req, res) => {
    const { userId } = req.params;
    const result = await follow_service_1.FollowServices.unfollowUser(req.user, userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Unfollowed successfully',
        data: result,
    });
});
const acceptFollowRequest = (0, catchAsync_1.default)(async (req, res) => {
    const { followerId } = req.params;
    const result = await follow_service_1.FollowServices.acceptFollowRequest(req.user, followerId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Follow request accepted',
        data: result,
    });
});
const rejectFollowRequest = (0, catchAsync_1.default)(async (req, res) => {
    const { followerId } = req.params;
    const result = await follow_service_1.FollowServices.rejectFollowRequest(req.user, followerId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Follow request rejected',
        data: result,
    });
});
const blockUser = (0, catchAsync_1.default)(async (req, res) => {
    const { userId } = req.params;
    const result = await follow_service_1.FollowServices.blockUser(req.user, userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'User blocked successfully',
        data: result,
    });
});
const unblockUser = (0, catchAsync_1.default)(async (req, res) => {
    const { userId } = req.params;
    const result = await follow_service_1.FollowServices.unblockUser(req.user, userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'User unblocked successfully',
        data: result,
    });
});
const getFollowers = (0, catchAsync_1.default)(async (req, res) => {
    const { userId } = req.params;
    const type = req.query.type;
    const paginationOptions = (0, pick_1.default)(req.query, pagination_1.paginationFields);
    const result = await follow_service_1.FollowServices.getFollowList(userId, type, paginationOptions);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Followers retrieved successfully',
        data: result,
    });
});
const getFollowStats = (0, catchAsync_1.default)(async (req, res) => {
    const { userId } = req.params;
    const result = await follow_service_1.FollowServices.getFollowStats(userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Follow stats retrieved successfully',
        data: result,
    });
});
const checkFollowStatus = (0, catchAsync_1.default)(async (req, res) => {
    const { userId } = req.params;
    const result = await follow_service_1.FollowServices.checkFollowStatus(req.user, userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Follow status retrieved successfully',
        data: result,
    });
});
const getMutualFollowers = (0, catchAsync_1.default)(async (req, res) => {
    const { userId } = req.params;
    const result = await follow_service_1.FollowServices.getMutualFollowers(req.user, userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Mutual followers retrieved successfully',
        data: result,
    });
});
const getFollowSuggestions = (0, catchAsync_1.default)(async (req, res) => {
    const paginationOptions = (0, pick_1.default)(req.query, pagination_1.paginationFields);
    const result = await follow_service_1.FollowServices.getFollowSuggestions(req.user, paginationOptions);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Follow suggestions retrieved successfully',
        data: result,
    });
});
exports.FollowController = {
    followUser,
    unfollowUser,
    acceptFollowRequest,
    rejectFollowRequest,
    blockUser,
    unblockUser,
    getFollowers,
    getFollowStats,
    checkFollowStatus,
    getMutualFollowers,
    getFollowSuggestions,
};
