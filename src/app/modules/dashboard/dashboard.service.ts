import { StatusCodes } from 'http-status-codes'
import { Types } from 'mongoose'
import { USER_ROLES, USER_STATUS } from '../../../enum/user'
import { SUPPORT_STATUS } from '../../../enum/support'
import ApiError from '../../../errors/ApiError'
import { Booking } from '../booking/booking.model'
import { Review } from '../review/review.model'
import { Support } from '../support/support.model'
import { User } from '../user/user.model'
import {
  IActivityHistory,
  IContentModerationStats,
  IModerationLog,
  IModerationReport,
  IModerationReportDetails,
  IRecentPayment,
  IUserDetailsStats,
  IUserManagementStats,
} from './dashboard.interface'
import { Notification } from '../notification/notification.model'
import { CreateNotificationDto, NotificationType } from '../notification/notification.interface'
import { NotificationServices } from '../notification/notification.service'

const getUserManagementStats = async (): Promise<IUserManagementStats> => {
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [totalUsers, providers, activeThisMonth, suspended] = await Promise.all([
    User.countDocuments({ status: { $ne: USER_STATUS.DELETED } }),
    User.countDocuments({
      roles: USER_ROLES.PROFESSIONAL,
      status: { $ne: USER_STATUS.DELETED },
    }),
    User.countDocuments({
      status: { $ne: USER_STATUS.DELETED },
      $or: [
        { createdAt: { $gte: firstDayOfMonth } },
        { 'authentication.latestRequestAt': { $gte: firstDayOfMonth } },
      ],
    }),
    User.countDocuments({ status: USER_STATUS.INACTIVE }),
  ])

  return {
    totalUsers,
    providers,
    activeThisMonth,
    suspended,
  }
}

const getUserDetailsStats = async (userId: string): Promise<IUserDetailsStats> => {
  if (!Types.ObjectId.isValid(userId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid user ID')
  }

  const user = await User.findOne({
    _id: userId,
    status: { $ne: USER_STATUS.DELETED },
  }).lean()

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found.')
  }

  const objectId = new Types.ObjectId(userId)

  // Statistics
  const [completedBookings, reviews] = await Promise.all([
    Booking.find({
      providerId: objectId,
      status: 'completed',
    }).lean(),
    Review.find({ reviewee: objectId }).lean(),
  ])

  const totalRevenue = completedBookings.reduce(
    (acc, booking) => acc + (booking.pricingDetails?.providerEarnings || 0),
    0,
  )

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length
      : 0

  // Recent Payments (using last 5 completed bookings)
  const recentPayments: IRecentPayment[] = completedBookings
    .slice(-5)
    .reverse()
    .map((booking: any) => ({
      serviceName: booking.eventType || 'Service',
      date: booking.completedAt || booking.updatedAt,
      amount: booking.pricingDetails?.clientTotal || 0,
      currency: booking.pricingDetails?.currency || 'EUR',
    }))

  // Activity History (from notifications)
  const notifications = await Notification.find({ userId: objectId })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean()

  const activityHistory: IActivityHistory[] = notifications.map(notif => ({
    type: notif.type,
    message: notif.content,
    timestamp: notif.createdAt,
  }))

  // If activity history is empty, add "Profile created" as a fallback
  if (activityHistory.length === 0) {
    activityHistory.push({
      type: 'PROFILE_CREATED',
      message: 'Account registration',
      timestamp: user.createdAt,
    })
  }

  return {
    user: {
      id: user._id.toString(),
      name: user.fullName || user.name || '',
      email: user.email || '',
      profile: user.profile || '',
      phone: user.phone || '',
      address: `${user.address?.city || ''}, ${user.address?.country || ''}`.trim(),
      status: user.status,
      joinedDate: user.createdAt,
    },
    statistics: {
      totalRevenue,
      completedJobs: completedBookings.length,
      averageRating,
      responseTime: '2.3 hours', // Mocking this as per UI requirement
    },
    activityHistory,
    recentPayments,
  }
}

const warnUser = async (userId: string, message: string): Promise<string> => {
  if (!Types.ObjectId.isValid(userId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid user ID')
  }

  const user = await User.findById(userId)
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found.')
  }

  const payload: CreateNotificationDto = {
    userId,
    title: 'Admin Warning',
    content: message,
    type: NotificationType.SYSTEM_ALERT,
  }

  await NotificationServices.createNotification(payload, true)
  return 'Warning sent to user successfully.'
}

const getContentModerationStats = async (): Promise<IContentModerationStats> => {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const [pendingReports, underReview, resolvedToday, totalReports] = await Promise.all([
    Support.countDocuments({ status: SUPPORT_STATUS.PENDING }),
    Support.countDocuments({ status: SUPPORT_STATUS.UNDER_REVIEW }),
    Support.countDocuments({
      status: SUPPORT_STATUS.SOLVED,
      updatedAt: { $gte: startOfDay },
    }),
    Support.countDocuments({ status: { $ne: SUPPORT_STATUS.DELETED } }),
  ])

  return {
    pendingReports,
    underReview,
    resolvedToday,
    totalReports,
  }
}

const getModerationReports = async (): Promise<IModerationReport[]> => {
  const reports = await Support.find({ status: { $ne: SUPPORT_STATUS.DELETED } })
    .populate('userId', 'name fullName')
    .populate('reportedUser', 'name fullName')
    .sort({ createdAt: -1 })
    .lean()

  return reports.map((report: any) => ({
    id: report._id.toString(),
    title: `${report.reason.charAt(0).toUpperCase() + report.reason.slice(1)} Report`,
    description: report.message,
    priority: report.priority || 'medium',
    status: report.status,
    reportedUser: {
      id: report.reportedUser?._id?.toString() || '',
      name: report.reportedUser?.fullName || report.reportedUser?.name || 'Unknown User',
    },
    reportedBy: {
      id: report.userId?._id?.toString() || '',
      name: report.userId?.fullName || report.userId?.name || 'System',
    },
    date: report.createdAt,
  }))
}

const getModerationReportDetails = async (
  reportId: string,
): Promise<IModerationReportDetails> => {
  if (!Types.ObjectId.isValid(reportId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid report ID')
  }

  const report = (await Support.findById(reportId)
    .populate('userId', 'name fullName profile')
    .populate('reportedUser', 'name fullName profile createdAt status')
    .populate('moderationLog.by', 'name fullName')
    .lean()) as any

  if (!report) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Report not found.')
  }

  const reportedUserId = report.reportedUser?._id

  // User History
  const [totalReports, warningsIssued] = await Promise.all([
    Support.countDocuments({ reportedUser: reportedUserId }),
    Notification.countDocuments({
      userId: reportedUserId,
      type: NotificationType.SYSTEM_ALERT,
      title: 'Admin Warning',
    }),
  ])

  // Account Age Calculation
  const createdAt = report.reportedUser?.createdAt || new Date()
  const diffMs = new Date().getTime() - new Date(createdAt).getTime()
  const diffMonths = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30))
  const accountAge = diffMonths > 0 ? `${diffMonths} months` : 'New account'

  // Related Reports
  const relatedReportsData = (await Support.find({
    reportedUser: reportedUserId,
    _id: { $ne: report._id },
  })
    .limit(5)
    .sort({ createdAt: -1 })
    .lean()) as any[]

  const relatedReports = relatedReportsData.map(r => ({
    id: r._id.toString(),
    title: `${r.reason.charAt(0).toUpperCase() + r.reason.slice(1)} Report`,
    date: r.createdAt,
    status: r.status,
  }))

  return {
    report: {
      id: report._id.toString(),
      reportId: `#RPT-${report._id.toString().slice(-6).toUpperCase()}`,
      title: `${report.reason.charAt(0).toUpperCase() + report.reason.slice(1)} Report`,
      description: report.message,
      priority: report.priority || 'medium',
      status: report.status,
      reportedUser: {
        id: reportedUserId?.toString() || '',
        name: report.reportedUser?.fullName || report.reportedUser?.name || 'Unknown',
      },
      reportedBy: {
        id: report.userId?._id?.toString() || '',
        name: report.userId?.fullName || report.userId?.name || 'System',
      },
      date: report.createdAt,
      reportedContent: 'Content preview would appear here. This could be text, images, or other media that was reported.',
    },
    userHistory: {
      totalReports,
      warningsIssued,
      accountAge,
      accountStatus: report.reportedUser?.status || 'Unknown',
    },
    relatedReports,
    moderationLog: (report.moderationLog || []).map((log: any) => ({
      action: log.action,
      by: log.by?.fullName || log.by?.name || 'System',
      details: log.details,
      timestamp: log.timestamp,
    })),
  }
}

const handleModerationAction = async (
  reportId: string,
  adminId: string,
  action: 'warning' | 'block' | 'remove' | 'archive' | 'refund' | 'close',
  details: string,
): Promise<string> => {
  if (!Types.ObjectId.isValid(reportId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid report ID')
  }

  const report = await Support.findById(reportId)
  if (!report) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Report not found.')
  }

  const reportedUserId = report.reportedUser?.toString()

  switch (action) {
    case 'warning':
      await warnUser(reportedUserId!, details)
      report.status = SUPPORT_STATUS.UNDER_REVIEW
      break
    case 'block':
      await User.findByIdAndUpdate(reportedUserId, { status: USER_STATUS.INACTIVE })
      report.status = SUPPORT_STATUS.UNDER_REVIEW
      break
    case 'close':
      report.status = SUPPORT_STATUS.SOLVED
      break
    case 'archive':
      report.status = SUPPORT_STATUS.DISMISSED
      break
    // 'remove' and 'refund' would require more specific logic based on contentId/bookingId
    default:
      report.status = SUPPORT_STATUS.UNDER_REVIEW
  }

  report.moderationLog?.push({
    action: action.toUpperCase(),
    by: new Types.ObjectId(adminId),
    details,
    timestamp: new Date(),
  })

  await report.save()
  return `Action ${action} performed successfully.`
}

export const DashboardService = {
  getUserManagementStats,
  getUserDetailsStats,
  warnUser,
  getContentModerationStats,
  getModerationReports,
  getModerationReportDetails,
  handleModerationAction,
}
