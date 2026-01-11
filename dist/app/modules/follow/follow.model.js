"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Follow = void 0;
const mongoose_1 = require("mongoose");
const follow_interface_1 = require("./follow.interface");
const FollowSchema = new mongoose_1.Schema({
    follower: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    following: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    status: {
        type: String,
        enum: Object.values(follow_interface_1.FollowStatus),
        default: follow_interface_1.FollowStatus.ACCEPTED,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
// Ensure one follower-following pair
FollowSchema.index({ follower: 1, following: 1 }, { unique: true });
// Virtual populate for user data
FollowSchema.virtual('followerInfo', {
    ref: 'User',
    localField: 'follower',
    foreignField: '_id',
    justOne: true,
});
FollowSchema.virtual('followingInfo', {
    ref: 'User',
    localField: 'following',
    foreignField: '_id',
    justOne: true,
});
exports.Follow = (0, mongoose_1.model)('Follow', FollowSchema);
