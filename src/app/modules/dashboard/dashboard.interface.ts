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

export type ITransactionDetails = {
  transaction: ITransaction & {
    paymentMethod: string
    baseAmount: number
    providerReceives: number
    cardholderName: string
    expiryDate: string
    invoiceNumber: string
  }
  paymentHistory: Array<{
    status: string
    amount: number
    timestamp: Date
  }>
  serviceDetails?: {
    type: string
    date: Date
    location: string
    duration: string
  }
  commissionSummary: {
    platformFee: number
    earnings: number
  }
}

export type ISubscriptionStats = {
  totalProvider: {
    count: number
    percentageChange: number
  }
  monthlyRevenue: {
    amount: number
    percentageChange: number
  }
  premiumSubscribers: {
    count: number
    pricePerMonth: number
  }
  noSubscribers: {
    count: number
  }
  subscriberGrowth: {
    months: string[]
    premium: number[]
    noSubscription: number[]
  }
  revenueDistribution: {
    premium: number
    noSubscription: number
  }
  activePlan: {
    name: string
    price: number
    features: string[]
    subscribers: number
    monthlyRevenue: number
  }
}

export type ISubscriber = {
  id: string
  name: string
  email: string
  profile: string
  plan: string
  status: string
  startDate: Date
  nextBilling: Date
  totalRevenue: number
}

export type IAdvancedAnalyticsStats = {
  summary: {
    totalBookings: { count: number; percentageChange: number }
    grossRevenue: { amount: number; percentageChange: number }
    netRevenue: { amount: number; percentageChange: number; commission: number }
    conversionRate: { rate: number; percentageChange: number }
  }
  breakdownByService: Array<{
    serviceType: string
    bookings: number
    avgPrice: number
    grossRevenue: number
    commission: number
    netRevenue: number
  }>
  revenueTrends: {
    months: string[]
    categories: Array<{
      name: string
      data: number[]
    }>
  }
  bookingStatusDistribution: Array<{
    status: string
    count: number
    percentage: number
  }>
  profileToBookingConversion: {
    months: string[]
    bookings: number[]
    conversionRate: number[]
    profileViews: number[]
    totalProfileViews: number
    totalBookings: number
    averageConversionRate: number
  }
  topPerformingProviders: Array<{
    rank: number
    name: string
    bookings: number
    rating: number
    revenue: number
    country: string
  }>
  highestGrowthServices: Array<{
    name: string
    bookings: number
    growthPercentage: number
  }>
}
