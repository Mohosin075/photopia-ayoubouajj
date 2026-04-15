import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import catchAsync from '../../../shared/catchAsync'
import sendResponse from '../../../shared/sendResponse'
import { DashboardService } from './dashboard.service'
import {
  IAdvancedAnalyticsStats,
  IContentModerationStats,
  IDetailedDashboardStats,
  IModerationReport,
  IModerationReportDetails,
  IPaymentStats,
  ISubscriber,
  ISubscriptionStats,
  ITransaction,
  ITransactionDetails,
  IUserDetailsStats,
  IUserManagementStats,
  ICategoryStats,
} from './dashboard.interface'
import ApiError from '../../../errors/ApiError'
import { JwtPayload } from 'jsonwebtoken'

const getUserManagementStats = catchAsync(async (req: Request, res: Response) => {
  const { country, city } = req.query
  const result = await DashboardService.getUserManagementStats(
    country as string,
    city as string,
  )
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

const getPaymentAndCommissionStats = catchAsync(async (req: Request, res: Response) => {
  const { country, city } = req.query
  const result = await DashboardService.getPaymentAndCommissionStats(
    country as string,
    city as string,
  )
  sendResponse<IPaymentStats>(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Payment and commission stats retrieved successfully',
    data: result,
  })
})

const getRecentTransactions = catchAsync(async (req: Request, res: Response) => {
  const result = await DashboardService.getRecentTransactions()
  sendResponse<ITransaction[]>(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Recent transactions retrieved successfully',
    data: result,
  })
})

const getTransactionDetails = catchAsync(async (req: Request, res: Response) => {
  const { transactionId } = req.params
  const result = await DashboardService.getTransactionDetails(transactionId)
  sendResponse<ITransactionDetails>(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Transaction details retrieved successfully',
    data: result,
  })
})

const getSubscriptionManagementStats = catchAsync(async (req: Request, res: Response) => {
  const result = await DashboardService.getSubscriptionManagementStats()
  sendResponse<ISubscriptionStats>(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Subscription management stats retrieved successfully',
    data: result,
  })
})

const getSubscriberList = catchAsync(async (req: Request, res: Response) => {
  const result = await DashboardService.getSubscriberList()
  sendResponse<ISubscriber[]>(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Subscriber list retrieved successfully',
    data: result,
  })
})

const getAdvancedAnalyticsStats = catchAsync(async (req: Request, res: Response) => {
  const result = await DashboardService.getAdvancedAnalyticsStats()
  sendResponse<IAdvancedAnalyticsStats>(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Advanced analytics stats retrieved successfully',
    data: result,
  })
})

const toggleUserStatus = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params
  const result = await DashboardService.toggleUserStatus(userId)
  sendResponse<string>(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'User status updated successfully',
    data: result,
  })
})

const exportUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await DashboardService.exportUsers()

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  res.setHeader('Content-Disposition', 'attachment; filename=' + 'users.xlsx')

  res.send(result)
})

const exportPayments = catchAsync(async (req: Request, res: Response) => {
  const result = await DashboardService.exportPayments()

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  res.setHeader('Content-Disposition', 'attachment; filename=' + 'payments.xlsx')

  res.send(result)
})

const getLocationList = catchAsync(async (req: Request, res: Response) => {
  const result = await DashboardService.getLocationList()
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Location list retrieved successfully',
    data: result,
  })
})

const getDetailedStats = catchAsync(async (req: Request, res: Response) => {
  const { country, city } = req.query
  const result = await DashboardService.getDetailedStats(country as string, city as string)
  sendResponse<IDetailedDashboardStats>(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Detailed dashboard stats retrieved successfully',
    data: result,
  })
})

const getCategoryStats = catchAsync(async (req: Request, res: Response) => {
  const result = await DashboardService.getCategoryStats()
  sendResponse<ICategoryStats>(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Category stats retrieved successfully',
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
  getPaymentAndCommissionStats,
  getRecentTransactions,
  getTransactionDetails,
  getSubscriptionManagementStats,
  getSubscriberList,
  getAdvancedAnalyticsStats,
  toggleUserStatus,
  exportUsers,
  exportPayments,
  getLocationList,
  getDetailedStats,
  getCategoryStats,
}
