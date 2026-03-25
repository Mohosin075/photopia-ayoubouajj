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

export const ProfessionalProfileServices = {
    createProfile,
    getProfile,
    updateProfile,
    stripeConnectOnboarding,
    checkStripeAccountStatus,
}
