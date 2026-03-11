import { StatusCodes } from 'http-status-codes'
import { Types } from 'mongoose'
import { USER_ROLES, USER_STATUS } from '../../../enum/user'
import ApiError from '../../../errors/ApiError'
import { Booking } from '../booking/booking.model'
import { Review } from '../review/review.model'
import { User } from '../user/user.model'
import {
  IActivityHistory,
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

export const DashboardService = {
  getUserManagementStats,
  getUserDetailsStats,
  warnUser,
}
