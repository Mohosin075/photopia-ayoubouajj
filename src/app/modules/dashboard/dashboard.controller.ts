import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import catchAsync from '../../../shared/catchAsync'
import sendResponse from '../../../shared/sendResponse'
import { DashboardService } from './dashboard.service'
import { IUserDetailsStats, IUserManagementStats } from './dashboard.interface'
import ApiError from '../../../errors/ApiError'

const getUserManagementStats = catchAsync(async (req: Request, res: Response) => {
  const result = await DashboardService.getUserManagementStats()
  sendResponse<IUserManagementStats>(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'User management stats retrieved successfully',
    data: result,
  })
})

const getUserDetailsStats = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params
  const result = await DashboardService.getUserDetailsStats(userId)
  sendResponse<IUserDetailsStats>(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'User details stats retrieved successfully',
    data: result,
  })
})

const warnUser = catchAsync(async (req: Request, res: Response) => {
  const { userId, message } = req.body
  console.log({userId, message})
  if (!userId || !message) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'User ID and message are required')
  }
  const result = await DashboardService.warnUser(userId, message)
  sendResponse<string>(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Warning sent successfully',
    data: result,
  })
})

export const DashboardController = {
  getUserManagementStats,
  getUserDetailsStats,
  warnUser,
}
