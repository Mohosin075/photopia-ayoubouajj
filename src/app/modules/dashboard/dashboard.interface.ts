export type IUserManagementStats = {
  totalUsers: number
  providers: number
  activeThisMonth: number
  suspended: number
}

export type IActivityHistory = {
  type: string
  message: string
  timestamp: Date
}

export type IRecentPayment = {
  serviceName: string
  date: Date
  amount: number
  currency: string
}

export type IUserDetailsStats = {
  user: {
    id: string
    name: string
    email: string
    profile: string
    phone: string
    address: string
    status: string
    joinedDate: Date
  }
  statistics: {
    totalRevenue: number
    completedJobs: number
    averageRating: number
    responseTime: string
  }
  activityHistory: IActivityHistory[]
  recentPayments: IRecentPayment[]
}
