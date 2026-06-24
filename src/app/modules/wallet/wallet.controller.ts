import { Request, Response } from 'express'
import httpStatus from 'http-status-codes'
import catchAsync from '../../../shared/catchAsync'
import sendResponse from '../../../shared/sendResponse'
import { WalletService } from './wallet.service'
import { JwtPayload } from 'jsonwebtoken'

const getMyWallet = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const result = await WalletService.getWalletByUserId(user.userId)

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Wallet retrieved successfully',
    data: result,
  })
})

export const WalletController = {
  getMyWallet,
}
