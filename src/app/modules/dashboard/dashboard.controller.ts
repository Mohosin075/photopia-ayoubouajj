import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import catchAsync from '../../../shared/catchAsync'
import sendResponse from '../../../shared/sendResponse'
import { DashboardService } from './dashboard.service'
import { IUserManagementStats } from './dashboard.interface'

const getUserManagementStats = catchAsync(async (req: Request, res: Response) => {
  const result = await DashboardService.getUserManagementStats()
  sendResponse<IUserManagementStats>(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'User management stats retrieved successfully',
    data: result,
  })
})

export const DashboardController = {
  getUserManagementStats,
}
