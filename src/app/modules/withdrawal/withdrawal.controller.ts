import { Request, Response } from 'express'
import httpStatus from 'http-status-codes'
import catchAsync from '../../../shared/catchAsync'
import sendResponse from '../../../shared/sendResponse'
import { WithdrawalService } from './withdrawal.service'
import { JwtPayload } from 'jsonwebtoken'

const createWithdrawal = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const payload = { ...req.body, userId: user.userId }
  const result = await WithdrawalService.createWithdrawal(payload)

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Withdrawal requested successfully',
    data: result,
  })
})

const getMyWithdrawals = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const result = await WithdrawalService.getMyWithdrawals(user.userId)

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Withdrawals retrieved successfully',
    data: result,
  })
})

const getAllWithdrawals = catchAsync(async (req: Request, res: Response) => {
  const result = await WithdrawalService.getAllWithdrawals()

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'All withdrawals retrieved successfully',
    data: result,
  })
})

const updateWithdrawalStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params
  const { status, transactionId } = req.body
  const result = await WithdrawalService.updateWithdrawalStatus(id, status, transactionId)

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Withdrawal status updated successfully',
    data: result,
  })
})

export const WithdrawalController = {
  createWithdrawal,
  getMyWithdrawals,
  getAllWithdrawals,
  updateWithdrawalStatus
}
