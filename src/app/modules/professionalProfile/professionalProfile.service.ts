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
import { AnalyticsService } from '../analytics/analytics.service'

/**
 * Helper to calculate percentage change between two values
 */
const calculateChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0
    return Number(((current - previous) / previous * 100).toFixed(1))
}

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
        user: new Types.ObjectId(userId),
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

    const calculateChangeValue = (current: number, previous: number) => {
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
                percentageChange: calculateChangeValue(currentMonthRevenue, lastMonthRevenue),
            },
        },
    }
}

const updateProfile = async (
    userId: string,
    payload: Partial<IProfessionalProfile>,
) => {
    const existingProfile = await ProfessionalProfile.findOne({ user: userId })
    if (!existingProfile) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Professional profile not found')
    }

    // Append new portfolio items instead of overwriting
    if (payload.portfolio && Array.isArray(payload.portfolio)) {
        payload.portfolio = [...(existingProfile.portfolio || []), ...payload.portfolio]
    }

    // Append new specialties instead of overwriting (optional, but good for consistency)
    if (payload.specialties && Array.isArray(payload.specialties)) {
        payload.specialties = [
            ...new Set([...(existingProfile.specialties || []), ...payload.specialties]),
        ]
    }

    // Append new language instead of overwriting (optional, but good for consistency)
    if (payload.language && Array.isArray(payload.language)) {
        payload.language = [
            ...new Set([...(existingProfile.language || []), ...payload.language]),
        ]
    }

    // Append new documents instead of overwriting
    if (payload.documents && Array.isArray(payload.documents)) {
        payload.documents = [...(existingProfile.documents || []), ...payload.documents]
    }

    const profile = await ProfessionalProfile.findOneAndUpdate(
        { user: userId },
        payload,
        { new: true },
    )
    return profile
}

const removeItem = async (
    userId: string,
    payload: { field: 'portfolio' | 'specialties' | 'language' | 'documents'; values: string[] },
) => {
    const { field, values } = payload
    const profile = await ProfessionalProfile.findOneAndUpdate(
        { user: userId },
        { $pullAll: { [field]: values } } as any,
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
    const profile = await ProfessionalProfile.findOne({ user: userId }).populate('user').lean() as any
    if (!profile) throw new ApiError(StatusCodes.NOT_FOUND, 'Professional profile not found')

    const user = profile.user
    const isPremium = user?.subscriptionStatus === 'active' || user?.subscriptionStatus === 'trialing'


    const now = new Date()
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

    // 1. Core Profile Stats (Common for all)
    const categoryAverageViews = 450
    const viewsPerformance = calculateChange(profile.profileViews || 0, categoryAverageViews)
    const categoryAverageRating = 4.2
    const ratingPerformance = calculateChange(profile.rating || 0, categoryAverageRating)

    // 2. Data Fetching (Parallelized & Conditional)
    const queries: any[] = [
        // Current Month Revenue Stats
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
                    _id: isPremium ? { $week: '$completedAt' } : null,
                    amount: { $sum: '$pricingDetails.providerEarnings' },
                },
            },
            { $sort: { '_id': 1 } }
        ]),
        // Previous Month Revenue Stats
        Booking.aggregate([
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
    ]

    // Only add heavy premium queries if the user is premium
    if (isPremium) {
        queries.push(AnalyticsService.getPremiumAnalytics(userId))
    }

    const [currentMonthData, previousMonthData, premiumMetrics] = await Promise.all(queries)

    // 3. Process Revenue
    const currentMonthRevenue = currentMonthData.reduce((acc: number, curr: any) => acc + curr.amount, 0)
    const previousMonthRevenue = previousMonthData[0]?.totalRevenue || 0
    const revenueChange = calculateChange(currentMonthRevenue, previousMonthRevenue)

    const formattedWeeklyRevenue = isPremium 
        ? currentMonthData.map((w: any, index: number) => ({
            week: `Week ${index + 1}`,
            amount: w.amount
        }))
        : []

    // 4. Final Response Construction
    const response: any = {
        isPremium,
        profileViews: {
            count: profile.profileViews || 0,
            change: -8, // Weekly trend (mocked for now)
            performanceVsCategory: {
                categoryAverage: categoryAverageViews,
                percentageAbove: viewsPerformance
            }
        },
        rating: {
            score: profile.rating || 0,
            reviews: profile.reviewCount || 0,
            performanceVsCategory: {
                categoryAverage: categoryAverageRating,
                percentageHigher: ratingPerformance
            }
        },
        revenueAnalytics: {
            currentMonth: currentMonthRevenue,
            previousMonth: previousMonthRevenue,
            percentageChange: revenueChange,
            averagePerPeriod: currentMonthRevenue / 4,
            bestPerforming: isPremium && formattedWeeklyRevenue.length > 0 
                ? Math.max(...formattedWeeklyRevenue.map((w: any) => w.amount)) 
                : 0,
            weeklyBreakdown: formattedWeeklyRevenue // Only populated if premium
        }
    }

    if (isPremium) {
        response.viewsByRegion = [
            { city: 'New York, NY', percentage: 37.5, count: 450 },
            { city: 'Los Angeles, CA', percentage: 23.3, count: 280 },
            { city: 'Chicago, IL', percentage: 15.4, count: 185 },
            { city: 'Miami, FL', percentage: 12.1, count: 145 },
            { city: 'Boston, MA', percentage: 7.5, count: 90 },
            { city: 'Other', percentage: 4.2, count: 50 },
        ]
        response.premiumMetrics = premiumMetrics
    }

    return response
}

const exportStatisticsReport = async (userId: string) => {
    const stats = await getDetailedStatistics(userId) as any

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
    stats.revenueAnalytics.weeklyBreakdown.forEach((w: { week: string; amount: number }) => {
        worksheet.addRow({ metric: w.week, value: `€${w.amount}` })
    })
    worksheet.addRow({})

    // Add Regions
    if (stats.viewsByRegion && Array.isArray(stats.viewsByRegion)) {
        worksheet.addRow({ metric: 'Region', value: 'Views', details: 'Percentage' })
        stats.viewsByRegion.forEach((r: any) => {
            worksheet.addRow({ metric: r.city, value: r.count, details: `${r.percentage}%` })
        })
    }

    // Style header
    worksheet.getRow(1).font = { bold: true }

    const buffer = await workbook.xlsx.writeBuffer()
    return buffer
}

export const ProfessionalProfileServices = {
    createProfile,
    getProfile,
    updateProfile,
    removeItem,
    stripeConnectOnboarding,
    checkStripeAccountStatus,
    getDetailedStatistics,
    exportStatisticsReport,
}
