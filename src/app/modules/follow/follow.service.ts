import { StatusCodes } from 'http-status-codes'
import { JwtPayload } from 'jsonwebtoken'
import mongoose, { Types } from 'mongoose'
import ApiError from '../../../errors/ApiError'
import { paginationHelper } from '../../../helpers/paginationHelper'
import { IPaginationOptions } from '../../../interfaces/pagination'
import { User } from '../user/user.model'
import { FollowStatus, FollowStats } from './follow.interface'
import { Follow } from './follow.model'

export const FollowServices = {
  // Follow a user
  // Follow a user
  async followUser(user: JwtPayload, targetUserId: string) {
    const followerId = new Types.ObjectId(user.authId)
    const followingId = new Types.ObjectId(targetUserId)

    // Check if trying to follow self
    if (followerId.equals(followingId)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Cannot follow yourself')
    }

    // Check if users exist
    const [follower, following] = await Promise.all([
      User.findById(followerId),
      User.findById(followingId),
    ])

    if (!follower || !following) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
    }

    // Check if already following
    const existingFollow = await Follow.findOne({
      follower: followerId,
      following: followingId,
    })

    if (existingFollow) {
      if (existingFollow.status === FollowStatus.REJECTED) {
        existingFollow.status = FollowStatus.ACCEPTED
        await existingFollow.save()
        return existingFollow
      }
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Already following this user')
    }

    // Check if blocked
    const isBlocked = await Follow.findOne({
      follower: followingId,
      following: followerId,
      status: FollowStatus.BLOCKED,
    })

    if (isBlocked) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'Cannot follow this user')
    }

    const session = await mongoose.startSession()
    try {
      session.startTransaction()

      // Create follow relationship
      const result = await Follow.create(
        [
          {
            follower: followerId,
            following: followingId,
            status: FollowStatus.ACCEPTED,
          },
        ],
        { session },
      )

      if (!result) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to follow user')
      }

      await this.updateUserStats(followerId, followingId, 'increment', session)

      await session.commitTransaction()
      return result[0]
    } catch (error) {
      await session.abortTransaction()
      throw error
    } finally {
      await session.endSession()
    }
  },

  // Unfollow a user
  // Unfollow a user
  async unfollowUser(user: JwtPayload, targetUserId: string) {
    const followerId = new Types.ObjectId(user.authId)
    const followingId = new Types.ObjectId(targetUserId)

    const session = await mongoose.startSession()
    try {
      session.startTransaction()

      const follow = await Follow.findOneAndDelete(
        {
          follower: followerId,
          following: followingId,
          status: { $in: [FollowStatus.ACCEPTED, FollowStatus.PENDING] },
        },
        { session },
      )

      if (!follow) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Follow relationship not found')
      }

      await this.updateUserStats(followerId, followingId, 'decrement', session)

      await session.commitTransaction()
      return follow
    } catch (error) {
      await session.abortTransaction()
      throw error
    } finally {
      await session.endSession()
    }
  },

  // Accept follow request
  // Accept follow request
  async acceptFollowRequest(user: JwtPayload, followerId: string) {
    const userId = new Types.ObjectId(user.authId)
    const followerIdObj = new Types.ObjectId(followerId)

    const follow = await Follow.findOneAndUpdate(
      {
        follower: followerIdObj,
        following: userId,
        status: FollowStatus.PENDING,
      },
      { status: FollowStatus.ACCEPTED },
      { new: true },
    )

    if (!follow) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Follow request not found')
    }

    return follow
  },

  // Reject follow request
  // Reject follow request
  async rejectFollowRequest(user: JwtPayload, followerId: string) {
    const userId = new Types.ObjectId(user.authId)
    const followerIdObj = new Types.ObjectId(followerId)

    const follow = await Follow.findOneAndUpdate(
      {
        follower: followerIdObj,
        following: userId,
        status: FollowStatus.PENDING,
      },
      { status: FollowStatus.REJECTED },
      { new: true },
    )

    if (!follow) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Follow request not found')
    }

    return follow
  },

  // Block a user
  // Block a user
  async blockUser(user: JwtPayload, targetUserId: string) {
    const blockerId = new Types.ObjectId(user.authId)
    const blockedId = new Types.ObjectId(targetUserId)

    const session = await mongoose.startSession()
    try {
      session.startTransaction()

      // Remove existing follow relationships
      await Follow.deleteMany(
        {
          $or: [
            { follower: blockerId, following: blockedId },
            { follower: blockedId, following: blockerId },
          ],
        },
        { session },
      )

      // Create block relationship
      const block = await Follow.create(
        [
          {
            follower: blockerId,
            following: blockedId,
            status: FollowStatus.BLOCKED,
          },
        ],
        { session },
      )

      await session.commitTransaction()
      return block[0]
    } catch (error) {
      await session.abortTransaction()
      throw error
    } finally {
      await session.endSession()
    }
  },

  // Unblock a user
  // Unblock a user
  async unblockUser(user: JwtPayload, targetUserId: string) {
    const blockerId = new Types.ObjectId(user.authId)
    const blockedId = new Types.ObjectId(targetUserId)

    const result = await Follow.findOneAndDelete({
      follower: blockerId,
      following: blockedId,
      status: FollowStatus.BLOCKED,
    })

    if (!result) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Block relationship not found')
    }

    return result
  },

  // Get followers/following list
  async getFollowList(
    userId: string,
    type: 'followers' | 'following',
    paginationOptions: IPaginationOptions,
  ) {
    const { page, limit, skip, sortBy, sortOrder } =
      paginationHelper.calculatePagination(paginationOptions)

    const query: any =
      type === 'followers'
        ? {
            following: new Types.ObjectId(userId),
            status: FollowStatus.ACCEPTED,
          }
        : {
            follower: new Types.ObjectId(userId),
            status: FollowStatus.ACCEPTED,
          }

    const [data, total] = await Promise.all([
      Follow.find(query)
        .populate(
          type === 'followers' ? 'follower' : 'following',
          'name email profile status',
        )
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      Follow.countDocuments(query),
    ])

    const formattedData = data.map(item => ({
      user: type === 'followers' ? item.follower : item.following,
      followedAt: item.createdAt,
      status: item.status,
    }))

    return {
      meta: {
        page,
        limit,
        total,
        totalPage: Math.ceil(total / limit),
      },
      data: formattedData,
    }
  },

  // Get follow stats
  // Get follow stats
  async getFollowStats(userId: string): Promise<FollowStats> {
    const userIdObj = new Types.ObjectId(userId)

    const [followers, following, pendingRequests] = await Promise.all([
      Follow.countDocuments({
        following: userIdObj,
        status: FollowStatus.ACCEPTED,
      }),
      Follow.countDocuments({
        follower: userIdObj,
        status: FollowStatus.ACCEPTED,
      }),
      Follow.countDocuments({
        following: userIdObj,
        status: FollowStatus.PENDING,
      }),
    ])

    return {
      followers,
      following,
      pendingRequests,
    }
  },

  // Check follow relationship
  // Check follow relationship
  async checkFollowStatus(user: JwtPayload, targetUserId: string) {
    const currentUserId = new Types.ObjectId(user.authId)
    const targetUserIdObj = new Types.ObjectId(targetUserId)

    const [isFollowing, isFollower, isBlocked, isPending] = await Promise.all([
      Follow.findOne({
        follower: currentUserId,
        following: targetUserIdObj,
        status: { $in: [FollowStatus.ACCEPTED, FollowStatus.PENDING] },
      }),
      Follow.findOne({
        follower: targetUserIdObj,
        following: currentUserId,
        status: FollowStatus.ACCEPTED,
      }),
      Follow.findOne({
        $or: [
          {
            follower: currentUserId,
            following: targetUserIdObj,
            status: FollowStatus.BLOCKED,
          },
          {
            follower: targetUserIdObj,
            following: currentUserId,
            status: FollowStatus.BLOCKED,
          },
        ],
      }),
      Follow.findOne({
        follower: currentUserId,
        following: targetUserIdObj,
        status: FollowStatus.PENDING,
      }),
    ])

    return {
      isFollowing: !!isFollowing,
      isFollower: !!isFollower,
      isBlocked: !!isBlocked,
      isPending: !!isPending,
      followId: isFollowing?._id,
      followedAt: isFollowing?.createdAt,
    }
  },

  // Get mutual followers
  // Get mutual followers
  async getMutualFollowers(user: JwtPayload, targetUserId: string) {
    const currentUserId = new Types.ObjectId(user.authId)
    const targetUserIdObj = new Types.ObjectId(targetUserId)

    const mutual = await Follow.aggregate([
      {
        $match: {
          status: FollowStatus.ACCEPTED,
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
                    { $eq: ['$status', FollowStatus.ACCEPTED] },
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
    ])

    return mutual
  },

  // Get follow suggestions
  // Get follow suggestions
  async getFollowSuggestions(
    user: JwtPayload,
    paginationOptions: IPaginationOptions,
  ) {
    const userId = new Types.ObjectId(user.authId)
    const { page, limit, skip } = paginationHelper.calculatePagination(paginationOptions)

    const suggestions = await Follow.aggregate([
      // Get users that current user follows
      {
        $match: {
          follower: userId,
          status: FollowStatus.ACCEPTED,
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
                    { $eq: ['$status', FollowStatus.ACCEPTED] },
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
    ])

    const total = await Follow.aggregate([
      {
        $match: {
          follower: userId,
          status: FollowStatus.ACCEPTED,
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
                    { $eq: ['$status', FollowStatus.ACCEPTED] },
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
    ])

    return {
      meta: {
        page,
        limit,
        total: total[0]?.total || 0,
        totalPage: Math.ceil((total[0]?.total || 0) / limit),
      },
      data: suggestions,
    }
  },

  // Private method to update user stats
  // Private method to update user stats
  async updateUserStats(
    followerId: Types.ObjectId,
    followingId: Types.ObjectId,
    operation: 'increment' | 'decrement',
    session?: mongoose.ClientSession,
  ) {
    const value = operation === 'increment' ? 1 : -1

    await Promise.all([
      User.findByIdAndUpdate(
        followerId,
        {
          $inc: { 'stats.followingCount': value },
        },
        { session },
      ),
      User.findByIdAndUpdate(
        followingId,
        {
          $inc: { 'stats.followersCount': value },
        },
        { session },
      ),
    ])
  },
}
