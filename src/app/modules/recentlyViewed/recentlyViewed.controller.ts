import { Request, Response } from 'express'
import catchAsync from '../../../shared/catchAsync'
import sendResponse from '../../../shared/sendResponse'
import { StatusCodes } from 'http-status-codes'
import { RecentlyViewedServices } from './recentlyViewed.service'
import { JwtPayload } from 'jsonwebtoken'

const recordView = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user as JwtPayload
  const { serviceId } = req.body

  const result = await RecentlyViewedServices.recordView(userId, serviceId)

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'View recorded successfully',
    data: result,
  })
})

const getRecentlyViewed = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user as JwtPayload
  const result = await RecentlyViewedServices.getRecentlyViewed(userId)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Recently viewed services retrieved successfully',
    data: result,
  })
})

export const RecentlyViewedController = {
  recordView,
  getRecentlyViewed,
}
