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

export type IContentModerationStats = {
  pendingReports: number
  underReview: number
  resolvedToday: number
  totalReports: number
}

export type IModerationReport = {
  id: string
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  status: string
  reportedUser: {
    id: string
    name: string
  }
  reportedBy: {
    id: string
    name: string
  }
  date: Date
}

export type IModerationLog = {
  action: string
  by: string
  details: string
  timestamp: Date
}

export type IModerationReportDetails = {
  report: IModerationReport & {
    reportId: string
    reportedContent?: string
  }
  userHistory: {
    totalReports: number
    warningsIssued: number
    accountAge: string
    accountStatus: string
  }
  relatedReports: Array<{
    id: string
    title: string
    date: Date
    status: string
  }>
  moderationLog: IModerationLog[]
}

export type IPaymentStats = {
  totalRevenue: {
    amount: number
    percentageChange: number
  }
  commissionsEarned: {
    amount: number
    averageRate: number
  }
  subscriptions: {
    amount: number
    activeSubscribers: number
  }
  refunds: {
    amount: number
    refundRequests: number
  }
  trends: {
    commissions: number[]
    totalTransactions: number[]
    months: string[]
  }
  categories: Array<{
    category: string
    amount: number
  }>
}

export type ITransaction = {
  id: string
  transactionId: string
  user: {
    id: string
    name: string
  }
  type: 'Payment' | 'Subscription' | 'Refund'
  amount: number
  commission: number
  date: Date
  status: 'Completed' | 'Pending' | 'Failed'
}
