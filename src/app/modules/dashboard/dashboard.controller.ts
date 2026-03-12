import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import catchAsync from '../../../shared/catchAsync'
import sendResponse from '../../../shared/sendResponse'
import { DashboardService } from './dashboard.service'
import {
  IContentModerationStats,
  IModerationReport,
  IModerationReportDetails,
  IUserDetailsStats,
  IUserManagementStats,
} from './dashboard.interface'
import ApiError from '../../../errors/ApiError'
import { JwtPayload } from 'jsonwebtoken'

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
  const result = await DashboardService.warnUser(userId, message)
  sendResponse<string>(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Warning sent successfully',
    data: result,
  })
})

const getContentModerationStats = catchAsync(async (req: Request, res: Response) => {
  const result = await DashboardService.getContentModerationStats()
  sendResponse<IContentModerationStats>(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Content moderation stats retrieved successfully',
    data: result,
  })
})

const getModerationReports = catchAsync(async (req: Request, res: Response) => {
  const result = await DashboardService.getModerationReports()
  sendResponse<IModerationReport[]>(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Moderation reports retrieved successfully',
    data: result,
  })
})

const getModerationReportDetails = catchAsync(async (req: Request, res: Response) => {
  const { reportId } = req.params
  const result = await DashboardService.getModerationReportDetails(reportId)
  sendResponse<IModerationReportDetails>(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Moderation report details retrieved successfully',
    data: result,
  })
})

const handleModerationAction = catchAsync(async (req: Request, res: Response) => {
  const { reportId } = req.params
  const { action, details } = req.body
  const admin = req.user as JwtPayload

  const result = await DashboardService.handleModerationAction(
    reportId,
    admin.userId,
    action,
    details || '',
  )

  sendResponse<string>(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Moderation action performed successfully',
    data: result,
  })
})

export const DashboardController = {
  getUserManagementStats,
  getUserDetailsStats,
  warnUser,
  getContentModerationStats,
  getModerationReports,
  getModerationReportDetails,
  handleModerationAction,
}
