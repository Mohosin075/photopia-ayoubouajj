import { USER_ROLES, USER_STATUS } from '../../../enum/user'
import { User } from '../user/user.model'
import { IUserManagementStats } from './dashboard.interface'

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

export const DashboardService = {
  getUserManagementStats,
}
