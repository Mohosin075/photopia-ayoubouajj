import { Withdrawal } from './withdrawal.model'
import { IWithdrawal } from './withdrawal.interface'
import { WalletService } from '../wallet/wallet.service'
import mongoose from 'mongoose'
import ApiError from '../../../errors/ApiError'
import httpStatus from 'http-status-codes'

const createWithdrawal = async (payload: Partial<IWithdrawal>): Promise<IWithdrawal> => {
  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const { userId, amount } = payload
    if (!userId || !amount) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'User ID and amount are required')
    }

    // Deduct from wallet first to ensure they have balance
    await WalletService.deductBalance(userId.toString(), amount, session)

    const withdrawal = await Withdrawal.create([payload], { session })
    
    await session.commitTransaction()
    return withdrawal[0]
  } catch (error: any) {
    await session.abortTransaction()
    throw new ApiError(httpStatus.BAD_REQUEST, error.message || 'Withdrawal failed')
  } finally {
    session.endSession()
  }
}

const getMyWithdrawals = async (userId: string): Promise<IWithdrawal[]> => {
  return await Withdrawal.find({ userId }).sort({ createdAt: -1 })
}

const getAllWithdrawals = async (): Promise<IWithdrawal[]> => {
  return await Withdrawal.find().populate('userId', 'name email').sort({ createdAt: -1 })
}

const updateWithdrawalStatus = async (
  withdrawalId: string,
  status: 'completed' | 'failed' | 'cancelled',
  transactionId?: string
): Promise<IWithdrawal | null> => {
  const withdrawal = await Withdrawal.findById(withdrawalId)
  if (!withdrawal) throw new ApiError(httpStatus.NOT_FOUND, 'Withdrawal request not found')

  if (withdrawal.status !== 'pending') {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Withdrawal is already processed')
  }

  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    withdrawal.status = status
    withdrawal.processedAt = new Date()

    if (status === 'completed') {
        withdrawal.transactionId = transactionId
    } else if (status === 'failed' || status === 'cancelled') {
        // Refund the wallet if failed or cancelled
        await WalletService.refundBalance(withdrawal.userId, withdrawal.amount, session)
    }

    await withdrawal.save({ session })
    await session.commitTransaction()
    return withdrawal
  } catch (error: any) {
    await session.abortTransaction()
    throw new ApiError(httpStatus.BAD_REQUEST, error.message || 'Failed to update withdrawal status')
  } finally {
    session.endSession()
  }
}

export const WithdrawalService = {
  createWithdrawal,
  getMyWithdrawals,
  getAllWithdrawals,
  updateWithdrawalStatus
}
