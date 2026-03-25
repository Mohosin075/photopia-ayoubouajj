import { StatusCodes } from 'http-status-codes'
import ApiError from '../../../errors/ApiError'
import { IProfessionalProfile } from './professionalProfile.interface'
import { ProfessionalProfile } from './professionalProfile.model'
import { User } from '../user/user.model'
import { USER_ROLES } from '../../../enum/user'
import stripe from '../../../config/stripe'
import config from '../../../config'
import { Booking } from '../booking/booking.model'
import { Types } from 'mongoose'
import ExcelJS from 'exceljs'

const createProfile = async (
    userId: string,
    payload: Partial<IProfessionalProfile>,
) => {
    const user = await User.findById(userId)
    if (!user) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
    }

    const existingProfile = await ProfessionalProfile.findOne({ user: userId })
    if (existingProfile) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Professional profile already exists')
    }

    const result = await ProfessionalProfile.create({
        ...payload,
        user: userId,
    })

    // Add PROFESSIONAL role to user if not already present
    if (!user.roles.includes(USER_ROLES.PROFESSIONAL)) {
        await User.findByIdAndUpdate(userId, {
            $addToSet: { roles: USER_ROLES.PROFESSIONAL },
        })
    }

    return result
}

const getProfile = async (userId: string) => {
    const profile = await ProfessionalProfile.findOne({ user: userId }).populate('user')
    if (!profile) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Professional profile not found')
    }

    // Get Booking Stats
    const now = new Date()
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
    const currentWeekStart = new Date(now.setDate(now.getDate() - now.getDay()))

    const [thisWeekBookings, thisMonthStats, lastMonthStats] = await Promise.all([
        Booking.countDocuments({
            providerId: new Types.ObjectId(userId),
            createdAt: { $gte: currentWeekStart },
        }),
        Booking.aggregate([
            {
                $match: {
                    providerId: new Types.ObjectId(userId),
                    status: 'completed',
                    completedAt: { $gte: currentMonthStart },
                },
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$pricingDetails.providerEarnings' },
                    totalBookings: { $sum: 1 },
                },
            },
        ]),
        Booking.aggregate([
            {
                $match: {
                    providerId: new Types.ObjectId(userId),
                    status: 'completed',
                    completedAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
                },
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$pricingDetails.providerEarnings' },
                },
            },
        ]),
    ])

    const calculateChange = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0
        return Number(((current - previous) / previous * 100).toFixed(2))
    }

    const currentMonthRevenue = thisMonthStats[0]?.totalRevenue || 0
    const lastMonthRevenue = lastMonthStats[0]?.totalRevenue || 0
    const totalBookingsCount = thisMonthStats[0]?.totalBookings || 0

    return {
        ...profile.toObject(),
        statistics: {
            bookings: {
                count: totalBookingsCount,
                thisWeek: thisWeekBookings,
            },
            revenue: {
                amount: currentMonthRevenue,
                percentageChange: calculateChange(currentMonthRevenue, lastMonthRevenue),
            },
        },
    }
}

const updateProfile = async (
    userId: string,
    payload: Partial<IProfessionalProfile>,
) => {
    const profile = await ProfessionalProfile.findOneAndUpdate(
        { user: userId },
        payload,
        { new: true },
    )
    if (!profile) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Professional profile not found')
    }
    return profile
}

const stripeConnectOnboarding = async (userId: string) => {
    const profile = await ProfessionalProfile.findOne({ user: userId }).populate('user')
    if (!profile) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Professional profile not found')
    }

    let stripeAccountId = profile.stripeAccountId

    if (!stripeAccountId) {
        // Create a new Stripe Express account
        const account = await stripe.accounts.create({
            type: 'express',
            email: (profile.user as any).email,
            capabilities: {
                card_payments: { requested: true },
                transfers: { requested: true },
            },
        })
        stripeAccountId = account.id
        profile.stripeAccountId = stripeAccountId
        await profile.save()
    }

    // Generate onboarding link
    const accountLink = await stripe.accountLinks.create({
        account: stripeAccountId,
        refresh_url: `${config.clientUrl}/expired`,
        return_url: `${config.clientUrl}`,
        // refresh_url: `${config.clientUrl}/stripe-connect/refresh`,
        // return_url: `${config.clientUrl}/stripe-connect/return`,
        type: 'account_onboarding',
    })

    return {
        url: accountLink.url,
    }
}

const checkStripeAccountStatus = async (userId: string) => {
    const profile = await ProfessionalProfile.findOne({ user: userId })
    if (!profile) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Professional profile not found')
    }

    if (!profile.stripeAccountId) {
        return { isComplete: false }
    }

    const account = await stripe.accounts.retrieve(profile.stripeAccountId)
    
    if (account.details_submitted && !profile.stripeOnboardingComplete) {
        profile.stripeOnboardingComplete = true
        await profile.save()
    }

    return {
        isComplete: profile.stripeOnboardingComplete,
        detailsSubmitted: account.details_submitted,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
    }
}

const getDetailedStatistics = async (userId: string) => {
    const profile = await ProfessionalProfile.findOne({ user: userId })
    if (!profile) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Professional profile not found')
    }

    const now = new Date()
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

    // 1. Profile Views vs Category Average (Mocked Category Avg)
    const categoryAverageViews = 850
    const viewsPerformance = calculateChange(profile.profileViews, categoryAverageViews)

    // 2. Rating vs Category Average (Mocked Category Avg)
    const categoryAverageRating = 4.3
    const ratingPerformance = calculateChange(profile.rating, categoryAverageRating)

    // 3. Profile Views by Region (Mocked for parity with UI)
    const viewsByRegion = [
        { city: 'New York, NY', percentage: 37.5, count: 450 },
        { city: 'Los Angeles, CA', percentage: 23.3, count: 280 },
        { city: 'Chicago, IL', percentage: 15.4, count: 185 },
        { city: 'Miami, FL', percentage: 12.1, count: 145 },
        { city: 'Boston, MA', percentage: 7.5, count: 90 },
        { city: 'Other', percentage: 4.2, count: 50 },
    ]

    // 4. Revenue Analytics (Weekly Breakdown for current month)
    const weeklyRevenue = await Booking.aggregate([
        {
            $match: {
                providerId: new Types.ObjectId(userId),
                status: 'completed',
                completedAt: { $gte: currentMonthStart },
            },
        },
        {
            $group: {
                _id: { $week: '$completedAt' },
                amount: { $sum: '$pricingDetails.providerEarnings' },
            },
        },
        { $sort: { '_id': 1 } }
    ])

    const formattedWeeklyRevenue = weeklyRevenue.map((w, index) => ({
        week: `Week ${index + 1}`,
        amount: w.amount
    }))

    const currentMonthRevenue = weeklyRevenue.reduce((acc, curr) => acc + curr.amount, 0)

    // Get previous month revenue for comparison
    const previousMonthStats = await Booking.aggregate([
        {
            $match: {
                providerId: new Types.ObjectId(userId),
                status: 'completed',
                completedAt: { $gte: previousMonthStart, $lte: previousMonthEnd },
            },
        },
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: '$pricingDetails.providerEarnings' },
            },
        },
    ])

    const previousMonthRevenue = previousMonthStats[0]?.totalRevenue || 0
    const revenueChange = calculateChange(currentMonthRevenue, previousMonthRevenue)

    return {
        profileViews: {
            count: profile.profileViews,
            change: -8, // Mocked weekly change
            performanceVsCategory: {
                categoryAverage: categoryAverageViews,
                percentageAbove: viewsPerformance
            }
        },
        rating: {
            score: profile.rating,
            reviews: profile.reviewCount,
            performanceVsCategory: {
                categoryAverage: categoryAverageRating,
                percentageHigher: ratingPerformance
            }
        },
        viewsByRegion,
        revenueAnalytics: {
            currentMonth: currentMonthRevenue,
            previousMonth: previousMonthRevenue,
            percentageChange: revenueChange,
            weeklyBreakdown: formattedWeeklyRevenue,
            averagePerPeriod: currentMonthRevenue / 4,
            bestPerforming: Math.max(...formattedWeeklyRevenue.map(w => w.amount), 0)
        }
    }
}

const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return Number(((current - previous) / previous * 100).toFixed(1))
}

const exportStatisticsReport = async (userId: string) => {
    const stats = await getDetailedStatistics(userId)
    const profile = await ProfessionalProfile.findOne({ user: userId }).populate('user')

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Statistics Report')

    worksheet.columns = [
        { header: 'Metric', key: 'metric', width: 30 },
        { header: 'Value', key: 'value', width: 20 },
        { header: 'Details', key: 'details', width: 40 },
    ]

    // Add Overview
    worksheet.addRow({ metric: 'Profile Views', value: stats.profileViews.count, details: `${stats.profileViews.change}% this week` })
    worksheet.addRow({ metric: 'Rating', value: stats.rating.score, details: `${stats.rating.reviews} reviews` })
    worksheet.addRow({})

    // Add Revenue
    worksheet.addRow({ metric: 'Current Month Revenue', value: `€${stats.revenueAnalytics.currentMonth}`, details: `${stats.revenueAnalytics.percentageChange}% vs previous month` })
    stats.revenueAnalytics.weeklyBreakdown.forEach(w => {
        worksheet.addRow({ metric: w.week, value: `€${w.amount}` })
    })
    worksheet.addRow({})

    // Add Regions
    worksheet.addRow({ metric: 'Region', value: 'Views', details: 'Percentage' })
    stats.viewsByRegion.forEach(r => {
        worksheet.addRow({ metric: r.city, value: r.count, details: `${r.percentage}%` })
    })

    // Style header
    worksheet.getRow(1).font = { bold: true }

    const buffer = await workbook.xlsx.writeBuffer()
    return buffer
}

export const ProfessionalProfileServices = {
    createProfile,
    getProfile,
    updateProfile,
    stripeConnectOnboarding,
    checkStripeAccountStatus,
    getDetailedStatistics,
    exportStatisticsReport,
}
