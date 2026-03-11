import { Wallet } from './wallet.model'
import { IWallet } from './wallet.interface'
import { Types } from 'mongoose'
import ApiError from '../../../errors/ApiError'
import httpStatus from 'http-status-codes'

const getWalletByUserId = async (userId: string | Types.ObjectId): Promise<IWallet> => {
  let wallet = await Wallet.findOne({ userId })
  if (!wallet) {
    wallet = await Wallet.create({ userId })
  }
  return wallet
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
