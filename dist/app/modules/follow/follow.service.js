"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FollowServices = void 0;
const http_status_codes_1 = require("http-status-codes");
const mongoose_1 = __importStar(require("mongoose"));
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const paginationHelper_1 = require("../../../helpers/paginationHelper");
const user_model_1 = require("../user/user.model");
const follow_interface_1 = require("./follow.interface");
const follow_model_1 = require("./follow.model");
exports.FollowServices = {
    // Follow a user
    // Follow a user
    async followUser(user, targetUserId) {
        const followerId = new mongoose_1.Types.ObjectId(user.userId);
        const followingId = new mongoose_1.Types.ObjectId(targetUserId);
        // Check if trying to follow self
        if (followerId.equals(followingId)) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Cannot follow yourself');
        }
        // Check if users exist
        const [follower, following] = await Promise.all([
            user_model_1.User.findById(followerId),
            user_model_1.User.findById(followingId),
        ]);
        if (!follower || !following) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found');
        }
        // Check if already following
        const existingFollow = await follow_model_1.Follow.findOne({
            follower: followerId,
            following: followingId,
        });
        if (existingFollow) {
            if (existingFollow.status === follow_interface_1.FollowStatus.REJECTED) {
                existingFollow.status = follow_interface_1.FollowStatus.ACCEPTED;
                await existingFollow.save();
                return existingFollow;
            }
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Already following this user');
        }
        // Check if blocked
        const isBlocked = await follow_model_1.Follow.findOne({
            follower: followingId,
            following: followerId,
            status: follow_interface_1.FollowStatus.BLOCKED,
        });
        if (isBlocked) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'Cannot follow this user');
        }
        const session = await mongoose_1.default.startSession();
        try {
            session.startTransaction();
            // Create follow relationship
            const result = await follow_model_1.Follow.create([
                {
                    follower: followerId,
                    following: followingId,
                    status: follow_interface_1.FollowStatus.ACCEPTED,
                },
            ], { session });
            if (!result) {
                throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to follow user');
            }
            await this.updateUserStats(followerId, followingId, 'increment', session);
            await session.commitTransaction();
            return result[0];
        }
        catch (error) {
            await session.abortTransaction();
            throw error;
        }
        finally {
            await session.endSession();
        }
    },
    // Unfollow a user
    // Unfollow a user
    async unfollowUser(user, targetUserId) {
        const followerId = new mongoose_1.Types.ObjectId(user.userId);
        const followingId = new mongoose_1.Types.ObjectId(targetUserId);
        const session = await mongoose_1.default.startSession();
        try {
            session.startTransaction();
            const follow = await follow_model_1.Follow.findOneAndDelete({
                follower: followerId,
                following: followingId,
                status: { $in: [follow_interface_1.FollowStatus.ACCEPTED, follow_interface_1.FollowStatus.PENDING] },
            }, { session });
            if (!follow) {
                throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Follow relationship not found');
            }
            await this.updateUserStats(followerId, followingId, 'decrement', session);
            await session.commitTransaction();
            return follow;
        }
        catch (error) {
            await session.abortTransaction();
            throw error;
        }
        finally {
            await session.endSession();
        }
    },
    // Accept follow request
    // Accept follow request
    async acceptFollowRequest(user, followerId) {
        const userId = new mongoose_1.Types.ObjectId(user.userId);
        const followerIdObj = new mongoose_1.Types.ObjectId(followerId);
        const follow = await follow_model_1.Follow.findOneAndUpdate({
            follower: followerIdObj,
            following: userId,
            status: follow_interface_1.FollowStatus.PENDING,
        }, { status: follow_interface_1.FollowStatus.ACCEPTED }, { new: true });
        if (!follow) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Follow request not found');
        }
        return follow;
    },
    // Reject follow request
    // Reject follow request
    async rejectFollowRequest(user, followerId) {
        const userId = new mongoose_1.Types.ObjectId(user.userId);
        const followerIdObj = new mongoose_1.Types.ObjectId(followerId);
        const follow = await follow_model_1.Follow.findOneAndUpdate({
            follower: followerIdObj,
            following: userId,
            status: follow_interface_1.FollowStatus.PENDING,
        }, { status: follow_interface_1.FollowStatus.REJECTED }, { new: true });
        if (!follow) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Follow request not found');
        }
        return follow;
    },
    // Block a user
    // Block a user
    async blockUser(user, targetUserId) {
        const blockerId = new mongoose_1.Types.ObjectId(user.userId);
        const blockedId = new mongoose_1.Types.ObjectId(targetUserId);
        const session = await mongoose_1.default.startSession();
        try {
            session.startTransaction();
            // Remove existing follow relationships
            await follow_model_1.Follow.deleteMany({
                $or: [
                    { follower: blockerId, following: blockedId },
                    { follower: blockedId, following: blockerId },
                ],
            }, { session });
            // Create block relationship
            const block = await follow_model_1.Follow.create([
                {
                    follower: blockerId,
                    following: blockedId,
                    status: follow_interface_1.FollowStatus.BLOCKED,
                },
            ], { session });
            await session.commitTransaction();
            return block[0];
        }
        catch (error) {
            await session.abortTransaction();
            throw error;
        }
        finally {
            await session.endSession();
        }
    },
    // Unblock a user
    // Unblock a user
    async unblockUser(user, targetUserId) {
        const blockerId = new mongoose_1.Types.ObjectId(user.userId);
        const blockedId = new mongoose_1.Types.ObjectId(targetUserId);
        const result = await follow_model_1.Follow.findOneAndDelete({
            follower: blockerId,
            following: blockedId,
            status: follow_interface_1.FollowStatus.BLOCKED,
        });
        if (!result) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Block relationship not found');
        }
        return result;
    },
    // Get followers/following list
    async getFollowList(userId, type, paginationOptions) {
        const { page, limit, skip, sortBy, sortOrder } = paginationHelper_1.paginationHelper.calculatePagination(paginationOptions);
        const query = type === 'followers'
            ? {
                following: new mongoose_1.Types.ObjectId(userId),
                status: follow_interface_1.FollowStatus.ACCEPTED,
            }
            : {
                follower: new mongoose_1.Types.ObjectId(userId),
                status: follow_interface_1.FollowStatus.ACCEPTED,
            };
        const [data, total] = await Promise.all([
            follow_model_1.Follow.find(query)
                .populate(type === 'followers' ? 'follower' : 'following', 'name email profile status')
                .sort({ [sortBy]: sortOrder })
                .skip(skip)
                .limit(limit)
                .lean(),
            follow_model_1.Follow.countDocuments(query),
        ]);
        const formattedData = data.map(item => ({
            user: type === 'followers' ? item.follower : item.following,
            followedAt: item.createdAt,
            status: item.status,
        }));
        return {
            meta: {
                page,
                limit,
                total,
                totalPage: Math.ceil(total / limit),
            },
            data: formattedData,
        };
    },
    // Get follow stats
    // Get follow stats
    async getFollowStats(userId) {
        const userIdObj = new mongoose_1.Types.ObjectId(userId);
        const [followers, following, pendingRequests] = await Promise.all([
            follow_model_1.Follow.countDocuments({
                following: userIdObj,
                status: follow_interface_1.FollowStatus.ACCEPTED,
            }),
            follow_model_1.Follow.countDocuments({
                follower: userIdObj,
                status: follow_interface_1.FollowStatus.ACCEPTED,
            }),
            follow_model_1.Follow.countDocuments({
                following: userIdObj,
                status: follow_interface_1.FollowStatus.PENDING,
            }),
        ]);
        return {
            followers,
            following,
            pendingRequests,
        };
    },
    // Check follow relationship
    // Check follow relationship
    async checkFollowStatus(user, targetUserId) {
        const currentUserId = new mongoose_1.Types.ObjectId(user.userId);
        const targetUserIdObj = new mongoose_1.Types.ObjectId(targetUserId);
        const [isFollowing, isFollower, isBlocked, isPending] = await Promise.all([
            follow_model_1.Follow.findOne({
                follower: currentUserId,
                following: targetUserIdObj,
                status: { $in: [follow_interface_1.FollowStatus.ACCEPTED, follow_interface_1.FollowStatus.PENDING] },
            }),
            follow_model_1.Follow.findOne({
                follower: targetUserIdObj,
                following: currentUserId,
                status: follow_interface_1.FollowStatus.ACCEPTED,
            }),
            follow_model_1.Follow.findOne({
                $or: [
                    {
                        follower: currentUserId,
                        following: targetUserIdObj,
                        status: follow_interface_1.FollowStatus.BLOCKED,
                    },
                    {
                        follower: targetUserIdObj,
                        following: currentUserId,
                        status: follow_interface_1.FollowStatus.BLOCKED,
                    },
                ],
            }),
            follow_model_1.Follow.findOne({
                follower: currentUserId,
                following: targetUserIdObj,
                status: follow_interface_1.FollowStatus.PENDING,
            }),
        ]);
        return {
            isFollowing: !!isFollowing,
            isFollower: !!isFollower,
            isBlocked: !!isBlocked,
            isPending: !!isPending,
            followId: isFollowing === null || isFollowing === void 0 ? void 0 : isFollowing._id,
            followedAt: isFollowing === null || isFollowing === void 0 ? void 0 : isFollowing.createdAt,
        };
    },
    // Get mutual followers
    // Get mutual followers
    async getMutualFollowers(user, targetUserId) {
        const currentUserId = new mongoose_1.Types.ObjectId(user.userId);
        const targetUserIdObj = new mongoose_1.Types.ObjectId(targetUserId);
        const mutual = await follow_model_1.Follow.aggregate([
            {
                $match: {
                    status: follow_interface_1.FollowStatus.ACCEPTED,
                    following: targetUserIdObj,
                },
            },
            {
                $lookup: {
                    from: 'follows',
                    let: { followerId: '$follower' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$follower', '$$followerId'] },
                                        { $eq: ['$following', currentUserId] },
                                        { $eq: ['$status', follow_interface_1.FollowStatus.ACCEPTED] },
                                    ],
                                },
                            },
                        },
                    ],
                    as: 'mutualFollow',
                },
            },
            {
                $match: {
                    mutualFollow: { $ne: [] },
                },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'follower',
                    foreignField: '_id',
                    as: 'userInfo',
                },
            },
            {
                $unwind: '$userInfo',
            },
            {
                $project: {
                    _id: '$userInfo._id',
                    name: '$userInfo.name',
                    email: '$userInfo.email',
                    profile: '$userInfo.profile',
                },
            },
        ]);
        return mutual;
    },
    // Get follow suggestions
    // Get follow suggestions
    async getFollowSuggestions(user, paginationOptions) {
        var _a, _b;
        const userId = new mongoose_1.Types.ObjectId(user.userId);
        const { page, limit, skip } = paginationHelper_1.paginationHelper.calculatePagination(paginationOptions);
        const suggestions = await follow_model_1.Follow.aggregate([
            // Get users that current user follows
            {
                $match: {
                    follower: userId,
                    status: follow_interface_1.FollowStatus.ACCEPTED,
                },
            },
            // Get who they follow
            {
                $lookup: {
                    from: 'follows',
                    let: { followingId: '$following' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$follower', '$$followingId'] },
                                        { $eq: ['$status', follow_interface_1.FollowStatus.ACCEPTED] },
                                        { $ne: ['$following', userId] },
                                    ],
                                },
                            },
                        },
                    ],
                    as: 'friendsFollows',
                },
            },
            // Unwind and group
            {
                $unwind: '$friendsFollows',
            },
            {
                $group: {
                    _id: '$friendsFollows.following',
                    count: { $sum: 1 },
                    commonFollowers: { $addToSet: '$friendsFollows.follower' },
                },
            },
            // Exclude users already followed by current user
            {
                $lookup: {
                    from: 'follows',
                    let: { suggestedUserId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$follower', userId] },
                                        { $eq: ['$following', '$$suggestedUserId'] },
                                    ],
                                },
                            },
                        },
                    ],
                    as: 'alreadyFollowed',
                },
            },
            {
                $match: {
                    alreadyFollowed: { $eq: [] },
                },
            },
            // Sort by most common friends
            {
                $sort: { count: -1 },
            },
            {
                $skip: skip,
            },
            {
                $limit: limit,
            },
            // Get user details
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'userDetails',
                },
            },
            {
                $unwind: '$userDetails',
            },
            {
                $project: {
                    _id: '$userDetails._id',
                    name: '$userDetails.name',
                    email: '$userDetails.email',
                    profile: '$userDetails.profile',
                    commonFollowersCount: '$count',
                    commonFollowers: '$commonFollowers',
                },
            },
        ]);
        const total = await follow_model_1.Follow.aggregate([
            {
                $match: {
                    follower: userId,
                    status: follow_interface_1.FollowStatus.ACCEPTED,
                },
            },
            {
                $lookup: {
                    from: 'follows',
                    let: { followingId: '$following' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$follower', '$$followingId'] },
                                        { $eq: ['$status', follow_interface_1.FollowStatus.ACCEPTED] },
                                        { $ne: ['$following', userId] },
                                    ],
                                },
                            },
                        },
                    ],
                    as: 'friendsFollows',
                },
            },
            {
                $unwind: '$friendsFollows',
            },
            {
                $group: {
                    _id: '$friendsFollows.following',
                },
            },
            {
                $count: 'total',
            },
        ]);
        return {
            meta: {
                page,
                limit,
                total: ((_a = total[0]) === null || _a === void 0 ? void 0 : _a.total) || 0,
                totalPage: Math.ceil((((_b = total[0]) === null || _b === void 0 ? void 0 : _b.total) || 0) / limit),
            },
            data: suggestions,
        };
    },
    // Private method to update user stats
    // Private method to update user stats
    async updateUserStats(followerId, followingId, operation, session) {
        const value = operation === 'increment' ? 1 : -1;
        await Promise.all([
            user_model_1.User.findByIdAndUpdate(followerId, {
                $inc: { 'stats.followingCount': value },
            }, { session }),
            user_model_1.User.findByIdAndUpdate(followingId, {
                $inc: { 'stats.followersCount': value },
            }, { session }),
        ]);
    },
};
