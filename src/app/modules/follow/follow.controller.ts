import { Request, Response } from 'express'
import { FollowServices } from './follow.service'
import catchAsync from '../../../shared/catchAsync'
import sendResponse from '../../../shared/sendResponse'
import { StatusCodes } from 'http-status-codes'
import { paginationFields } from '../../../interfaces/pagination'
import pick from '../../../shared/pick'

const followUser = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params
  const result = await FollowServices.followUser(req.user!, userId)

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Follow request sent successfully',
    data: result,
  })
})

const unfollowUser = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params
  const result = await FollowServices.unfollowUser(req.user!, userId)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Unfollowed successfully',
    data: result,
  })
})

const acceptFollowRequest = catchAsync(async (req: Request, res: Response) => {
  const { followerId } = req.params
  const result = await FollowServices.acceptFollowRequest(req.user!, followerId)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Follow request accepted',
    data: result,
  })
})

const rejectFollowRequest = catchAsync(async (req: Request, res: Response) => {
  const { followerId } = req.params
  const result = await FollowServices.rejectFollowRequest(req.user!, followerId)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Follow request rejected',
    data: result,
  })
})

const blockUser = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params
  const result = await FollowServices.blockUser(req.user!, userId)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'User blocked successfully',
    data: result,
  })
})

const unblockUser = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params
  const result = await FollowServices.unblockUser(req.user!, userId)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'User unblocked successfully',
    data: result,
  })
})
const getFollowers = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params
  const type = req.query.type as 'followers' | 'following'
  const paginationOptions = pick(req.query, paginationFields)

  const result = await FollowServices.getFollowList(
    userId,
    type,
    paginationOptions,
  )

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Followers retrieved successfully',
    data: result,
  })
})

const getFollowStats = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params
  const result = await FollowServices.getFollowStats(userId)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Follow stats retrieved successfully',
    data: result,
  })
})

const checkFollowStatus = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params
  const result = await FollowServices.checkFollowStatus(req.user!, userId)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Follow status retrieved successfully',
    data: result,
  })
})

const getMutualFollowers = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params
  const result = await FollowServices.getMutualFollowers(req.user!, userId)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Mutual followers retrieved successfully',
    data: result,
  })
})

const getFollowSuggestions = catchAsync(async (req: Request, res: Response) => {
  const paginationOptions = pick(req.query, paginationFields)
  const result = await FollowServices.getFollowSuggestions(
    req.user!,
    paginationOptions,
  )

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Follow suggestions retrieved successfully',
    data: result,
  })
})

export const FollowController = {
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
}
