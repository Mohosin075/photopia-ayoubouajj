import { Wallet } from './wallet.model'
import { IWallet } from './wallet.interface'
import { Types } from 'mongoose'
import ApiError from '../../../errors/ApiError'
import httpStatus from 'http-status-codes'
import { Booking } from '../booking/booking.model'

const getWalletByUserId = async (userId: string | Types.ObjectId): Promise<any> => {
  let wallet = await Wallet.findOne({ userId })
  if (!wallet) {
    wallet = await Wallet.create({ userId })
  }

  const now = new Date()
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
  const monthBeforeLastStart = new Date(now.getFullYear(), now.getMonth() - 2, 1)
  const monthBeforeLastEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0)

  const [thisMonthStats, lastMonthStats, monthBeforeLastStats] = await Promise.all([
    Booking.aggregate([
      {
        $match: {
          providerId: new Types.ObjectId(userId.toString()),
          status: 'completed',
          completedAt: { $gte: currentMonthStart },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$pricingDetails.providerEarnings' },
        },
      },
    ]),
    Booking.aggregate([
      {
        $match: {
          providerId: new Types.ObjectId(userId.toString()),
          status: 'completed',
          completedAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$pricingDetails.providerEarnings' },
        },
      },
    ]),
    Booking.aggregate([
      {
        $match: {
          providerId: new Types.ObjectId(userId.toString()),
          status: 'completed',
          completedAt: { $gte: monthBeforeLastStart, $lte: monthBeforeLastEnd },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$pricingDetails.providerEarnings' },
        },
      },
    ]),
  ])

  const thisMonthEarnings = thisMonthStats[0]?.total || 0
  const lastMonthEarnings = lastMonthStats[0]?.total || 0
  const monthBeforeLastEarnings = monthBeforeLastStats[0]?.total || 0

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return Number(((current - previous) / previous * 100).toFixed(2))
  }

  return {
    ...wallet.toObject(),
    thisMonthEarnings: {
      amount: thisMonthEarnings,
      percentageChange: calculateChange(thisMonthEarnings, lastMonthEarnings),
    },
    lastMonthEarnings: {
      amount: lastMonthEarnings,
      percentageChange: calculateChange(lastMonthEarnings, monthBeforeLastEarnings),
    },
  }
}

const addEarnings = async (
  userId: string | Types.ObjectId,
  amount: number,
  session?: any
): Promise<IWallet | null> => {
  const wallet = await Wallet.findOneAndUpdate(
    { userId },
    { 
      $inc: { balance: amount, totalEarnings: amount } 
    },
    { session, new: true, upsert: true }
  )
  return wallet
}

const deductBalance = async (
  userId: string | Types.ObjectId,
  amount: number,
  session?: any
): Promise<IWallet | null> => {
  const wallet = await Wallet.findOneAndUpdate(
    { userId, balance: { $gte: amount } },
    { 
      $inc: { balance: -amount, totalWithdrawn: amount } 
    },
    { session, new: true }
  )

  if (!wallet) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Insufficient balance or wallet not found')
  }

  return wallet
}

const refundBalance = async (
  userId: string | Types.ObjectId,
  amount: number,
  session?: any
): Promise<IWallet | null> => {
  const wallet = await Wallet.findOneAndUpdate(
    { userId },
    { 
      $inc: { balance: amount, totalWithdrawn: -amount } 
    },
    { session, new: true }
  )

  if (!wallet) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Wallet not found for refund')
  }

  return wallet
}

export const WalletService = {
  getWalletByUserId,
  addEarnings,
  deductBalance,
  refundBalance
}
