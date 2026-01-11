"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFollowSuggestionsSchema = exports.getMutualFollowersSchema = exports.checkFollowStatusSchema = exports.getFollowStatsSchema = exports.getFollowersSchema = exports.unblockUserSchema = exports.blockUserSchema = exports.rejectFollowRequestSchema = exports.acceptFollowRequestSchema = exports.unfollowUserSchema = exports.followUserSchema = void 0;
const zod_1 = require("zod");
exports.followUserSchema = zod_1.z.object({
    params: zod_1.z.object({
        userId: zod_1.z.string().min(1, 'User ID is required'),
    }),
});
exports.unfollowUserSchema = zod_1.z.object({
    params: zod_1.z.object({
        userId: zod_1.z.string().min(1, 'User ID is required'),
    }),
});
exports.acceptFollowRequestSchema = zod_1.z.object({
    params: zod_1.z.object({
        followerId: zod_1.z.string().min(1, 'Follower ID is required'),
    }),
});
exports.rejectFollowRequestSchema = zod_1.z.object({
    params: zod_1.z.object({
        followerId: zod_1.z.string().min(1, 'Follower ID is required'),
    }),
});
exports.blockUserSchema = zod_1.z.object({
    params: zod_1.z.object({
        userId: zod_1.z.string().min(1, 'User ID is required'),
    }),
});
exports.unblockUserSchema = zod_1.z.object({
    params: zod_1.z.object({
        userId: zod_1.z.string().min(1, 'User ID is required'),
    }),
});
exports.getFollowersSchema = zod_1.z.object({
    params: zod_1.z.object({
        userId: zod_1.z.string().min(1, 'User ID is required'),
    }),
    query: zod_1.z.object({
        type: zod_1.z.enum(['followers', 'following']).optional(),
        page: zod_1.z.string().optional(),
        limit: zod_1.z.string().optional(),
        sortBy: zod_1.z.string().optional(),
        sortOrder: zod_1.z.enum(['asc', 'desc']).optional(),
    }),
});
exports.getFollowStatsSchema = zod_1.z.object({
    params: zod_1.z.object({
        userId: zod_1.z.string().min(1, 'User ID is required'),
    }),
});
exports.checkFollowStatusSchema = zod_1.z.object({
    params: zod_1.z.object({
        userId: zod_1.z.string().min(1, 'User ID is required'),
    }),
});
exports.getMutualFollowersSchema = zod_1.z.object({
    params: zod_1.z.object({
        userId: zod_1.z.string().min(1, 'User ID is required'),
    }),
});
exports.getFollowSuggestionsSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().optional(),
        limit: zod_1.z.string().optional(),
        sortBy: zod_1.z.string().optional(),
        sortOrder: zod_1.z.enum(['asc', 'desc']).optional(),
    }),
});
