import { Request, Response } from 'express'
import httpStatus from 'http-status-codes'
import catchAsync from '../../../shared/catchAsync'
import sendResponse from '../../../shared/sendResponse'
import { AnalyticsService } from './analytics.service'
import { JwtPayload } from 'jsonwebtoken'
import ApiError from '../../../errors/ApiError'

const trackVisit = catchAsync(async (req: Request, res: Response) => {
  const visitorId = req.user
    ? (req.user as JwtPayload).userId
    : (req.headers['x-visitor-id'] as string) || req.ip

  await AnalyticsService.trackVisit({
    ...req.body,
    visitorId,
  })

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Visit tracked successfully',
    data: null,
  })
})

const getPremiumAnalytics = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found')
  }

  const result = await AnalyticsService.getPremiumAnalytics(user.userId)

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Premium analytics retrieved successfully',
    data: result,
  })
})

export const AnalyticsController = {
  trackVisit,
  getPremiumAnalytics,
}
